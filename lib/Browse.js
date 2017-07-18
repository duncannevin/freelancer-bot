import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './api.handler';
import uid from 'uid';

import App from './App';

export default class extends App {

  constructor(userState, msg, Bot, bot) {
    super(userState, msg, Bot, bot);
    this.nextUp;
    this.init();
  }

  gatherJobs() {
    apiHandler.getPosts((err, posts) => {
      if (err) {
        this.sendErrMessage(err, 'A11');
        return;
      }

      state.addSubStageDataBrowse(this.userState.chatId, posts, (err, data) => {
        if (err) {
          this.sendErrMessage(err, 'A12');
          return;
        }

        state.setAllowAnything(this.userState.chatId, true, (err, data) => {
          if (err) {
            this.sendErrMessage(err, 'A14');
            return;
          }

          this.userState.subStage = 0;
          this.userState.subStageData = posts;

          this.index();
        })
      })
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

  index() {
    let nextUp;

    switch(this.msg.body) {
      case '<-- Prev':
        nextUp = this.userState.subStage === 1 ? this.userState.subStageData.length : this.userState.subStage -= 1;
        break;
      case 'Browse jobs':
      case 'Next -->':
        nextUp = this.userState.subStage === this.userState.subStageData.length ? 1 : this.userState.subStage += 1;
        break;
      case 'Contact':
        this.contactJob();
        return;
      default:
        this.sendMsg(`Sorry, I didn't catch that.`, choices.one, this.msg.from);
        return;
    }

    this.displayJob(nextUp);
  }

  init() {
    if (this.userState.subStage > 0) {
      this.index();
    } else {
      this.gatherJobs();
    }
  }
}