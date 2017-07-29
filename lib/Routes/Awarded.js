import { _ } from 'lodash';
import state from '../db/state.handler';
import apiHandler from '../assets/api.handler';
import uid from 'uid';
import skills from '../assets/skills';
import masterStages from '../assets/masterStages';

import Main from './Main';

export default class extends Main {
  constructor(userState, msg, Bot, bot, stage) {
    super(userState, msg, Bot, bot, stage);
    this.init();
  }

  setInitialState() {
    state.updateStage(this.userState.chatId, {stage: 'Check your awarded'}, err => {
      if (err) return this.sendErrMessage(err, 'AWD1');

      state.updateSubStageQuotes(this.userState.chatId, {subStage: -1, postShowing: null}, err => {
        if (err) return this.sendErrMessage(err, 'AWD2');
        state.setAllowAnything(this.userState.chatId, true, (err) => {
          if (err) return this.sendErrMessage(err, 'Q2');
          const replyMsg = `
            Which kind?
          `;
          const options = ['Jobs for me', 'Products I sell', 'Main menu'];

          this.sendMsg(replyMsg, this.msg.from, {choices: options});
        })
      })
    });
  }

  getAwarded() {
    const whichCall = {
      'Jobs for me': apiHandler.getCustomerGigs,
      'Products I sell': apiHandler.getFreelancerGigs,
    };

    whichCall[this.msg.body](this.msg.from, (err, gigs) => {
      if (err) return this.sendErrMessage(err, 'AWD3');

      if (!gigs.length) {
        const replyMsg = `
          No ${this.msg.body.split(' ')[0].toLowerCase()} awarded yet.
        `;
        const options = ['Jobs for me', 'Products I sell', 'Main menu'];

        this.sendMsg(replyMsg, this.msg.from, {choices: options});
        return;
      }

      state.addSubStageDataQuotes(this.userState.chatId, 0, gigs, err => {
          if (err) return this.sendErrMessage(err, 'AWD4');

          state.getState(this.userState.chatId, err => {
            if (err) return this.sendErrMessage(err, 'AWD5');

            this.userState.subStage = 0;
            this.userState.subStageData = gigs;

            this.displayAwarded(this.nextUpIncrease());
          })
        });
    });
  }

  displayAwarded(nextUp) {
    const gig = this.userState.subStageData[nextUp - 1];

    state.updateSubStageQuotes(this.userState.chatId, {subStage: nextUp, postShowing: gig.gig_id}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'A15');

      const status = {
        0: 'In progress',
        1: 'Complete',
      };

      const opposite = this.msg.from === gig.customer ? gig.freelancer : gig.customer;

      const replyMsg = `
        ${this.msg.from === gig.customer ? 'Freelancer: ' + gig.freelancer : ''}
        ${this.msg.from === gig.freelancer ? 'Customer: ' + gig.customer : ''}
        Price: ${gig.price}
        Skills: ${gig.skills}
        Description: ${gig.description}
        Status: ${status[gig.complete]}
        Freelancer rating: ${gig.complete ? gig.freelancer_rating : status[gig.complete]}
        Customer rating: ${gig.complete ? gig.customer_rating : status[gig.complete]}

        #${nextUp} of ${this.userState.subStageData.length}
      `;

      let choices = ['<-- Prev', 'Next -->', 'Main menu'];
      if (!gig.complete) {
        choices.splice(-1, 0, 'Rate @' + opposite);
      }

      this.sendMsg(replyMsg, this.msg.from, {choices: choices});
    })
  }

  init() {
    switch(this.userState.subStage) {
      case 0:
        this.setInitialState();
        break;
      case -1:
        this.unrecognizedErr(['Jobs for me', 'Products I sell', 'Main menu'], this.getAwarded.bind(this));
        break;
      default:
        switch(this.msg.body) {
          case 'Next -->':
            this.unrecognizedErr(['<-- Prev', 'Next -->', 'Contact', 'Main menu'], this.displayAwarded.bind(this, this.nextUpIncrease()));
            break;
          case '<-- Prev':
            this.unrecognizedErr(['<-- Prev', 'Next -->', 'Main menu'], this.displayAwarded.bind(this, this.nextUpDecrease()));
            break;
          default:
            this.sendMsg(`I didn't catch that`, this.msg.from, {choices: ['<-- Prev', 'Next -->', 'Main menu']});
            break;
        }
    }
  }
}