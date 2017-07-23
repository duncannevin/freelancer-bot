import http from 'http';
import Bot from '@kikinteractive/kik';
import { _ } from 'lodash';

import state from './db/state.handler';
import App from './App';
import PostJob from './PostJob';
import PostProduct from './PostProduct';
import Browse from './Browse';
import Contact from './Contact';

import masterStages from './masterStages';

const API_KEY = process.env.API_KEY || require('../dev-keys').API_KEY;
const BASE_URL = process.env.BASE_URL || require('../dev-keys').BASE_URL;

const handleErr = (err, errCode, msg) => {
  const app = new App(null, msg, Bot, bot);
  app.sendErrMessage(err, errCode);
};

let bot = new Bot({
  username: 'freelancerbot',
  apiKey: API_KEY,
  baseUrl: BASE_URL,
});

bot.updateBotConfiguration();

bot.onTextMessage((msg, next) => {
  /**
  * First check to see if the chatId already exists in the db
  */
  state.findOrCreate(msg.chatId, (err, chatData) => {
    if (err) return handleErr(err, 'I1', msg);
    msg.chatData = chatData;
    next();
  })
})

bot.onTextMessage((msg, next) => {

  switch(msg.chatData.created) {
    case true:
      state.updateStage(msg.chatId, msg.chatData.result, (err, data) => {
        if (err) return handleErr(err, 'I2', msg);
        const app = new App(msg.chatData.result, msg, Bot, bot);
        app.sendMsg(`What can I do for you today?`, masterStages, msg.from);
      })
      break;
    case false:
      next();
      break;
  }
})

bot.onTextMessage((msg, next) => {
  switch(msg.body) {
    case 'End session':
      state.deleteChat(msg.chatId, err => {
        if (err) return handleErr(err, 'I3', msg);
        const app = new App(msg.chatData.result, msg, Bot, bot);
        app.sendMsg(`No problem`, [`Begin new session`], msg.from);
      })
      break;
    default:
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
          const postJob = new PostJob(msg.chatData.result, msg, Bot, bot);
          break;
        case 'Post a product':
          const postProduct = new PostProduct(msg.chatData.result, msg, Bot, bot);
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
    default:
      next();
      break;
  }
})

bot.onTextMessage(msg => {
  state.deleteChat(msg.chatId, err => {
    if (err) return handleErr(err, 'I3', msg);
    const app = new App(msg.chatData.result, msg, Bot, bot);
    app.sendMsg(`Sorry I didn't catch that.`, [`Begin new session`], msg.from);
  })
});

http
  .createServer(bot.incoming())
  .listen(process.env.PORT || 8080, () => {
    console.log('Hearing: 8080');
  });