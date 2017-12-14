const { MessengerBot } = require('bottender');
const { createServer } = require('bottender/express');

const config = require('./bottender.config.js').messenger;

const bot = new MessengerBot({
  accessToken: config.accessToken,
  appSecret: config.appSecret,
});

bot.onEvent(async context => {
  if (context.event.isText) {
    console.log(context.event.text);
    await context.sendText(context.event.text);
  }
});

const server = createServer(bot, {
  verifyToken: config.verifyToken,
});

server.listen(5000, () => {
  console.log('server is running on 5000 port...');
});
