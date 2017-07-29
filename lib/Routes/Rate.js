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
    state.updateStage(this.userState.chatId, {stage: 'Rate'}, err => {
      if (err) return this.sendErrMessage(err, 'R1');

      const getGig = _.filter(this.userState.subStageData, g => {
        return g.gig_id === this.userState.postShowing;
      });

      state.addSubStageDataQuotes(this.userState.chatId, -1, getGig, err => {
        if (err) return this.sendErrMessage(err, 'R3');

        const name = this.msg.from === this.userState.subStageData[0].freelancer ? this.userState.subStageData[0].customer : this.userState.subStageData[0].freelancer;

        const replyMsg = `
          On a scale of 1 - 5 how would you rate @${name}'s efforts?
        `;

        const options = ['1', '2', '3', '4', '5', 'Main menu'];

        this.sendMsg(replyMsg, this.msg.from, {choices: options});
      })
    })
  }

  processRating() {
    let gig = this.userState.subStageData[0];
    apiHandler.getGig(gig.gig_id, (err, gigPrinc) => {
      if (err) return this.sendErrMessage(err, 'R4');
      gig = gigPrinc[0];

      const whichToUpdate = gig.customer === this.msg.from ? 'freelancer_rating' : 'customer_rating';

      gig[whichToUpdate] = Number(this.msg.body);

      if (gig.freelancer_rating > 0 && gig.customer_rating > 0) {
        gig.complete = true;
      }

      apiHandler.postGig(gig, (err, data) => {
        if (err) return this.sendErrMessage(err, 'R5');

        state.deleteChat(this.userState.chatId, err => {
          if (err) return this.sendErrMessage(err, 'R6');

          const replyMsg = `
            Got it! Once both parties have rated eachother status will be updated. Thank you.
          `;

          const ratedMsg = `
            @${this.msg.from} rated you ${this.msg.body} out of 5 for ${gig.description}. Thank you.
          `;

          const opposite = this.msg.from === gig.freelancer ? gig.customer : gig.freelancer;

          this.sendMsg(ratedMsg, opposite, {choices: masterStages});
          this.sendMsg(replyMsg, this.msg.from, {choices: masterStages});
        })
      });
    })
  }

  init() {
    switch(this.userState.subStage) {
      case -1:
        this.unrecognizedErr(['1', '2', '3', '4', '5', 'Main menu'], this.processRating.bind(this));
        break;
      default:
        this.setInitialState();
        break;
    }
  }
}