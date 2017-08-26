import { _ } from 'lodash';
import state from './db/state.handler';
import apiHandler from './assets/api.handler';
import uid from 'uid';
import util from 'util';
import moment from 'moment';
import masterStages from './assets/masterStages';
import filter from './assets/filter/filter';

import PostJob from './Routes/PostJob';
import PostProduct from './Routes/PostProduct';
import Browse from './Routes/Browse';
import Contact from './Routes/Contact';
import Quotes from './Routes/Quotes';
import Award from './Routes/Award';
import Awarded from './Routes/Awarded';
import Rate from './Routes/Rate';

export default class {

  constructor(bot, Bot) {
    this.bot = bot;
    this.Bot = Bot;
    this.init(this.bot, this.Bot);
    // Runs cleanup function every 15 minutes
    setInterval(this.cleanUp, 900000);
  }

  /**
  * cleanUp finds any state that has not been updated within
  * 30 minutes and removes it from the state db
  */
  cleanUp() {
    state.getAllStates((err, states) => {
      if (err) return console.log('CLEANUP FAILED: ', err.message);

      if (states.length) {
        _.each(states, s => {
          const timeSince = moment
            .duration(moment().diff(s.updatedAt))
            .asMinutes();

            if (timeSince > 30) {
              state.deleteChat(s.chatId, err => {
                if (err) return console.log('CLEANUP FAILED', err.message);
                console.log('CLEANUP: ', s.chatId);
              });
            }
        });
      } else {
        console.log('NOTHING TO CLEANUP');
      }
    });
  }

  /**
  * handleErr is a helper to handle err in cb. If any callback returns an
  * err this function is called. This function deletes the chat
  * from the state so the user is able to start over.
  */
  handleErr(err, errCode, msg, bot, Bot) {
    console.log(err.message);
    const reply = `
      Oops, I did something wrong!
      Please contact the admin, error code ${errCode}...

      Don't give up on me though.
    `;

    state.deleteChat(msg.chatId, (err) => {
      if (err) return this.sendMsg(`Yikes, fatal crash! I'll reset so you can start again.`, masterStages('home'), msg, bot, Bot);
      this.sendMsg(reply, masterStages('home'), msg, bot, Bot)
    });
  }

  /**
  * sendMsg is a helper that is used to send messages.
  */
  sendMsg(replyMsg, choices, msg, bot, Bot) {
    const reply = Bot.Message.text(replyMsg);
    reply.addResponseKeyboard(choices);
    bot.send(reply, msg.from);
  }

  /**
  * init runs the entire app
  */
  init(bot, Bot) {
    /**
    * If user is brand new to the site
    */
    bot.onStartChattingMessage((msg) => {
      bot.getUserProfile(msg.from)
        .then(user => {
          this.sendMsg(`Hello, ${user.firstName}! Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
        })
    })

    /********FILTERS*********/
    /**
    * Filters incoming text for innapropriate content.
    * If innapropriate, will clear chat state and return
    * user to default options.
    */
    bot.onTextMessage((msg, next) => {
      // if a suggested respons, next
      if (masterStages('dump').includes(msg.body)) {
        next();
      // else run filter
      } else {
        filter(msg.body, (safe, reason) => {
          if (safe) {
            // console.log('CONTENT SAFE --> ' + reason);
            next();
          } else {
            // console.log('CONTENT UNSAFE --> ' + reason);
            state.deleteChat(msg.chatId, err => {
              if (err) return this.handleErr(err, 'UNSAFE3', msg, bot, Bot);

              const prepReason = reason.join(', ');

              this.sendMsg(`This contains ${prepReason} content. I am starting you over so you can clean it up.`, masterStages('home'), msg, bot, Bot);
            })
          }
        });
      }
    })
    /********END FILTERS*********/

    /**
    * Handles *sticker* messages by responding with main menu
    */
    bot.onStickerMessage(msg => {
      state.deleteChat(msg.chatId, err => {
        if (err) return this.handleErr(err, 'I3', msg, bot, Bot);

        this.sendMsg(`Nice sticker! Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
      })
    })

    /**
    * Handles *video* messages by responding with main menu
    */
    bot.onVideoMessage(msg => {
      state.deleteChat(msg.chatId, err => {
        if (err) return this.handleErr(err, 'I3', msg, bot, Bot);

        this.sendMsg(`Nice video! Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
      })
    })

    /**
    * Handles *picture* messages by responding with main menu
    */
    bot.onPictureMessage(msg => {
      state.deleteChat(msg.chatId, err => {
        if (err) return this.handleErr(err, 'I3', msg, bot, Bot);

        this.sendMsg(`Nice picture! Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
      })
    })

    /**
    * Handles *link* messages by responding with main menu
    */
    bot.onLinkMessage(msg => {
      state.deleteChat(msg.chatId, err => {
        if (err) return this.handleErr(err, 'I3', msg, bot, Bot);

        this.sendMsg(`Nice link! Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
      })
    })

    /**
    * Handles *scan-data* messages by responding with main menu
    */
    bot.onScanDataMessage(msg => {
      state.deleteChat(msg.chatId, err => {
        if (err) return this.handleErr(err, 'I3', msg, bot, Bot);

        this.sendMsg(`Nice scan data! Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
      })
    })

    /**
    * First check to see if the chatId already exists in the db
    * adds the state to msg.
    */
    bot.onTextMessage((msg, next) => {
      state.findOrCreate(msg.chatId, (err, chatData) => {
        if (err) return this.handleErr(err, 'I1', msg, bot, Bot);
        msg.chatData = chatData;
        // console.log('T1')
        next();
      })
    })

    /**
    * Check is user submitted 'Main menu'.
    * This message deletes the chat from the state table.
    */
    bot.onTextMessage((msg, next) => {
      switch(msg.body.toLowerCase()) {
        case 'main menu':
          state.deleteChat(msg.chatId, err => {
            if (err) return this.handleErr(err, 'I3', msg, bot, Bot);
            // console.log('T2')
            this.sendMsg(`Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
          })
          break;
        default:
          // console.log('T3')
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Check your posts':
          const quotes = new Quotes(msg.chatData.result, msg, Bot, bot);
          // console.log('T4')
          break;
        default:
          // console.log('T5')
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Check your awarded':
          const awarded = new Awarded(msg.chatData.result, msg, Bot, bot);
          // console.log('T6')
          break;
        default:
          // console.log('T7')
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      if (msg.chatData.result.allowAnything) {
        // console.log('T8')
        next();
        return;
      }
      switch(msg.chatData.result.direction) {
        case 'home':
          switch(msg.body) {
            case 'I\'m looking for work':
            case 'I\'m looking to hire':
              msg.chatData.result.direction = msg.body.split(' ').slice(-1)[0];
              state.updateDirection(msg.chatId, msg.chatData.result.direction, err => {
                if (err) return this.handleErr(err, 'I7', msg, bot, Bot);
                // console.log('T9')
                next();
              })
              break;
            default:
              this.sendMsg(`Are you looking for work, or are you looking to hire?`, masterStages('home'), msg, bot, Bot);
              // console.log('T10')
              break;
          }
          break;
        case 'work':
        case 'hire':
          // console.log('T11')
          next();
          break;
      }
    })

    /**
    * If the chat is new updates stage
    * else calls next
    * this step also adds user info to gigAPI if not exists
    */
    bot.onTextMessage((msg, next) => {
      switch(msg.chatData.created) {
        case true:
          // Adds user to API
          bot.getUserProfile(msg.from)
            .then(user => {
              apiHandler.postUser(user.username, user.firstName, user.lastName, user.profilePicUrl, (err, data) => {
                if (err) return this.handleErr(err, 'I6', msg, bot, Bot);

                state.updateStage(msg.chatId, msg.chatData.result, (err, data) => {
                  if (err) return this.handleErr(err, 'I2', msg, bot, Bot);

                  const direction = msg.chatData.result.direction;

                  const msgs = {
                    work: `Great, you came to the right place to find a job!`,
                    hire: `Great, we have just the person for the job!`,
                  }
                  // console.log('T12')
                  this.sendMsg(msgs[direction], masterStages(direction), msg, bot, Bot);
                })
              });
            });
          break;
        case false:
          // console.log('T13')
          switch(msg.body) {
            case 'I\'m looking for work':
            case 'I\'m looking to hire':
              state.updateStage(msg.chatId, msg.chatData.result, (err, data) => {
                if (err) return this.handleErr(err, 'I2', msg, bot, Bot);

                const direction = msg.chatData.result.direction;

                const msgs = {
                  work: `Great, you came to the right place to find a job!`,
                  hire: `Great, we have just the person for the job!`,
                }
                // console.log('T12')
                this.sendMsg(msgs[direction], masterStages(direction), msg, bot, Bot);
              })
              break;
            default:
              next();
              break;
          }
      }
    })

    /**
    * 'Contact' and 'Award' come before allowAything
    * because these can be called at anytime.
    */
    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Contact':
          const contact = new Contact(msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
          // console.log('T14')
          break;
        default:
          // console.log('T15')
          next();
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body.split(' ')[0]) {
        case 'Award':
          const award = new Award(msg.chatData.result, msg, Bot, bot, msg.body);
          // console.log('T16')
          break;
        default:
          next();
          // console.log('T17')
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body.split(' ')[0]) {
        case 'Rate':
          const final = new Rate(msg.chatData.result, msg, Bot, bot, msg.body);
          // console.log('T18')
          break;
        default:
          // console.log('T19')
          next();
          break;
      }
    })

     /**
    * Routes allows for easy pattern matching for
    * instantiating the correct Route class
    */
    const Routes = {
      'Contact': Contact,
      'Browse products': Browse,
      'Browse jobs': Browse,
      'Post a job': PostJob,
      'Post a product': PostProduct,
      'Check your posts': Quotes,
      'Award': Award,
      'Check your awarded': Awarded,
      'Rate': Rate,
    };

    /**
    * If allowAnthing is true
    * allowAnything is changed by the individual Route
    * classes only
    * after they have reset the state.
    */
    bot.onTextMessage((msg, next) => {
      switch(msg.chatData.result.allowAnything) {
        case true:
          // console.log('--->', msg.chatData.result.stage, '<---');
          const route = new Routes[msg.chatData.result.stage](msg.chatData.result, msg, Bot, bot, msg.chatData.result.stage);
          // console.log('T20')
          break;
        case false:
          next();
          // console.log('T21')
          break;
      }
    })

    /**
    * Everything below here instantiates the correct Route class
    * based on the users input, if allowAnthing is false.
    */

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Browse products':
        case 'Browse jobs':
          const browse = new Browse(msg.chatData.result, msg, Bot, bot, msg.body);
          // console.log('T22')
          break;
        default:
          next();
          // console.log('T23')
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Post a job':
          const postJob = new PostJob(msg.chatData.result, msg, Bot, bot);
          // console.log('T24')
          break;
        default:
          next();
          // console.log('T25')
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Post a product':
          const postProduct = new PostProduct(msg.chatData.result, msg, Bot, bot);
          // console.log('T26')
          break;
        default:
          next();
          // console.log('T27')
          break;
      }
    })

    bot.onTextMessage((msg, next) => {
      switch(msg.body) {
        case 'Check your awarded':
          const awarded = new Awarded(msg.chatData.result, msg, Bot, bot);
          // console.log('T28')
          break;
        default:
          next();
          // console.log('T29')
          break;
      }
    })

    /**
    * Default failsafe
    */
    bot.onTextMessage(msg => {
      state.deleteChat(msg.chatId, err => {
        if (err) return this.handleErr(err, 'I5', msg, bot, Bot);
        this.sendMsg(`Sorry I didn't catch that.`, masterStages('home'), msg, bot, Bot);
        // console.log('T30')
      })
    });
  }
}