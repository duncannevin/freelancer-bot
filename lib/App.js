import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './assets/api.handler';
import uid from 'uid';
import masterStages from './assets/masterStages';

import PostJob from './Routes/PostJob';
import PostProduct from './Routes/PostProduct';
import Browse from './Routes/Browse';
import Contact from './Routes/Contact';
import Quotes from './Routes/Quotes';
import Award from './Routes/Award';
import Awarded from './Routes/Awarded';

export default class {

  constructor() {
  }

  handleErr(err, errCode, msg, bot) {
    console.log(err.message);
    const reply = `
      Oops, I did something wrong!
      Please contact the admin, error code ${number}...

      Don't give up on me though.
    `;

    state.deleteChat(msg.chatId, (err) => {
      if (err) return this.handleErr(err, 'I4', msg, bot);
      this.bot.send(reply, masterStages, this.msg.from);
    });
  }

  sendMsg(replyMsg, choices, msg, bot, Bot) {
    const reply = Bot.Message.text(replyMsg);
    reply.addResponseKeyboard(choices);
    bot.send(reply, msg.from);
  }

  init(bot, Bot) {
    bot.onTextMessage((msg, next) => {
    /**
    * First check to see if the chatId already exists in the db
    */
      state.findOrCreate(msg.chatId, (err, chatData) => {
        if (err) return this.handleErr(err, 'I1', msg, bot);
        msg.chatData = chatData;
        next();
      })
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Main menu':
          state.deleteChat(msg.chatId, err => {
            if (err) return this.handleErr(err, 'I3', msg, bot);
            this.sendMsg(`No problem`, masterStages, msg, bot, Bot);
          })
          break;
        default:
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {

      switch(msg.chatData.created) {
        case true:
          state.updateStage(msg.chatId, msg.chatData.result, (err, data) => {
            if (err) return this.handleErr(err, 'I2', msg, bot);

            if (masterStages.includes(msg.body)) {
              next();
            } else {
              this.sendMsg(`What can I do for you today?`, masterStages, msg, bot, Bot);
            }

          })
          break;
        case false:
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Contact':
          const contact = new Contact(msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
          break;
        default:
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body.split(' ')[0]) {
        case 'Award':
          const award = new Award(msg.chatData.result, msg, Bot, bot, msg.body);
          break;
        default:
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.chatData.result.allowAnything) {
        case true:
          switch(msg.chatData.result.stage) {
            case 'Contact':
              const contact = new Contact(msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
              break;
            case 'Browse products':
            case 'Browse jobs':
              const browse = new Browse(msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
              break;
            case 'Post a job':
              const postJob = new PostJob(msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
              break;
            case 'Post a product':
              const postProduct = new PostProduct(msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
              break;
            case 'Check your posts':
              const quotes = new Quotes(msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
              break;
            case 'Award':
              const award = new Award(msg.chatData.result, msg, Bot, bot, msg.body, msg.chatData.result.stage);
              break;
            case 'Check your awarded':
              const awarded = new Awarded(msg.chatData.result, msg, Bot, bot);
              break;
            default:
              next();
              break;
          }
        break;
        case false:
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Browse products':
        case 'Browse jobs':
          const browse = new Browse(msg.chatData.result, msg, Bot, bot, msg.body);
          break;
        case 'Post a job':
          const postJob = new PostJob(msg.chatData.result, msg, Bot, bot);
          break;
        case 'Post a product':
          const postProduct = new PostProduct(msg.chatData.result, msg, Bot, bot);
          break;
        case 'Check your posts':
          const quotes = new Quotes(msg.chatData.result, msg, Bot, bot);
          break;
        case 'Check your awarded':
          const awarded = new Awarded(msg.chatData.result, msg, Bot, bot);
          break;
        default:
          next();
          break;
      }
    })

    bot.onTextMessage(msg => {
      state.deleteChat(msg.chatId, err => {
        if (err) return this.handleErr(err, 'I5', msg, bot);
        this.sendMsg(`Sorry I didn't catch that.`, masterStages, msg, bot, Bot);
      })
    });
  }
}