import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import skills from '../assets/skills';
import moment from 'moment';

import Main from './Main';

export default class extends Main {

  constructor(userState, msg, Bot, bot, stage) {
    super(userState, msg, Bot, bot);
    this.stage = stage;
    this.init();
  }

  begin() {

    state.addSubStageDataBrowse(this.userState.chatId, ['begin'], (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A16');
        return;
      }

      state.setAllowAnything(this.userState.chatId, true, (err, data) => {
        if (err) return this.sendErrMessage(err, 'A14');

        const replyMsg = `
          Let's narrow things down a little by selecting a skillset first.
        `;

        this.sendMsg(replyMsg, this.msg.from, {choices: skills});
      })
    })
  }

  gatherJobs(query) {
    const type = this.stage.split(' ')[1].slice(0, -1);

    apiHandler.getPosts(query, type, (err, posts) => {
      if (err) return this.sendErrMessage(err, 'A11');

      if (posts.length) {

        this.setInitialState(posts);
      } else {

        const replyMsg = `
          No jobs posted for that skillset yet.
        `;

        this.sendMsg(replyMsg, this.msg.from, {choices: skills});
      }
    })
  }

  setInitialState(posts) {

    state.addSubStageDataBrowse(this.userState.chatId, posts, (err, data) => {
      if (err) return this.sendErrMessage(err, 'A12');

      this.userState.subStage = 0;
      this.userState.subStageData = posts;

      this.displayJob(this.nextUpIncrease());
    })
  }

  displayJob(nextUp) {

    const post = this.userState.subStageData[nextUp - 1];

    state.updateSubStageBrowse(this.userState.chatId, {subStage: nextUp, postShowing: post.posted_id}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'A15');

      const type = this.stage.split(' ')[1].slice(0, -1);

      apiHandler.getUser(post.username, (err, userData) => {
        if (err) return this.sendErrMessage(err, 'A17');

        userData = userData[0];

        apiHandler.getAvgRating(userData.username, 'all', (err, rating) => {
          if (err) return this.sendErrMessage(err, 'A18');

          let postMsg = `
            I have an average overall rating of ${_.values(rating)[0]} out of 5. This is a ${post.skills} job.

            Description: ${post.description}

            Price expectation: ${post.price_range.split('?')[0]}

             ${type} # ${nextUp} of ${this.userState.subStageData.length}
          `;

          const choices = ['<-- Prev', 'Next -->', 'Main menu'];

          if (this.msg.from !== post.username) {
            choices.splice(-1, 0, 'Contact');
          }

          let options = {choices: choices};

          const showUserData = post.price_range.split('?')[1];

          if (showUserData === 'Yes!') {
            postMsg = `
              Hello my name is ${userData.first_name} and I have been a user since ${moment(userData.created_at).calendar()}.
            `.concat('\n' + postMsg);

            options.image = userData.profile_pic_url;
          }

          this.sendMsg(postMsg, this.msg.from, options);
        });
      })
    })
  }

  index() {

    switch(this.msg.body) {
      case '<-- Prev':
        this.displayJob(this.nextUpDecrease());
        break;
      case 'Browse jobs':
      case 'Browse products':
      case 'Next -->':
        this.displayJob(this.nextUpIncrease());
        break;
      default:
        this.sendMsg(`Sorry, I didn't catch that.`, this.msg.from, {choices: ['<-- Prev', 'Next -->', 'Main menu']});
        return;
    }
  }

  startIt() {
    if (this.userState.subStage > 0) {
      this.index();
    } else if (this.userState.subStageData[0] === 'begin') {
      this.gatherJobs(this.msg.body);
    } else {
      this.begin();
    }
  }

  init() {
    state.updateStage(this.userState.chatId, {stage: this.stage}, err => {
      if (err) return this.sendErrMessage(err, 'PP8');
      this.startIt();
    });
  }
}