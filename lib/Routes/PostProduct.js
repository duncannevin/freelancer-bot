import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import skills from '../assets/skills';
import masterStages from '../assets/masterStages';
import productPrices from '../assets/product_prices';

import Main from './Main';

export default class extends Main {
  constructor(userState, msg, Bot, bot) {
    super(userState, msg, Bot, bot);
    this.init();
  }

  setInitialState() {
    state.updateSubStagePost(this.userState.chatId, 1, {posted_id: uid(12)}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'PP2');

      state.setAllowAnything(this.userState.chatId, true, (err, data) => {
        if (err) return this.sendErrMessage(err, 'PP3')

        const replyMsg = `
          What category does this product fall under?
        `;

        this.sendMsg(replyMsg, this.msg.from, {choices: skills});
      })
    })
  }

  updateSkillset() {

    state.updateSubStagePost(this.userState.chatId, 2, {skills: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PP5');

      const replyMsg = `
        Describe your product. Be as detailed as you need to be.
      `;

      this.msg.reply(replyMsg);
    })
  }

  updateDescription() {
    state.updateSubStagePost(this.userState.chatId, 3, {description: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PP7');

      const replyMsg = `
        How much do you expect to get for this product? Feel free to enter your own value.
      `;

      this.sendMsg(replyMsg, this.msg.from, {choices: productPrices});
    })
  }

  updatePrice() {
    state.updateSubStagePost(this.userState.chatId, 4, {price_range: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PP6');

      const postData = this.makeSubStageDataIntoObject();
      postData.pricePer = this.msg.body;

     this.bot.getUserProfile(this.msg.from)
        .then(user => {
          const replyMsg = `
            This is a ${postData.skills} product. Here is what ${user.firstName} has to say about it...

            ${postData.description}

            ${this.msg.body}

            product # 1 of 100
          `;

          const choices = [
            'Looks great!',
            'Not what I was expecting',
          ];

          this.sendMsg(replyMsg, this.msg.from, {choices: choices});
        })
    })
  }


  confirmation() {

    switch(this.msg.body) {
      case 'Looks great!':
        this.postLooksGood();
        break;
      case 'Not what I was expecting':
        this.postLooksWrong();
        break;
      default:
        const reply = this.Bot.Message.text(`Sorry, I'm just a robot, can you please try one of the selections below.`);
        reply.addResponseKeyboard(['Yes', 'No']);
        this.bot.send(reply, this.msg.from);
        break;
    }
  }

  postLooksGood() {

    this.bot.getUserProfile(this.msg.from)
      .then(user => {

        const prep = this.makeSubStageDataIntoObject();
        prep.username = user.username;
        prep.type = 'product';

        apiHandler.postPost(prep, (err, data) => {
          if (err) {
            this.sendErrMessage(err, 'PJ7');
            return;
          }

          const replyMsg = `
            Your product has been successfully added! I will send you a message when someone is interested. Thank you!
          `;

          this.clearChat(replyMsg);
        });
      })
  }

  postLooksWrong() {

    this.bot.send(`Oh dang.`, this.msg.from)
      .then(_ => {
        this.setInitialState();
      })
  }


  index() {
    switch(this.userState.subStage) {
      case 0:
        this.setInitialState();
        break;
      case 1:
        this.unrecognizedErr(skills, this.updateSkillset.bind(this));
        break;
      case 2:
        this.updateDescription();
        break;
      case 3:
        this.updatePrice();
        break;
      case 4:
        this.unrecognizedErr(['Looks great!', 'Not what I was expecting'], this.confirmation.bind(this));
        break;
      default:
        this.clearChat(`Sorry I didn't catch that.`);
        break;
    }
  }

  init() {
    switch(this.userState.stage) {
      case undefined:
        state.updateStage(this.userState.chatId, {stage: 'Post a product'}, err => {
          if (err) return this.sendErrMessage(err, 'PP8');
          this.index();
        });
        break;
      default:
        this.index();
        break;
    }
  }
}