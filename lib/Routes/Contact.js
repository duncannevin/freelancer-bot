import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import skills from '../assets/skills';

import Main from './Main';

export default class extends Main {
  constructor(userState, msg, Bot, bot, stage) {
    super(userState, msg, Bot, bot);

    this.init();
  }

  setInitialState() {
    state.updateStage(this.msg.chatId, {stage: 'Contact'}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'C1');

      state.addSubStageDataContact(this.userState.chatId, {subStage: 1, subStageData: []}, (err, data) => {
        if (err) return this.sendErrMessage(err, 'C2');

        const replyMsg = `
          Place your quote.
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
    this.bot.getUserProfile(this.msg.from)
      .then(user => {
        apiHandler.getPost(this.userState.postShowing, (err, data) => {
          if (err) return this.sendErrMessage(err, 'A4');

          const post = data[0];
          const subStageData = this.makeSubStageDataIntoObject();

          const replyMsg = `
            Your quote of ${subStageData.price} for - ${post.description} - is being sent now to the poster. If they pick your quote I will connect you with them. Thank you!
          `;

          const posterMsg = `
            ${user.firstName} is quoting you ${subStageData.price} for - ${post.description} - to award this project select 'Check your posts' then '${post.type[0].toUpperCase() + post.type.slice(1)} postings'.
          `;

          apiHandler.postBid({username: user.username, price: subStageData.price, posted_id: post.posted_id}, (err) => {
            if (err) return this.sendErrMessage(err, 'A6');

            state.deleteChat(this.userState.chatId, err => {
              if (err) return this.sendErrMessage(err, 'A5');

              this.sendMsg(posterMsg, false, post.username);

              this.sendMsg(replyMsg, ['Begin new session'], this.msg.from);
            })
          })
        })
      })
  }

  quoteLooksBad() {
    this.setInitialState();
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
          case 'Let me rethink that':
            this.quoteLooksBad();
            break;
        }
        break;
      default:

        return;
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