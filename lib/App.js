import { _ } from 'lodash';
import state from './db/state.handler';
import choices from './choices';
import apiHandler from './api.handler';
import uid from 'uid';

export default class {
  constructor(userState, msg, Bot, bot) {
    this.userState = userState;
    this.msg = msg;
    this.Bot = Bot;
    this.bot = bot;

    this.postSubs = 2;

    this.init();
  }

  /**
  *Stages --> all lowercase because I am converting the input to these
  */

  // Post job
  postajob() {
    this.bot.getUserProfile(this.msg.from)
      .then(user => {
        apiHandler.postUser(user.username, user.firstName, user.lastName, user.profilePicUrl, (err, data) => {
          if (err) {
            this.sendErrMessage(err, 'A2');
            return;
          }

          state.updateSubStagePost(this.userState.chatId, 1, {posted_id: uid(20)}, (err, data) => {
            if (err) {
              this.sendErrMessage(err, 'A3');
              return;
            }

            state.setAllowAnything(this.userState.chatId, true, (err, data) => {
              if (err) {
                this.sendErrMessage(err, 'A9')
                return;
              }

              this.msg.reply(`Enter skills`);
            });
          });
        });
      });
  }

  postajob1() {
    state.updateSubStagePost(this.userState.chatId, 2, {skills :this.msg.body}, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A4');
        return;
      }

      this.msg.reply(`Enter price range`);
    });
  }

  postajob2() {
    state.updateSubStagePost(this.userState.chatId, 3, {price_range: this.msg.body}, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A5');
        return;
      }

      this.msg.reply(`Enter a brief description of the work`);
    });
  }

  postajob3() {
    state.updateSubStagePost(this.userState.chatId, 4, {project: this.msg.body}, (err, body) => {
      if (err) {
        this.sendErrMessage(err, 'A6')
        return;
      }

      const subStageData = this.makeSubStageDataIntoObject();

      const replyMsg = `
        How's this look...

        Skills: ${subStageData.skills}
        Price range: ${subStageData.price_range}
        Description: ${this.msg.body}
      `;

      this.sendMsg(replyMsg, ['Looks good!', 'Start over'], this.msg.from);
    });
  }

  postajob4() {
    if (this.msg.body === 'Looks good!') {
      this.postLooksGood();
    } else if (this.msg.body === 'Start over') {
      this.clearChat();
    } else {
      const replyMsg = `
        Sorry, I'm just a robot, can you please try one of the selections below.
      `;

      this.sendMsg(replyMsg, ['Looks good!', 'Start over'], this.msg.from);
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
      });
  }
  //end Post job
  // browse jobs
  browsejobs() {
    apiHandler.getPosts((err, posts) => {
      if (err) {
        this.sendErrMessage(err, 'A11');
        return;
      }

      state.addSubStageDataBrowse(this.userState.chatId, posts, (err, data) => {
        if (err) {
          this.sendErrMessage(err, 'A12');
          return;
        }

        state.setAllowAnything(this.userState.chatId, true, (err, data) => {
          if (err) {
            this.sendErrMessage(err, 'A14');
            return;
          }

          this.userState.subStage = 0;
          this.userState.subStageData = posts;

          this.browseJobsIndex();
        })
      })
    });
  }

  browseJobsIndex() {

    let nextUp;

    switch(this.msg.body) {
      case '<-- Prev':
        nextUp = this.userState.subStage === 1 ? this.userState.subStageData.length : this.userState.subStage -= 1;
        break;
      case 'Browse jobs':
      case 'Next -->':
        nextUp = this.userState.subStage === this.userState.subStageData.length ? 1 : this.userState.subStage += 1;
        break;
      case 'Start over':
        this.clearChat();
        return;
      case 'Contact':
        this.contactJob();
        return;
      default:
        this.sendMsg(`Sorry, I didn't catch that.`, choices.one, this.msg.from);
        return;
    }

    this.displayJob(nextUp);
  }

  displayJob(nextUp) {
    state.updateSubStageBrowse(this.userState.chatId, nextUp, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A15');
        return;
      }
      const post = this.userState.subStageData[nextUp - 1];

      const postMsg = `
        Post# ${post.posted_id}

        Skills: ${post.skills}
        Price range: ${post.price_range}
        Description: ${post.project}
      `;

      this.sendMsg(postMsg, ['<-- Prev', 'Next -->', 'Contact', 'Start over'], this.msg.from);
    })
  }

  contactJob() {
    // ---> LEFT OFF HERE
  }
  // end browse jobs

  //restart
  restart() {
    this.clearChat();
  }
  /**end stages**/
  /**
  * Helpers
  */
  sendErrMessage(err, number) {
    console.log(err.message);
    this.msg.reply(`Oops, I did something wrong! Please contact the admin. error code ${number}`);
    this.clearChat();
  }

  removeSpaces(str) {
    return str.replace(/\s/g, '').toLowerCase();
  }

  sendMsg(replyMsg, choices, tooWho) {
    const reply = this.Bot.Message.text(replyMsg);
    reply.addResponseKeyboard(choices);
    this.bot.send(reply, tooWho);
  }

  clearChat() {
    state.resetState(this.userState.chatId, (err, data) => {
      if (err) {
        this.sendErrMessage(err, 'A10');
        return;
      }

      this.sendMsg(`Great, is there anything else I can do for you today?`, choices.one, this.msg.from);
    });
  }

  makeSubStageDataIntoObject() {
    return _.reduce(this.userState.subStageData, (madeObj, obj) => {
      madeObj[_.keys(obj)[0]] = _.values(obj)[0];
      return madeObj;
    }, {});
  }

  /**
  * initialize function call
  */
  init() {
    if (this.userState.subStage > 0) {

      switch(this.userState.stage) {
        case 'Browse jobs':
          this.browseJobsIndex();
          break;
        case 'Post a job':
          this[this.removeSpaces(this.userState.stage) + this.userState.subStage]();
          break;
        default:
          this.sendMsg(`Sorry, I didn't catch that.`, choices.one, this.msg.from);
      }
    } else {
      this[this.removeSpaces(this.userState.stage)]();
    }
  }
}
