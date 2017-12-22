const { MessengerBot, MongoSessionStore } = require('bottender');
const { createServer } = require('bottender/express');
const MongoClient = require('mongodb').MongoClient;

// read configs
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/checkin';
const config = require('./bottender.config.js').messenger;

// import self-defined functions and constants
const { getLocation, getTimeStamp, getImageUrl, calcTime, formatTime } = require('./utils');
const { prepareCheckIn } = require('./models');
const { insertCheckIn } = require('./db');
const P = require('./constants').PAYLOADS;

function genQuickReply(payloads) {
  const qrs = [];
  payloads.forEach((p) => {
    switch (p) {
      case P.CHECK_IN:
        qrs.push({
          content_type: 'text',
          title: '做功德',
          payload: P.CHECK_IN,
        });
        break;
      case P.CHECK_OUT:
        qrs.push({
          content_type: 'text',
          title: '不做了',
          payload: P.CHECK_OUT,
        });
        break;
      case P.SEND_LOCATION:
        qrs.push({
          content_type: 'location',
          title: '傳送位置',
          payload: P.SEND_LOCATION,
        });
        break;
      default: break;
    }
  });
  return { quick_replies: qrs };
}

// initialization
async function main() {
  const db = await MongoClient.connect(MONGODB_URI); //TODO: close it
  const bot = new MessengerBot({
    accessToken: process.env.accessToken || config.accessToken,
    appSecret: process.env.appSecret || config.appSecret,
    sessionStore: new MongoSessionStore(MONGODB_URI),
  });
  bot.setInitialState({
    isWorking: false,
    startTime: null,
    endTime: null,
    location: null,
    locationTimestamp: null,
    imgUrls: [],
  });

  bot.onEvent(async context => {
    // console.log('context:', context);
    // console.log('rawEvent:', context.event._rawEvent);
    const postbackPayload = context.event.isPostback ? context.event.postback.payload : null;
    const text = context.event.isText ? context.event.text : null;
    const location = context.event.isLocation && context.event.hasAttachment ? getLocation(context) : null;
    const locationTimestamp = context.event.isLocation && context.event.hasAttachment ? getTimeStamp(context) : null;
    const imgUrl = context.event.isImage && context.event.hasAttachment ? getImageUrl(context) : null;

    // handle welcome message
    if (postbackPayload === P.GET_STARTED) {
      context.resetState();
      await context.sendText('歡迎使用功德無量打卡機，這是一款協助你紀錄工時、搜集勞檢證據，同時製造無量功德的打卡機器人。');
      await context.sendText('- 輸入「做功德」或「上班」，就會開始幫你計算工時。\n- 再輸入「不做了」或「下班」，就會截止計算。');
      await context.sendText('在上班的過程中，你可以紀錄你工作的地點，並上傳可以證明你在工作、或有助於證明雇主違法的照片。\n\n未來若發生超時工作、加班未給加班費或補休等違法的狀況，將有助於你進行檢舉。');
      await context.sendText('馬上就來使用看看吧！', genQuickReply([P.CHECK_IN]));
      return;
    }
    if (postbackPayload || text) {
      if (['做功德', '上班'].indexOf(text) >= 0 || postbackPayload === P.CHECK_IN) {
        if (!context.state.isWorking) {
          // state: not working
          context.setState({ isWorking: true, startTime: new Date() });
          // console.log('after setting state:', context.state);
          await context.sendText('哈庫納罵踏踏！！ 你的功德正在源源不絕地產生中...');
          await context.sendText('不如再按下 “Send Location” 傳送你的位置吧，我們會幫你記錄下你工作的位置！');
          await context.sendText('記得要先開啟 GPS 定位哦！', genQuickReply([P.SEND_LOCATION, P.CHECK_OUT]));
        } else {
          // state: is working
          if (!context.state.location) {
            await context.sendText('哎呀！ 你居然不知道你已經在做功德了！？ 不如這樣，順便按下 “Send Location” 傳送你的位置吧，我們會幫你記錄下你工作的位置！');
            await context.sendText('記得要先開啟 GPS 定位哦！', genQuickReply([P.SEND_LOCATION, P.CHECK_OUT]));
          } else if (context.state.imgUrls.length === 0) {
            await context.sendText('唔... 你其實已經在做功德了！ 不如這樣，上傳幾張可以證明你在工作、或證明雇主違法的照片，我們會幫你存起來！');
            await context.sendText('上傳圖片的按鈕，就是原本內建的那顆按鈕喔！', genQuickReply([P.CHECK_OUT]));
          }
        }
      } else if (['不做了', '下班'].indexOf(text) >= 0 || postbackPayload === P.CHECK_OUT) {
        if (context.state.isWorking) {
          context.setState({ isWorking: false, endTime: new Date() });
          // console.log('after setting state:', context.state);

          // prepare check in data
          const userId = context._session._id;
          const checkIn = prepareCheckIn(userId, context.state);
          await insertCheckIn(db, checkIn);

          // send ending message
          const time = context.state.endTime - context.state.startTime;
          await context.sendText(`你今天總共生產了 ${formatTime(calcTime(time))} 的功德，已經存到台灣功德大數據資料庫內。`)
          await context.sendText('台灣因為有你的功德，才能有今日亮眼的經濟成績。\n\n善哉善哉，讚嘆、感恩施主。', genQuickReply([P.CHECK_IN]));

          // reset state
          context.resetState();
        } else {
          await context.sendText('哎呀，其實你今天還沒開始做功德啦，現在馬上開始做吧！', genQuickReply([P.CHECK_IN]));
        }
      } else if (text) {
        context.sendText(`${context.event.text}`);
      }
    } else if (location && locationTimestamp) {
      // console.log('isLocation && hasAttachments:', location, locationTimestamp);
      // handle location message
      if (context.state.isWorking) {
        context.setState({ location, locationTimestamp });
        // console.log('after setting state:', context.state);
        await context.sendText('唔... 真是神秘的功德產生地。\n不過地點已經成功儲存了，現在不如傳幾張可以證明你在工作、或證明雇主違法的照片吧！');
        await context.sendText('上傳圖片的按鈕，就是原本內建的那顆按鈕喔！', genQuickReply([P.CHECK_OUT]));
      } else {
        context.setState({
          isWorking: true,
          startTime: new Date(),
          location,
          locationTimestamp,
        })
        await context.sendText('工作位置已記錄，開啟做功德模式！ 現在不如傳幾張可以證明你在工作、或證明雇主違法的照片吧！');
        await context.sendText('上傳圖片的按鈕，就是原本內建的那顆按鈕喔！', genQuickReply([P.CHECK_OUT]));
      }
    } else if (imgUrl) {
      // console.log('isImage:', imgUrl);
      if (context.state.isWorking) {
        context.setState({ imgUrls: context.state.imgUrls.concat([imgUrl]) });
        // console.log('after setting state:', context.state);
        if (!context.state.location) {
          await context.sendText('感謝大大無私奉獻，需要上傳更多張也沒問題！\n然後，不如再按下 “Send Location” 傳送你的位置吧！');
          await context.sendText('記得要先開啟 GPS 定位哦！', genQuickReply([P.SEND_LOCATION, P.CHECK_OUT]));
        } else {
          await context.sendText('感謝大大無私奉獻！ 照片已儲存，需要上傳更多張也沒問題！', genQuickReply([P.CHECK_OUT]));
        }
      }
    }
  });

  const server = createServer(bot, {
    verifyToken: process.env.verifyToken || config.verifyToken,
  });

  server.listen(PORT, () => {
    console.log(`server is running on ${PORT} port...`);
  });
}

main();
