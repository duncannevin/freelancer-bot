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
    state.updateStage(this.userState.chatId, {stage: 'Check your posts'}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'Q1');

      state.updateSubStageQuotes(this.userState.chatId, {subStage: -1, postShowing: null}, (err, data) => {
        if (err) return this.sendErrMessage(err, 'Q2');

        const replyMsg = `
          This is where you can find out who has quoted you. Which do you want to check?
        `;
        const options = ['Job postings', 'Product postings', 'Main menu'];

        state.setAllowAnything(this.userState.chatId, true, (err) => {
          if (err) return this.sendErrMessage(err, 'Q2');
          this.sendMsg(replyMsg, this.msg.from, {choices: options});
        })
      })
    })
  }

  getPosts(type) {
    this.bot.getUserProfile(this.msg.from)
      .then(user => {
        apiHandler.getUsersPosts(user.username, type, (err, data) => {
          if (err) return this.sendErrMessage(err, 'Q3');

          if (!data.length) {
            const replyMsg = `
              No ${this.msg.body.split(' ')[0].toLowerCase()}s posted yet.
            `;
            const options = ['Job postings', 'Product postings', 'Main menu'];

            this.sendMsg(replyMsg, this.msg.from, {choices: options});
            return;
          }

          state.addSubStageDataQuotes(this.userState.chatId, 0, data, (err, data) => {
            if (err) return this.sendErrMessage(err, 'Q4');

            state.getState(this.userState.chatId, (err, data) => {
              if (err) return this.sendErrMessage(err, 'Q4');

              this.userState = data[0];
              this.displayPost(this.nextUpIncrease());
            })
          });
        })
      })
      .catch(err => {
        this.sendErrMessage(err, 'Q5');
      });
  }

  displayPost(nextUp) {
    const post = this.userState.subStageData[nextUp - 1];

    apiHandler.getBids(post.posted_id, (err, bids) => {
      if (err) return this.sendErrMessage(err, 'Q5');

      state.updateSubStageQuotes(this.userState.chatId, {
        subStage: nextUp,
        postShowing: JSON.stringify(bids),
      }, (err) => {
        if (err) return this.sendErrMessage(err, 'Q6');

        const quotes = bids.map((bid, index) => {
          return `#${index+1} - ${bid.username} ${bid.price}`
        });

        const replyMsg = `
          ${post.skills} - ${post.description}

          ${quotes.length ? quotes.join('\n') : 'No quotes for this ' + post.type + ' yet.'}

          ${post.type} ${nextUp} of ${this.userState.subStageData.length} posted
        `;

        let options = ['<-- Prev', 'Next -->'];
        quotes.forEach((_, index) => {
          options.push(`Award to #${index + 1}`)
        });
        options.push('Main menu');


        this.sendMsg(replyMsg, this.msg.from, {choices: options});
      })
    })
  }

  init() {
    switch(this.userState.subStage) {
      case 0:
        this.setInitialState();
        break;
      case -1:
        this.unrecognizedErr(['Job postings', 'Product postings', 'Main menu'], this.getPosts.bind(this, this.msg.body.split(' ')[0].toLowerCase()));
        break;
      default:
        switch(this.msg.body) {
          case '<-- Prev':
            this.displayPost(this.nextUpDecrease());
            break;
          case 'Next -->':
            this.displayPost(this.nextUpIncrease());
            break;
          default:
            this.sendMsg(`Sorry, I didn't catch that.`, this.msg.from, {choices: ['<-- Prev', 'Next -->', 'Main menu']});
            return;
        }
        break;
    }
  }
}