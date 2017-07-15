import { _ } from 'lodash';
import state from './db/state.handler';
import choices from './choices';

export default class {
  constructor(userState, msg, Bot, bot) {
    this.userState = userState;
    this.msg = msg;
    this.Bot = Bot;
    this.bot = bot;

    this.init();
  }

  /**
  *Stages --> all lowercase because I am converting the input to these
  */

  browsejobs() {
    console.log('browsejobs');
    this.sendMsg(`BROWSE JOBS`, choices.one, this.msg.from);
  }

  postajob() {
    console.log('postajob');
    this.sendMsg(`POST A JOB`, choices.one, this.msg.from);
  }

  restart() {
    console.log('restart');
    this.sendMsg(`RESTART`, choices.one, this.msg.from);
  }

  /**
  * Helpers
  */
  removeSpaces(str) {
    return str.replace(/\s/g, '').toLowerCase();
  }

  sendMsg(replyMsg, choices, tooWho) {
    const reply = this.Bot.Message.text(replyMsg);
    reply.addResponseKeyboard(choices);
    this.bot.send(reply, tooWho);
  }

  /**
  * initialize function call
  */
  init() {
    this.userState.stage = this.msg.body;
    const pickProps = _.pick(this.userState, ['chatId', 'username', 'stage']);

    this[this.removeSpaces(this.userState.stage)]();
  }
}
