import { _ } from 'lodash';
import state from './db/state.handler';
import choices from './choices';
import apiHandler from './api-handler';
import uid from 'uid';
import WhichKind from './WhichKind';

export default class {
  constructor(userState, msg, Bot, bot) {
    this.userState = userState;
    this.msg = msg;
    this.Bot = Bot;
    this.bot = bot;

    this.postSubs = 2;

    this.init();
  }

  /**
  *Stages --> all lowercase because I am converting the input to these
  */

  browsejobs() {
    console.log('browsejobs');

    this.sendMsg(`BROWSE JOBS`, choices.one, this.msg.from);
  }

  // Post job
  postajob() {
    console.log('postajob');

    this.bot.getUserProfile(this.msg.from)
      .then(user => {
        apiHandler.postUser(user.username, user.firstName, user.lastName, user.profilePicUrl, (err, data) => {
          if (err) {
            this.msg.reply(`Oops, I did something wrong! Please contact the admin. error code A2`);
            return;
          }

          state.updateSubStage(this.userState.chatId, 1, uid(20), (err, data) => {
            if (err) {
              console.log(err.message);
              this.msg.reply(`Oops, I did something wrong! Please contact the admin. error code A3`);
              return;
            }
            WhichKind.allowAnything = true;
            this.msg.reply(`Enter skills`);
          });
        });
      });
  }

  postajob1() {
    state.updateSubStage(this.userState.chatId, 2, this.msg.body, (err, data) => {
      if (err) {
        console.log(err.message);
        this.msg.reply(`Oops, I did something wrong! Please contact the admin. error code A4`);
        return;
      }

      this.msg.reply(`Enter price range`);
    });
  }

  postajob2() {
    state.updateSubStage(this.userState.chatId, 3, this.msg.body, (err, data) => {
      if (err) {
        console.log(err.message);
        this.msg.reply(`Oops, I did something wrong! Please contact the admin. error code A5`);
        return;
      }

      this.msg.reply(`Enter a brief description of the work`);
    });
  }

  postajob3() {
    state.updateSubStage(this.userState.chatId, 4, this.msg.body, (err, body) => {
      if (err) {
        console.log(err.message);
        this.msg.reply(`Oops, I did something wrong! Please contact the admin. error code A6`);
        return;
      }
      const replyMsg = `
        Skills: ${this.userState.subStageData[1]}
        Price range: ${this.userState.subStageData[2]}
        Description: ${this.msg.body}
      `;

      this.sendMsg(replyMsg, ['Looks good!', 'Start over'], this.msg.from);
    });
  }

  postajob4() {//FINAL
    if (this.msg.body === 'Looks good!') {
      this.postLooksGood();
    } else if (this.msg.body === 'Start over') {
      this.postStartOver();
    } else {
      const replyMsg = `
        Sorry, I'm just a robot, can you please try one of the selections below.
      `;

      this.sendMsg(replyMsg, ['Looks good!', 'Start over'], this.msg.from);
    }
  }

  postLooksGood() {
    console.log('postLooksGood');
    this.clearChat(this.restart.bind(this));
  }

  postStartOver() {
    console.log('postStartOver');
    this.clearChat(this.restart.bind(this));
  }
  //end Post job

  restart() {
    console.log('restart');
    this.sendMsg(`Ok, what would you like to do?`, choices.one, this.msg.from);
  }

  /**
  * Helpers
  */
  removeSpaces(str) {
    return str.replace(/\s/g, '').toLowerCase();
  }

  sendMsg(replyMsg, choices, tooWho) {
    const reply = this.Bot.Message.text(replyMsg);
    reply.addResponseKeyboard(choices);
    this.bot.send(reply, tooWho);
  }

  clearChat(cb) {
    WhichKind.allowAnything = false;
    state.deleteChat(this.userState.chatId, (err, data) => {
        if (err) {
          console.log(err.message);
          this.msg.reply(`Oops, I did something wrong! Please contact the admin. error code A7`);
          return;
        }
        if (cb !== undefined) {
          cb();
        }
        console.log('CHAT CLEARED');
      });
  }

  /**
  * initialize function call
  */
  init() {
    if (this.userState.subStage > 0) {
      console.log('POST A JOB SUB STAGE > 0');
      this[this.removeSpaces(this.userState.stage) + this.userState.subStage]();
    } else {
      this[this.removeSpaces(this.userState.stage)]();
    }
  }
}
