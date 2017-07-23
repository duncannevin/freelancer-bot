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

  // 1 need to check which kind of bids they want to see
  // 2 make call to api for all the posts
  // 3 make call to api for all bids to that post

  setInitialState() {
    state.updateStage(this.userState.chatId, {stage: 'Check your posts'}, (err, data) => {
      if (err) return this.sendErrMessage(err, 'Q1');

      state.updateSubStageQuotes(this.userState.chatId, {subStage: -1, postShowing: null}, (err, data) => {
        if (err) return this.sendErrMessage(err, 'Q2');

        const replyMsg = `
          Which kind?
        `;
        const options = ['Job postings', 'Product postings'];

        state.setAllowAnything(this.userState.chatId, true, (err) => {
          if (err) return this.sendErrMessage(err, 'Q2');
          this.sendMsg(replyMsg, options, this.msg.from);
        })
      })
    })
  }

  getPosts(type) {
    this.bot.getUserProfile(this.msg.from)
      .then(user => {
        apiHandler.getUsersPosts(user.username, type, (err, data) => {
          if (err) return this.sendErrMessage(err, 'Q3');

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
        this.sendErrMessage(err, 'Q4');
      });
  }

  displayPost(nextUp) {
    const post = this.userState.subStageData[nextUp - 1];

    apiHandler.getBids(post.posted_id, (err, bids) => {
      if (err) return this.sendErrMessage(err, 'Q5');

      state.updateSubStageQuotes(this.userState.chatId, {
        subStage: nextUp,
        subStageData: post.posted_id,
      }, (err) => {
        if (err) return this.sendErrMessage(err, 'Q6');
        console.log(bids);

        const replyMsg = `
          ${post}
          ${bids}
        `;

        this.sendMsg(replyMsg, ['<-- Prev', 'Next -->', 'Contact', 'End session'], this.msg.from);
      })
    })
  }

  index() {
    switch(this.userState.subStage) {
      case 0:
        this.setInitialState();
        break;
      case -1:
        this.unrecognizedErr(['Job postings', 'Product postings'], this.getPosts.bind(this, this.msg.body.split(' ')[0].toLowerCase()));
        break;
      default:
        switch(this.msg.body) {
          case '<-- Prev':
            this.displayPost(this.nextUpIncrease());
            break;
          case 'Next -->':
            this.displayPost(this.nextUpDecrease());
            break;
          default:
            this.sendMsg(`Sorry, I didn't catch that.`, ['<-- Prev', 'Next -->', 'End session'], this.msg.from);
            return;
        }
        break;
    }
  }

  init() {
    this.index();
  }
}