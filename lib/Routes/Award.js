import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import skills from '../assets/skills';
import masterStages from '../assets/masterStages';

import Main from './Main';

export default class extends Main {
  constructor(userState, msg, Bot, bot, stage) {
    super(userState, msg, Bot, bot);
    this.init();
  }

  setInitialState() {
    state.updateStage(this.userState.chatId, {stage: 'Award'}, err => {
      if (err) return this.sendErrMessage(err, 'AW1');
      state.updateSubStageAward(this.userState.chatId, {subStage: 0}, err => {
        if (err) return this.sendErrMessage(err, 'AW2');
        this.userState.subStage = 0;
        this.index();
      })
    })
  }

  confirm() {
    const index = Number(this.msg.body.slice(-1)) - 1;
    const quote = JSON.parse(this.userState.postShowing)[index];

    apiHandler.getPost(quote.posted_id, (err, data) => {
      if (err) return this.sendErrMessage(err, 'AW4');

      const post = data[0];

      quote.description = post.description;
      quote.skills = post.skills;
      quote.type = post.type;

      state.updateSubStageAward(this.userState.chatId, {subStage: 1, postShowing: JSON.stringify(quote)}, err => {
        if (err) return this.sendErrMessage(err, 'AW3');

        const replyMsg = `
          You would like to award project - ${post.description} - to ${quote.username} for the price of ${quote.price}.

          Awarding this project is final.
        `;

        const options = ['Award it!', 'Nevermind', 'Main menu'];

        this.sendMsg(replyMsg, this.msg.from, {choices: options});
      })
    })
  }

  awardIt() {
    state.updateSubStageAward(this.userState.chatId, {subStage: 2}, err => {
      if (err) return this.sendErrMessage(err, 'AW5');

      const quote = JSON.parse(this.userState.postShowing);

      let prepGig = {
        price: quote.price,
        gig_id: quote.posted_id,
        description: quote.description,
        skills: quote.skills,
      };

      let awardedToo;

      switch(quote.type) {
        case 'product':
          prepGig.freelancer = this.msg.from;
          prepGig.customer = quote.username;
          break;
        case 'job':
          prepGig.freelancer = quote.username;
          prepGig.customer = this.msg.from;
          break
        default:
          return this.sendErrMessage({message: 'Default'}, 'AW8');
      }

      apiHandler.postGig(prepGig, err => {
        if (err) return this.sendErrMessage(err, 'AW8');
        apiHandler.deleteBids(quote.posted_id, err => {
          if (err) return this.sendErrMessage(err, 'AW6');
          apiHandler.deletePost(quote.posted_id, err => {
            if (err) return this.sendErrMessage(err, 'AW7');
            state.deleteChat(this.userState.chatId, err => {
              if (err) return this.sendErrMessage(err, 'AW9');
              const replyMsg = `
                ${quote.description} - has been awarded to @${quote.username}. To update the status of this job/product go to 'Check your awarded'. I am sending a message to ${quote.username} to let them know. Thank you!
              `;

              const awardedMsg = `

                @${this.msg.from} has awarded you - ${quote.description} - for ${quote.price} - To update the status of this job/product go to 'Check your awarded'. Thank you!
              `;

              this.sendMsg(replyMsg, this.msg.from, {choices: masterStages});
              this.sendMsg(awardedMsg, quote.username, {choices: masterStages});
            });
          })
        })
      })
    })
  }

  nevermind() {
    state.deleteChat(this.userState.chatId, err => {
      if (err) return this.sendErrMessage(err, 'A7');
      this.sendMsg('No problem', this.msg.from, {choices: masterStages});
    })
  }

  filterConfirm() {
    switch(this.msg.body) {
      case `Award it!`:
        this.awardIt();
        break;
      case 'Nevermind':
        this.nevermind();
        break;
      default:
        this.sendMsg(`I don't understand`, this.msg.from, {choices: ['Award it!', 'Nevermind']});
        break;
    }
  }

  index() {
    switch(this.userState.subStage) {
      case 0:
        this.confirm();
        break;
      case 1:
        this.unrecognizedErr(['Award it!', 'Nevermind'], this.filterConfirm.bind(this));
        break;
    }
  }

  init() {
    switch(this.userState.stage) {
      case 'Award':
        this.index();
        break;
      default:
        this.setInitialState();
        break;
    }
  }
}