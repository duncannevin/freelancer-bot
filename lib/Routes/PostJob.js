import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import skills from '../assets/skills';
import priceRanges from '../assets/price_ranges';

import Main from './Main';

export default class extends Main {

  constructor(userState, msg, Bot, bot) {
    super(userState, msg, Bot, bot);
    this.init();
  }

  addUserToApi() {

    this.bot.getUserProfile(this.msg.from)
      .then(user => {

        apiHandler.postUser(user.username, user.firstName, user.lastName, user.profilePicUrl, (err, data) => {
          if (err) {
            this.sendErrMessage(err, 'PJ1');
            return;
          }

          this.setInitialState();
        })
      })
  }

  setInitialState() {

    state.updateSubStagePost(this.userState.chatId, 1, {posted_id: uid(12)}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'PJ2');

      state.setAllowAnything(this.userState.chatId, true, (err, data) => {
        if (err) {
          this.sendErrMessage(err, 'PJ3')
          return;
        }

        const replyMsg = `
          Choose a skillset.
        `;

        let skillList = skills.slice();
        skillList.push('End session');

        this.sendMsg(replyMsg, skillList, this.msg.from);
      })
    })
  }

  updateSkillset() {

    state.updateSubStagePost(this.userState.chatId, 2, {skills: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PJ5')

      const replyMsg = `
        Choose a price expectation.
      `;
      const priceRangeList = priceRanges.slice();
      priceRangeList.push('End session');

      this.sendMsg(replyMsg, priceRangeList, this.msg.from);
    })
  }

  updatePricing() {

    state.updateSubStagePost(this.userState.chatId, 3, {price_range: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PJ7');

      const replyMsg = `
        What does this job entail? Be as descriptive as you need to be.
      `;

      this.msg.reply(replyMsg);
    })
  }

  updateDescription() {

    state.updateSubStagePost(this.userState.chatId, 4, {description: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PJ8');

      const postData = this.makeSubStageDataIntoObject();
      postData.pricePer = this.msg.body;

      this.bot.getUserProfile(this.msg.from)
        .then(user => {
          const replyMsg = `
            This is a ${postData.skills} job. Here is what ${user.firstName} has to say about it...

            ${this.msg.body}

            ${postData.price_range}

            job # 1 of 100
          `;

          const choices = [
            'Looks great!',
            'Not what I was expecting',
          ];

          this.sendMsg(replyMsg, choices, this.msg.from);
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
        prep.type = 'job';

        apiHandler.postPost(prep, (err, data) => {
          if (err) return this.sendErrMessage(err, 'PJ7');

          state.deleteChat(this.userState.chatId, (err) => {
            if (err) return this.sendErrMessage(err, 'PP9');

            const replyMsg = `
              Your post has been successfully added! I will send you a message each time someone places a quote.
            `;

            this.sendMsg(replyMsg, [`Begin new session`], this.msg.from);
          });
        });
      })
  }

  postLooksWrong() {

    this.bot.send(`Oh dang. I'll reset everything for you.`, this.msg.from)
      .then(_ => {
        this.setInitialState();
      })
  }

  index() {

    switch(this.userState.subStage) {
      case 0:
        this.addUserToApi();
        break;
      case 1:
        this.unrecognizedErr(skills, this.updateSkillset.bind(this));
        break;
      case 2:
        this.unrecognizedErr(priceRanges, this.updatePricing.bind(this));
        break;
      case 3:
        this.updateDescription();
        break;
      case 4:
        this.unrecognizedErr(['Looks great!', 'Not what I was expecting'], this.confirmation.bind(this));
        break;
      default:
        this.clearChat(`Sorry I didn't catch that.`)
        break;
    }
  }

  init() {
    switch(this.userState.stage) {
      case undefined:
        state.updateStage(this.userState.chatId, {stage: 'Post a job'}, err => {
          if (err) return this.sendErrMessage(err, 'PJ9');
          this.index();
        });
        break;
      default:
        this.index();
        break;
    }
  }
}








