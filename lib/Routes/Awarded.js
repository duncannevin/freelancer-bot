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
            This is where you can check the status of your ongoing projects. Which do you want to check?
          `;

          apiHandler.getAvgRating(this.msg.from, 'all', (err, data) => {
            if (err) return this.sendErrMessage(err, 'AW6');

            const options = ['Jobs for me', 'Products I sell', 'Main menu'];

            options.splice(-1, 0, `Overall rating ${_.values(data)[0]} out of 5`);

            this.sendMsg(replyMsg, this.msg.from, {choices: options});
          });
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

  displayRating() {
    apiHandler.getFreelancerGigs(this.msg.from, (err, freelancer) => {
      if (err) return this.sendErrMessage(err, 'A16');
      apiHandler.getCustomerGigs(this.msg.from, (err, jobs) => {
        if (err) return this.sendErrMessage(err, 'A17');
        apiHandler.getAvgRating(this.msg.from, 'all', (err, avg) => {
          if (err) return this.sendErrMessage(err, 'A18');

          const freelancerRatings = _.map(freelancer, j => {
            const prep = {
              other: j.customer,
              rating: j.freelancer_rating,
              description: j.description,
            };
            return `
              @${prep.other} rated you ${prep.rating} for your efforts on - ${prep.description}.
            `
          })
          const customerRatings = _.map(jobs, j => {
            if (j.customer_rating > 0) {
              const prep = {
                other: j.freelancer,
                rating: j.customer_rating,
                description: j.description,
              };
              return `
                @${prep.other} rated you ${prep.rating} as a customer for - ${prep.description}.
              `
            }
          });
          const totalAvg = _.values(avg)[0];

          const replyMsg = `
            ${freelancerRatings.concat(customerRatings).join('')}
            Your overall average is ${totalAvg}
          `;

          const options = ['Jobs for me', 'Products I sell', 'Main menu'];

          options.splice(-1, 0, `Overall rating ${_.values(avg)[0]} out of 5`);

          this.sendMsg(replyMsg, this.msg.from, {choices: options})

        })
      })
    })
  }

  init() {
    if(this.msg.body.match(/Overall/g)) {
      this.displayRating();
      return;
    }
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
              this.setInitialState();
            break;
        }
    }
  }
}