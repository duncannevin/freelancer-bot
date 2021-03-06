import http from 'http';
import Bot from '@kikinteractive/kik';
import { _ } from 'lodash';

import App from './App';

const KIK_API_KEY = process.env.KIK_API_KEY || require('../dev-keys').KIK_API_KEY;
const KIK_USERNAME = process.env.KIK_USERNAME || require('../dev-keys').KIK_USERNAME;
const BASE_URL = process.env.BASE_URL || require('../dev-keys').BASE_URL;

let bot = new Bot({
  username: KIK_USERNAME,
  apiKey: KIK_API_KEY,
  baseUrl: BASE_URL,
});

bot.updateBotConfiguration();

/**
* App
*/
const app = new App(bot, Bot);

http
  .createServer(bot.incoming())
  .listen(process.env.PORT || 8080, () => {
    const PORT = process.env.PORT || 8080
    console.log('Hearing: ' + PORT);
  });