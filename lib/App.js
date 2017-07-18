import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './api.handler';
import uid from 'uid';

export default class {

  constructor(userState, msg, Bot, bot) {
    this.userState = userState;
    this.msg = msg;
    this.Bot = Bot;
    this.bot = bot;

    this.postSubs = 2;
  }

  /**
  * Helpers
  */
  unrecognizedMessage() {
    const reply = this.Bot.Message.text(`Sorry, I'm just a robot, can you please try one of the selections below.`);
    reply.addResponseKeyboard(['Browse jobs', 'Post a job']);
    this.bot.send(reply, this.msg.from);
  }

  sendErrMessage(err, number) {
    console.log(err.message);
    const reply = `
      Oops, I did something wrong!
      Please contact the admin, error code ${number}...

      Don't give up on me though.
    `;

    this.bot.send(reply, ['Browse jobs', 'Post a job'], this.msg.from);
  }

  removeSpaces(str) {
    return str.replace(/\s/g, '').toLowerCase();
  }

  sendMsg(replyMsg, choices, tooWho) {
    const reply = this.Bot.Message.text(replyMsg);
    reply.addResponseKeyboard(choices);
    this.bot.send(reply, tooWho);
  }

  clearChat() {
    state.resetState(this.userState.chatId, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A10');
        return;
      }

      this.sendMsg(`Great, is there anything else I can do for you today?`, ['Browse jobs', 'Post a job'], this.msg.from);
    });
  }

  makeSubStageDataIntoObject() {
    return _.reduce(this.userState.subStageData, (madeObj, obj) => {
      madeObj[_.keys(obj)[0]] = _.values(obj)[0];
      return madeObj;
    }, {});
  }
}