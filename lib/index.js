import http from 'http';
import Bot from '@kikinteractive/kik';
import { _ } from 'lodash';

import state from './db/state.handler';
import App from './App';
import Post from './Post';
import Browse from './Browse';

const routes = {
  'Post a job': Post,
  'Browse jobs': Browse,
};

let bot = new Bot({
  username: 'freelancerbot',
  apiKey: 'deb9ddd3-fbe3-4413-b244-586c9d6ae309',
  baseUrl: 'https://243e9521.ngrok.io',
});

bot.updateBotConfiguration();

bot.onTextMessage(msg => {
  /**
  * First check to see if the chatId already exists in the db
  */
  state.findOrCreate(msg.chatId, (err, chatData) => {

    if (err) {
      const app = new App(null, msg, Bot, bot);
      app.sendErrMessage(err, 'I1');
      return;
    }

    let replyMsg;

    /**
    * If the chat id is not found in the db
    * create new entry.
    */
    if (chatData.created) {
      chatData.result.stage = 'welcome';

      state.updateStage(chatData.result.chatId, chatData.result, (err, state) => {
        if (err) {
          const app = new App(null, msg, Bot, bot);
          app.sendErrMessage(err, 'I2');
          return;
        }
        replyMsg = Bot.Message.text('Welcome to JobsList! What would you like to do?');
        replyMsg.addResponseKeyboard(['Browse jobs', 'Post a job']);
        bot.send(replyMsg, msg.from);
      });

    /*
    * else
    **/
    } else {

      if (msg.body === 'Start over') {
        const app = new App(chatData.result, msg, Bot, bot);
        app.clearChat();
        return;
      }

      if (['Browse jobs', 'Post a job'].includes(msg.body)) {

        chatData.result.stage = msg.body;

        state.updateStage(chatData.result.chatId, chatData.result, (err) => {

          if (err) {
            const app = new App(null, msg, Bot, bot);
            app.sendErrMessage(err, 'I3');
            return;
          }
          new routes[msg.body](chatData.result, msg, Bot, bot);
        })
      } else if (chatData.result.allowAnything) {
        new routes[chatData.result.stage](chatData.result, msg, Bot, bot);
      } else {
        const app = new App(null, msg, Bot, bot);
        app.unrecognizedMessage();
      }
    }
  });
});

http
  .createServer(bot.incoming())
  .listen(process.env.PORT || 8080, () => {
    console.log('Hearing: 8080');
  });