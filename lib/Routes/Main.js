import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import masterStages from '../assets/masterStages';

export default class {
  constructor(userState, msg, Bot, bot, stage) {
    this.userState = userState;
    this.msg = msg;
    this.Bot = Bot;
    this.bot = bot;
    this.stage = stage;

    this.postSubs = 2;
  }

  /**
  * Helpers
  */

  unrecognizedErr(correctReponses, runStage) {
    if (correctReponses.includes(this.msg.body)) {
      runStage();
    } else {

      const reply = this.Bot.Message.text(`I'm sorry, I didn't catch that?`);

      reply.addResponseKeyboard(correctReponses);

      this.bot.send(reply, this.msg.from);
    }
  }

  sendErrMessage(err, number) {
    console.log(err.message);
    state.deleteChat(this.userState.chatId, err => {
      if (err) return this.msg.reply('Fatal, please type \'Main menu\' into the chat.');

      const reply = this.Bot.Message.text(`
        Oops, I did something wrong! Please contact the admin, error code ${number}.

        Don't give up on me though...
      `);
      reply.addResponseKeyboard(masterStages);
      this.bot.send(reply, this.msg.from);
    });
  }

  removeSpaces(str) {
    return str.replace(/\s/g, '').toLowerCase();
  }

  sendMsg(replyMsg, choices, tooWho) {
    const reply = this.Bot.Message.text(replyMsg);
    if (choices) {
      reply.addResponseKeyboard(choices);
    }
    this.bot.send(reply, tooWho);
  }

  clearChat(message) {
    state.resetState(this.userState.chatId, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A10');
        return;
      }

      this.sendMsg(message, masterStages, this.msg.from);
    });
  }

  makeSubStageDataIntoObject() {
    return _.reduce(this.userState.subStageData, (madeObj, obj) => {
      madeObj[_.keys(obj)[0]] = _.values(obj)[0];
      return madeObj;
    }, {});
  }

  nextUpIncrease() {
    return this.userState.subStage === this.userState.subStageData.length ? 1 : this.userState.subStage += 1;
  }

  nextUpDecrease() {
    return this.userState.subStage === 1 ? this.userState.subStageData.length : this.userState.subStage -= 1;
  }
}