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

const quickReply = {
  quick_replies: [
    {
      content_type: 'text',
      title: '做功德',
      payload: 'CHECK_IN',
    },
    {
      content_type: 'text',
      title: '不做了',
      payload: 'CHECK_OUT',
    },
    {
      content_type: 'location',
      title: '傳送位置',
      payload: 'SEND_LOCATION',
    },
  ],
};

bot.setInitialState({
  working: false,
  startTime: null,
  endTime: null,
});

bot.onEvent(async context => {
  if (context.event.isText) {
    console.log('isText:', context.event.text);
    switch (context.event.text) {
      case '做功德':
        if (context.state.working) {
          await context.sendText('You have already check in', quickReply);
        } else {
          context.setState({ working: true, startTime: new Date() });
          await context.sendText('哈庫納罵踏踏！！ 你的功德正在源源不絕地產生中，你感覺到了嗎？', quickReply);
        }
        break;
      case '不做了':
        if (context.state.working) {
          context.setState({ working: false, startTime: context.state.startTime, endTime: new Date() });
          const time = context.state.endTime - context.state.startTime;
          await context.sendText(`你今天總共生產了${time}單位的功德，台灣因為有你的功德而美好。休息一下，明天再來吧。所有功德已存到台灣海量功德大數據資料庫。`, quickReply);
        } else {
          await context.sendText('You havent check in', quickReply);
        }
        break;
      default:
        await context.sendText(`${context.event.text}`);
    }
  } else if (context.event.isLocation) {
    console.log('isLocation:', context.event);
  } else if (context.event.isPostback) {
    console.log('isPostback:', context.event.postback);
  } else if (context.event.isImage) {
    console.log('isImage:', context.event);
  }
});

const server = createServer(bot, {
  verifyToken: process.env.verifyToken || config.verifyToken,
});

server.listen(PORT, () => {
  console.log(`server is running on ${PORT} port...`);
});
