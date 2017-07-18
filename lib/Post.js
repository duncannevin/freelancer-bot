import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './api.handler';
import uid from 'uid';
import skills from './skills';
import priceRanges from './price_ranges';

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
            this.sendErrMessage(err, 'A1');
            return;
          }

          this.setInitialState();
        })
      })
  }

  setInitialState() {
    state.updateSubStagePost(this.userState.chatId, 1, {posted_id: uid(20)}, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A2');
        return;
      }

      state.setAllowAnything(this.userState.chatId, true, (err, data) => {
        if (err) {
          this.sendErrMessage(err, 'A3')
          return;
        }

        const replyMsg = `
          Select a skill or add your own manually.

          Selecting a skill makes it easier for freelancers to find your post.
        `;

        let skillList = skills.slice();
        skillList.push('Start over')

        this.sendMsg(replyMsg, skillList, this.msg.from);
      })
    })
  }

  step1() {
    state.updateSubStagePost(this.userState.chatId, 2, {skills:this.msg.body}, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A4');
        return;
      }

      const replyMsg = `
        Select a payment type or add one manually.
      `;
      const paymentTypes = [
        'BTC',
        'LTC',
        'ETH',
        'ZEC',
        'DASH',
        'XRP',
        'XMR',
        'USD',
        'CAD',
        'AUD',
        'EUR',
        'JPY',
        'CNY',
        'GBP',
      ];
      paymentTypes.push('Start over');

      this.sendMsg(replyMsg, paymentTypes, this.msg.from);
    })
  }

  step2() {
    state.updateSubStagePost(this.userState.chatId, 3, {payment_type: this.msg.body}, (err) => {
      if (err) {
        this.sendErrMessage(err, 'A5')
        return;
      }

      const replyMsg = `
        Select a price range or add one manually.
      `;
      const priceRangeList = priceRanges.slice();
      priceRangeList.push('Start over');

      this.sendMsg(replyMsg, priceRangeList, this.msg.from);
    })
  }

  step3() {
    state.updateSubStagePost(this.userState.chatId, 4, {price_range: this.msg.body}, (err) => {
      if (err) {
        this.sendErrMessage(err, 'A6');
        return;
      }

      const replyMsg = `
        Select payment basis or add one manually.
      `;
      const pers = [
        'Day',
        'Hour',
        'Job',
      ];
      pers.push('Start over');

      this.sendMsg(replyMsg, pers, this.msg.from);
    })
  }

  step4() {
    state.updateSubStagePost(this.userState.chatId, 5, {price_per: this.msg.body}, (err) => {
      if (err) {
        this.sendErrMessage(err, 'A7');
        return;
      }

      const replyMsg = `
        Describe the job.
      `;

      this.msg.reply(replyMsg);
    })
  }

  step5() {
    state.updateSubStagePost(this.userState.chatId, 6, {description: this.msg.body}, (err) => {
      if (err) {
        this.sendErrMessage(err, 'A8');
        return;
      }

      const postData = this.makeSubStageDataIntoObject();
      postData.pricePer = this.msg.body;

      const replyMsg = `
        Look right...

        Skill: ${postData.skills}
        Price range: ${postData.price_range} ${postData.payment_type} per ${postData.price_per}

        Description: ${this.msg.body}
      `;

      const choices = [
        'Yes',
        'No',
      ];

      this.sendMsg(replyMsg, choices, this.msg.from);
    })
  }

  step6() {
    switch(this.msg.body) {
      case 'Yes':
        this.postLooksGood();
        break;
      case 'No':
        this.clearChat();
        break;
      default:
        const reply = this.Bot.Message.text(`Sorry, I'm just a robot, can you please try one of the selections below.`);
        reply.addResponseKeyboard(['Yes', 'No']);
        this.bot.send(reply, this.msg.from);
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
      })
  }

  init() {
    if (this.userState.subStage > 0) {
      this['step' + this.userState.subStage]();
    } else {
      this.addUserToApi();
    }
  }
}








