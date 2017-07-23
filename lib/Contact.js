import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './api.handler';
import uid from 'uid';
import skills from './skills';

import App from './App';

export default class extends App {
  constructor(userState, msg, Bot, bot, stage) {
    super(userState, msg, Bot, bot);

    this.init();
  }

  setInitialState() {
    state.updateStage(this.msg.chatId, {stage: 'Contact'}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'C1');

      state.addSubStageDataContact(this.userState.chatId, {subStage: 1,subStageData: []}, (err, data) => {
        if (err) return this.sendErrMessage(err, 'C2');

        const replyMsg = `
          Name your price.
        `;

        this.msg.reply(replyMsg);
      })
    })
  }

  setQuote() {
    state.updateSubStageContact(this.msg.chatId, {subStage: 2, subStageData: {price: this.msg.body}}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'A3');

      const replyMsg = `
        ${this.msg.body} is your quote?
      `;

      this.sendMsg(replyMsg, ['Perfect!', 'Let me rethink that'], this.msg.from);
    })
  }

  quoteLooksGood() {
    apiHandler.getPost(this.userState.postShowing, (err, data) => {
      if (err) return this.sendErrMessage(err, 'A4');

      const post = data[0];
      const subStageData = this.makeSubStageDataIntoObject();

      const replyMsg = `
        Your quote of ${subStageData.price} for ${post.description} is being sent now to the poster. If they pick your bid I will contact you.
      `;

      state.deleteChat(this.userState.chatId, err => {
        if (err) return this.sendErrMessage(err, 'A5');

        this.sendMsg(replyMsg, ['Begin new session'], this.msg.from);
      })
    })
  }

  quoteLooksBad() {

  }

  index() {
    switch(this.userState.subStage) {
      case 1:
        this.setQuote();
        break;
      case 2:
        switch(this.msg.body) {
          case 'Perfect!':
            this.quoteLooksGood();
            break;
          case 'Let me rething that':
            this.quoteLooksBad();
            break;
        }
        break;
    }
  }

  init() {
    switch(this.userState.stage) {
      case 'Contact':
        this.index();
        break;
      default:
        this.setInitialState();
        break;
    }
  }
}