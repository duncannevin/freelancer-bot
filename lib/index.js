import http from 'http';
import Bot from '@kikinteractive/kik';
import choices from './choices';
import { _ } from 'lodash';

import state from './db/state.handler';
import App from './App';

let bot = new Bot({
  username: 'freelancerbot',
  apiKey: 'deb9ddd3-fbe3-4413-b244-586c9d6ae309',
  baseUrl: 'https://b6179c88.ngrok.io',
  staticKeyboard: new Bot.ResponseKeyboard(['Browse', 'Post'])
});

bot.updateBotConfiguration();

bot.onTextMessage(msg => {
  /**
  * First check to see if the chatId already exists in the db
  */
  state.findOrCreate(msg.chatId, (err, data) => {

    if (err) {
      msg.reply(`Oops, I did something wrong! Please contact the admin. error code 1`);
      return;
    }

    let replyMsg;

    /**
    * If the chat id is not found in the db
    * create new entry.
    */
    if (data.created) {
      data.result.stage = 'welcome';

      state.updateStage(data.result.chatId, data.result, (err, data) => {
        if (err) {
          msg.reply(`Oops, I did something wrong! Please contact the admin. error code 2`);
          return;
        } else {
          replyMsg = Bot.Message.text('Welcome to JobsList! What would you like to do?');
          replyMsg.addResponseKeyboard(choices.one);
          bot.send(replyMsg, msg.from);
        }
      });

    /*
    * else
    **/
    } else {

      // Get all the choices and create a single array.
      const choicesToArray = _.flatten(_.valuesIn(choices));

      /*
      * If message body is valid
      **/
      if (choicesToArray.find(choice => choice === msg.body)) {
        data.result.stage = msg.body;

        // Update this chats state in the db
        state.updateStage(data.result.chatId, data.result, (err) => {
          if (err) {
            msg.reply(`Oops, I did something wrong! Please contact the admin. error code 3`);
            return;
          } else {
            // Instantiate new App to handle next step
            new App(data.result, msg, Bot, bot);
          }
        });
      /*
      * else
      **/
      } else {
        // Send a message to the user that there response is not // valid.
        replyMsg = Bot.Message.text(`Sorry, I'm just a robot, can you please try one of the selections below.`);
        replyMsg.addResponseKeyboard(choices.one);
        bot.send(replyMsg, msg.from);
      }
    }
  });
});

http
  .createServer(bot.incoming())
  .listen(process.env.PORT || 8080, () => {
    console.log('Hearing: 8080');
  });