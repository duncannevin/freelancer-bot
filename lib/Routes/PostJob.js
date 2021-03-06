import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import skills from '../assets/skills';
import priceRanges from '../assets/price_ranges';
import masterStages from '../assets/masterStages';
import moment from 'moment';

import Main from './Main';

export default class extends Main {

  constructor(userState, msg, Bot, bot) {
    super(userState, msg, Bot, bot);
    this.init();
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

        this.sendMsg(replyMsg, this.msg.from, {choices: skills});
      })
    })
  }

  updateSkillset() {

    state.updateSubStagePost(this.userState.chatId, 2, {skills: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PJ5')

      const replyMsg = `
        What does this job entail? Be as descriptive as you need to be.
      `;

      this.msg.reply(replyMsg);
    })
  }


  updateDescription() {

    state.updateSubStagePost(this.userState.chatId, 3, {description: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PJ8');

      const replyMsg = `
        Describe your price expecation.
      `;

      this.sendMsg(replyMsg, this.msg.from, {choices: priceRanges});
    })
  }

  updatePricing() {
    state.updateSubStagePost(this.userState.chatId, 4, {price_range: this.msg.body}, (err) => {
      if (err) return this.sendErrMessage(err, 'PJ7');

      const replyMsg = `Is it OK if I use your profile pic and first name in this post?`;

      const choices = ['Yes!', 'No'];

      this.sendMsg(replyMsg, this.msg.from, {choices: choices})
    })
  }

  updateNameAndImageOk() {

    /**
    * This is a hack so I don't have to change the api
    * @'?' + this.msg.body + '?' is added to the price
    * then is split off in browse.
    */

    this.userState.subStageData = _.map(this.userState.subStageData, ssd => {
      if (ssd.price_range) {
        ssd.price_range = ssd.price_range.concat('?' + this.msg.body + '?')
      }
      return ssd;
    })

    state.addSubStageDataPost(this.userState.chatId, 5, this.userState.subStageData, (err) => {
      if (err) return this.sendErrMessage(err, 'PJ7');

      apiHandler.getUser(this.msg.from, (err, userData) => {
        if (err) return this.sendErrMessage(err, 'P17');

        userData = userData[0];

        apiHandler.getAvgRating(userData.username, 'all', (err, rating) => {
          if (err) return this.sendErrMessage(err, 'P18');

          const postData = this.makeSubStageDataIntoObject();
          const prepRating = this.processRating(_.values(rating)[0]);

          let postMsg = `
            \nRating: ${prepRating} out of 5.\nSkillset: ${postData.skills}\nUser Since: ${moment(userData.created_at).calendar()}\nDescription: ${postData.description}\nPrice expectation: ${postData.price_range.split('?')[0]}
          `;

          const choices = ['Looks great!', 'Not what I was expecting'];

          let options = {choices: choices};

          if (this.msg.body === 'Yes!') {
            postMsg = `
              Hello my name is ${userData.first_name}. ${postMsg}
            `;
            options.image = userData.profile_pic_url;
          }

          this.sendMsg(postMsg, this.msg.from, options);
        });
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

          const replyMsg = `
            Your post has been successfully added! I will send you a message each time someone places a quote. Thank you!
          `;

          this.clearChat(replyMsg);
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
        this.setInitialState();
        break;
      case 1:
        this.unrecognizedErr(skills, this.updateSkillset.bind(this));
        break;
      case 2:
        this.updateDescription();
        break;
      case 3:
        this.unrecognizedErr(priceRanges, this.updatePricing.bind(this));
        break;
      case 4:
        this.unrecognizedErr(['Yes!', 'No'], this.updateNameAndImageOk.bind(this));
        break;
      case 5:
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








