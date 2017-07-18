import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './api.handler';
import uid from 'uid';

import App from './App';

export default class extends App {

  constructor(userState, msg, Bot, bot) {
    super(userState, msg, Bot, bot);
    this.init();
  }

  addUserToApi() {
    this.bot.getUserProfile(this.msg.from)
      .then(user => {

        apiHandler.postUser(user.username, user.firstName, user.lastName, user.profilePicUrl, (err, data) => {
          if (err) {
            this.sendErrMessage(err, 'A2');
            return;
          }

          state.updateSubStagePost(this.userState.chatId, 1, {posted_id: uid(20)}, (err, data) => {
            if (err) {
              this.sendErrMessage(err, 'A3');
              return;
            }

            state.setAllowAnything(this.userState.chatId, true, (err, data) => {
              if (err) {
                this.sendErrMessage(err, 'A9')
                return;
              }

              this.msg.reply(`Enter skills`);
            });
          });
        });
      });
  }

  step1() {
    state.updateSubStagePost(this.userState.chatId, 2, {skills :this.msg.body}, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A4');
        return;
      }

      this.msg.reply(`Enter price range`);
    });
  }

  step2() {
    state.updateSubStagePost(this.userState.chatId, 3, {price_range: this.msg.body}, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A5');
        return;
      }

      this.msg.reply(`Enter a brief description of the work`);
    });
  }

  step3() {
    state.updateSubStagePost(this.userState.chatId, 4, {project: this.msg.body}, (err, body) => {
      if (err) {
        this.sendErrMessage(err, 'A6')
        return;
      }

      const subStageData = this.makeSubStageDataIntoObject();

      const replyMsg = `
        How's this look...

        Skills: ${subStageData.skills}
        Price range: ${subStageData.price_range}
        Description: ${this.msg.body}
      `;

      this.sendMsg(replyMsg, ['Looks good!', 'Start over'], this.msg.from);
    });
  }

  step4() {
    if (this.msg.body === 'Looks good!') {
      this.postLooksGood();
    } else if (this.msg.body === 'Start over') {
      this.clearChat();
    } else {
      const replyMsg = `
        Sorry, I'm just a robot, can you please try one of the selections below.
      `;

      this.sendMsg(replyMsg, ['Looks good!', 'Start over'], this.msg.from);
    }
  }

  postLooksGood() {
    this.bot.getUserProfile(this.msg.from)
      .then(user => {
        const prep = this.makeSubStageDataIntoObject();
        prep.username = user.username;

        apiHandler.postPost(prep, (err, data) => {
          if (err) {
            this.sendErrMessage(err, 'A7');
            return;
          }

          this.clearChat();
        });
      });
  }

  init() {
    if (this.userState.subStage > 0) {
      this['step' + this.userState.subStage]();
    } else {
      this.addUserToApi();
    }
  }
}








