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

    state.updateSubStageAward(this.userState.chatId, {subStage: 1, postShowing: JSON.stringify(quote)}, err => {
      if (err) return this.sendErrMessage(err, 'AW3');


      apiHandler.getPost(quote.posted_id, (err, data) => {
        if (err) return this.sendErrMessage(err, 'AW4');

        const post = data[0];

        const replyMsg = `
          You would like to award project - ${post.description} - to ${quote.username} for the price of ${quote.price}.

          Awarding this project is final.
        `;

        const options = ['I confirm!', 'Nevermind', 'End session'];

        this.sendMsg(replyMsg, options, this.msg.from);
      })
    })
  }

  awardIt() {
    state.updateSubStageAward(this.userState.chatId, {subStage: 2}, err => {
      if (err) return this.sendErrMessage(err, 'AW5');

      // 1 - gather needed data to post to gigs table in api
      //    - freelancer, customer, price
      // 2 - remove post from posted table in api
      // 3 - remove all of this posted from bids table in api
      const quote = JSON.parse(this.userState.postShowing);
      const prepGig = {
        freelancer: quote.username,
        customer: this.msg.from,
        price: quote.price,
      };

      console.log(prepGig);
    })
  }

  nevermind() {

  }

  filterConfirm() {
    switch(this.msg.body) {
      case 'I confirm!':
        this.awardIt();
        break;
      case 'Nevermind':
        this.nevermind();
        break;
    }
  }

  index() {
    switch(this.userState.subStage) {
      case 0:
        this.confirm();
        break;
      case 1:
        this.unrecognizedErr(['I confirm!', 'Nevermind'], this.filterConfirm.bind(this));
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