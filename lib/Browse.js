import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './api.handler';
import uid from 'uid';
import skills from './skills';

import App from './App';

export default class extends App {

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

        const skillSet = skills.slice();
        skillSet.push('End session');

        this.sendMsg(replyMsg, skillSet, this.msg.from);
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

        state.resetState(this.userState.chatId, (err) => {
          if (err) {
            this.sendErrMessage(err, 'A17');
            return;
          }

          const replyMsg = `
            No jobs posted for that skillset yet.
          `;

          this.clearChat(replyMsg);
        });
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

      this.bot.getUserProfile(post.username)
        .then(user => {
          const postMsg = `

            This is a ${post.skills} ${type}. Here is what ${user.firstName} has to say about it...

            ${post.description} ${post.price_range}

            ${type} # ${nextUp} of ${this.userState.subStageData.length}
            ${post.posted_id}
          `;

          this.sendMsg(postMsg, ['<-- Prev', 'Next -->', 'Contact', 'End session'], this.msg.from);
        })

    })
  }

  nextUpIncrease() {

    return this.userState.subStage === this.userState.subStageData.length ? 1 : this.userState.subStage += 1;
  }

  nextUpDecrease() {

    return this.userState.subStage === 1 ? this.userState.subStageData.length : this.userState.subStage -= 1;
  }

  index() {

    switch(this.msg.body) {
      case '<-- Prev':
        this.displayJob(this.nextUpDecrease());
        break;
      case 'Browse jobs':
      case 'Next -->':
        this.displayJob(this.nextUpIncrease());
        break;
      default:
        this.sendMsg(`Sorry, I didn't catch that.`, ['Browse jobs', 'End session'], this.msg.from);
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