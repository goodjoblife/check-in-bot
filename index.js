const { MessengerBot, MongoSessionStore } = require('bottender');
const { createServer } = require('bottender/express');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/checkin';
const config = require('./bottender.config.js').messenger;

const bot = new MessengerBot({
  accessToken: process.env.accessToken || config.accessToken,
  appSecret: process.env.appSecret || config.appSecret,
  sessionStore: new MongoSessionStore(MONGODB_URI),
});

bot.setInitialState({
  working: false,
  startTime: null,
  endTime: null,
});

bot.onEvent(async context => {
  if (context.event.isText) {
    console.log(context.event.text);
    switch (context.event.text) {
      case 'in':
        if (context.state.working) {
          await context.sendText('You have already check in');
        } else {
          context.setState({ working: true, startTime: new Date() });
          await context.sendText('Check in');
        }
        break;
      case 'out':
        if (context.state.working) {
          context.setState({ working: false, startTime: context.state.startTime, endTime: new Date() });
          console.log(context._session._id);
          const time = context.state.endTime - context.state.startTime;
          await context.sendText(`Check out: ${time}`);
        } else {
          await context.sendText('You havent check in');
        }
        break;
      default:
        await context.sendText(`${context.event.text}`);
    }
  }
});

const server = createServer(bot, {
  verifyToken: process.env.verifyToken || config.verifyToken,
});

server.listen(PORT, () => {
  console.log(`server is running on ${PORT} port...`);
});
