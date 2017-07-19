import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './api.handler';
import uid from 'uid';
import skills from './skills';

import App from './App';

export default class extends App {

  constructor(userState, msg, Bot, bot) {
    super(userState, msg, Bot, bot);
    this.init();
  }

  begin() {
    state.addSubStageDataBrowse(this.userState.chatId, ['begin'], (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A16');
        return;
      }

      state.setAllowAnything(this.userState.chatId, true, (err, data) => {
        if (err) {
          this.sendErrMessage(err, 'A14');
          return;
        }

        const replyMsg = `
          Select a skill or get all the posts to date.
        `;

        const skillSet = skills.slice();
        skillSet.push('Get all posts');
        skillSet.push('Start over');

        this.sendMsg(replyMsg, skillSet, this.msg.from);
      })
    })
  }

  gatherJobs(query) {
    query = query === 'Get all posts' ? null : query;

    apiHandler.getPosts(query, (err, posts) => {
      if (err) {
        this.sendErrMessage(err, 'A11');
        return;
      }

      if (posts.length) {

        this.setInitialState(posts);
      } else {

        state.resetState(this.userState.chatId, (err) => {
          if (err) {
            this.sendErrMessage(err, 'A17');
            return;
          }

          const replyMsg = `
            No jobs posted with that query yet. Be the first!
          `;

          this.sendMsg(replyMsg, ['Browse jobs', 'Post a job'], this.msg.from);
        });
      }
    })
  }

  setInitialState(posts) {

    state.addSubStageDataBrowse(this.userState.chatId, posts, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A12');
        return;
      }

      this.userState.subStage = 0;
      this.userState.subStageData = posts;

      this.displayJob(this.nextUpIncrease());
    })
  }

  displayJob(nextUp) {
    state.updateSubStageBrowse(this.userState.chatId, nextUp, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A15');
        return;
      }
      const post = this.userState.subStageData[nextUp - 1];

      const postMsg = `
        Id: ${post.posted_id}

        Skill: ${post.skills}
        Price range: ${post.price_range} ${post.payment_type} per ${post.price_per}

        Description: ${post.description}

        # ${nextUp} of ${this.userState.subStageData.length}
      `;

      this.sendMsg(postMsg, ['<-- Prev', 'Next -->', 'Contact', 'Start over'], this.msg.from);
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
      case 'Contact':
        this.contactJob();
        return;
      default:
        this.sendMsg(`Sorry, I didn't catch that.`, ['Browse jobs', 'Post a job'], this.msg.from);
        return;
    }
  }

  init() {
    if (this.userState.subStage > 0) {
      this.index();
    } else if (this.userState.subStageData[0] === 'begin') {
      this.gatherJobs(this.msg.body);
    } else {
      this.begin();
    }
  }
}