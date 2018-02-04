const { middleware, MessengerHandler } = require("bottender");
const P = require("../constants").PAYLOADS;
const { tutorialHandler } = require("./tutorialHandler");
const FRONTEND_URL = require("config").FRONTEND_URL;

const {
  INIT_STATE,
  REMINDER_DAYS_MAPPING,
  MIN_TIME_INTERVAL,
} = require("../constants");
const {
  getLocation,
  getTimeStamp,
  getImageUrl,
  calcTime,
  calcCheckInDayCount,
  getEncouragement,
  pad,
  formatTime,
  genQuickReply,
  genRandomReply,
  getTodayPromoteImage,
  resetCheckInState,
  parseTime,
  getClosestTime,
} = require("../utils");
const { prepareCheckIn } = require("../models");
const {
  insertCheckIn,
  getUserCheckIns,
  findOrCreateUserUrlKey,
  getWorkingUserCount,
  insertTextAsCorpus,
  setReminder,
} = require("../db");

const { createLoggingHandler } = require("./logging");

/**
 * This is an array of handlers. Each handlers can have `event`, `state`, `handler`
 * 基本規則：
 *  1. 看到物件 {}，就是要全部對才會是 true
 *  2. 看到陣列 []，只要一個對就是 true
 *
 * e.g.
 *  state: [{ isWorking: false }],
 *  event: [
 *     { text: ["做功德", "上班"] },
 *     { postbackPayload: P.CHECK_IN },
 *  ]
 *  代表 ( isWorking === false ) &&
 *      (
 *        (text in ["做功德", "上班"]) ||
 *        (postbackPayload === P.CHECK_IN)
 *      )
 *
 * handler 則是當上述條件判定為 true 時，會執行的 callback 函數。
 * handlers 的順序有差，如果 handler 內沒有執行 terminate，就會一直往下判定，判定過了就會執行。
 *
 */
// 這是一款協助你紀錄工時、計算加班費，同時製造無量功德的聊天機器人
const handlers = [
  // a simple trick to do migration
  {
    handler: async (context, db, terminate) => {
      const init = {};
      Object.keys(INIT_STATE).forEach(key => {
        if (context.state[key] === undefined) {
          init[key] = INIT_STATE[key];
        }
      });
      context.setState(init);
    },
  },
  // show 每日功德語圖片
  {
    event: [{ text: ["每日功德語", "今日功德語", "功德語"] }],
    handler: async (context, db, terminate) => {
      const imgUrl = getTodayPromoteImage();
      let qrs = null;
      if (context.state.seenTutorial) {
        qrs = genQuickReply([{ type: P.SHOW_QUICK_REPLY_MENU }]);
      } else {
        qrs = genQuickReply([{ type: P.GET_STARTED, text: "開始教學" }]);
      }

      if (imgUrl) {
        await context.sendText("本日功德語：");
        await context.sendImage(imgUrl, qrs);
      } else {
        await context.sendText("哎呦，今天沒有功德語啦", qrs);
      }
      terminate();
    },
  },
  // 重置狀態用的
  {
    event: [{ text: ["GoodJob重置"] }],
    handler: async (context, db, terminate) => {
      context.resetState();
      terminate();
    },
  },
  // handle get started
  {
    event: [{ postbackPayload: P.GET_STARTED }, { payload: P.GET_STARTED }],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "來呦，功能表在這！",
        genQuickReply([{ type: P.SHOW_QUICK_REPLY_MENU }])
      );
      terminate();
    },
  },
  {
    event: [{ text: "好，我懂了，開始使用！" }],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "太好了！ 馬上來做功德吧！",
        genQuickReply([{ type: P.CHECK_IN }])
      );
      terminate();
    },
  },
  /** 這個 handler 要解決兩個問題：
   * 1. 部分的裝置在第一次使用的時候，不會出現「開始使用」的按鈕。為了避免它沒有經過教學流程，這邊等於是強制他走完教學流程。
   * 2. 部分使用者已經使用過舊版的 handler ，不會再按「開始使用」一次，這邊也是把它攔截下來，讓他跑教學流程。
   */
  {
    state: [{ seenTutorial: false }],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "嗨嗨你好，我是功德無量打卡機本人，請叫我阿德就好。\n\n(請看完教學才能正常使用呦）",
        genQuickReply([{ text: "你是誰? 你可以幹嘛?" }])
      );
      terminate();
    },
  },
  // handlers for setting reminders
  {
    event: [
      { text: ["設定打卡提醒"] },
      { postbackPayload: P.SET_REMINDER },
      { payload: P.SET_REMINDER },
    ],
    handler: async (context, db, terminate) => {
      context.setState({ setReminderStep: 1 });
      const qrPayloads = [
        { text: "週一到週五" },
        { text: "週一" },
        { text: "週二" },
        { text: "週三" },
        { text: "週四" },
        { text: "週五" },
        { text: "週六" },
        { text: "週日" },
      ];
      await context.sendText(
        "打卡提醒就像鬧鐘一樣，會在你指定的時間主動丟訊息給你，提醒你要打卡上班/下班！"
      );
      await context.sendText("一個提醒如果不夠用，可以設定很多個喔！");
      await context.sendText("要在禮拜幾提醒你呢？", genQuickReply(qrPayloads));
      terminate();
    },
  },
  {
    event: [
      {
        text: [
          "週一到週五",
          "週一",
          "週二",
          "週三",
          "週四",
          "週五",
          "週六",
          "週日",
        ],
      },
    ],
    state: [{ setReminderStep: 1 }],
    handler: async (context, db, terminate) => {
      const days = REMINDER_DAYS_MAPPING[context.event.text];
      context.setState({
        reminderData: {
          ...context.state.reminderData,
          days,
        },
        setReminderStep: 2,
      });
      const qrPayloads = [
        { text: "08:00" },
        { text: "08:30" },
        { text: "09:00" },
        { text: "17:00" },
        { text: "18:00" },
        { text: "19:00" },
      ];
      await context.sendText(
        "幾點幾分呢？\n可輸入 24 小時制的時間，例如：08:00、17:00、20:00。或按以下按鈕快速設定。",
        genQuickReply(qrPayloads)
      );
      terminate();
    },
  },
  {
    event: [{ text: "放棄設定" }],
    state: [{ setReminderStep: 2 }],
    handler: async (context, db, terminate) => {
      context.setState({ setReminderStep: 0 });
      await context.sendText(
        "也沒關係！ 那來試試看其他功能！",
        genQuickReply([{ type: P.SHOW_QUICK_REPLY_MENU }])
      );
      terminate();
    },
  },
  {
    state: [{ setReminderStep: 2 }],
    handler: async (context, db, terminate) => {
      const parsedTime = parseTime(context.event.text);
      if (parsedTime === null) {
        const qrPayloads = [
          { text: "08:00" },
          { text: "08:30" },
          { text: "09:00" },
          { text: "17:00" },
          { text: "18:00" },
          { text: "19:00" },
          { text: "放棄設定" },
        ];
        await context.sendText(
          "糟糕，時間的格式好像有點小錯誤，請再重新輸入一次！\n是 24 小時制的時間，例如：08:00、17:00、20:00。",
          genQuickReply(qrPayloads)
        );
      } else {
        const time = getClosestTime(parsedTime, MIN_TIME_INTERVAL);
        context.setState({
          setReminderStep: 3,
          reminderData: {
            ...context.state.reminderData,
            hour: time.hour,
            min: time.min,
          },
        });
        if (parsedTime.hour !== time.hour || parsedTime.min !== time.min) {
          await context.sendText(
            `考量伺服器效能，最小時間區間是 ${MIN_TIME_INTERVAL} 分鐘，所以設定成 ${pad(
              time.hour,
              2
            )}:${pad(time.min, 2)} 噢！`
          );
        }
        await context.sendText(
          "請輸入一句提醒自己的話：\n(例如：上班做功德囉、下班陪家人去！)",
          genQuickReply([
            { text: "記得上班打卡！" },
            { text: "記得下班打卡！" },
          ])
        );
      }
      terminate();
    },
  },
  {
    state: [{ setReminderStep: 3 }],
    handler: async (context, db, terminate) => {
      context.setState({
        setReminderStep: 4,
        reminderData: {
          ...context.state.reminderData,
          text: context.event.text,
        },
      });
      const userData = {
        id: context._session._id,
        platformId: context._session.id,
        platform: context._session.platform,
      };
      try {
        await setReminder(db, userData, context.state.reminderData);
        const userId = context._session._id;
        const urlKey = await findOrCreateUserUrlKey(db, userId);
        const url = `${FRONTEND_URL}/#/reminders/${urlKey}`;
        await context.sendText("恭喜你，成功設定打卡提醒！");
        await context.sendButtonTemplate(
          "點擊下方按鈕，你可以看到你所有的打卡提醒，並可以進行刪除",
          [
            {
              type: "web_url",
              url,
              title: "打開",
            },
          ]
        );
      } catch (err) {
        await context.sendText(
          "糟糕，好像發生一點小錯誤，重新再試試看！",
          genQuickReply([{ text: "設定打卡提醒" }])
        );
        throw err;
      }
      terminate();
    },
  },
  // handle check in while not in working state
  {
    state: [{ isWorking: false }],
    event: [
      { text: ["做功德", "上班", "上班做功德", "打卡", "開始上班做功德"] },
      { postbackPayload: P.CHECK_IN },
      { payload: P.CHECK_IN },
    ],
    handler: async (context, db, terminate) => {
      context.setState({ isWorking: true, startTime: new Date() });
      await context.sendText(
        "哈庫納罵踏踏！！ 你的功德正在源源不絕地產生中..."
      );
      await context.sendText(
        "不如再記錄下你的工作位置吧！",
        genQuickReply([
          { type: P.SEND_LOCATION },
          { text: "暫時不上傳位置" },
          { type: P.CHECK_OUT },
        ])
      );
      terminate();
    },
  },
  {
    event: [{ text: "暫時不上傳位置" }],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "好呦，也沒關係，你也可以...",
        genQuickReply([
          { type: P.VIEW_TOTAL_WORKING_TIME },
          { type: P.CHECK_OUT },
        ])
      );
      terminate();
    },
  },
  // handle user sending location
  {
    event: [{ hasLocation: true }],
    handler: async (context, db, terminate) => {
      const location = getLocation(context);
      const locationTimestamp = getTimeStamp(context);
      if (context.state.isWorking) {
        context.setState({ location, locationTimestamp });
      } else {
        context.setState({
          isWorking: true,
          startTime: new Date(),
          location,
          locationTimestamp,
        });
      }
      await context.sendText(
        "打卡成功！\n\n不如...",
        genQuickReply([
          { type: P.VIEW_TOTAL_WORKING_TIME },
          { type: P.CHECK_OUT },
        ])
      );
      terminate();
    },
  },
  // handle check in while in working state
  {
    state: [{ isWorking: true }],
    event: [
      { text: ["做功德", "上班", "開始上班做功德"] },
      { postbackPayload: P.CHECK_IN },
      { payload: P.CHECK_IN },
    ],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "哎呀，你已經在做功德了啦！ 不如再記錄下你的工作位置吧！",
        genQuickReply([{ type: P.SEND_LOCATION }, { type: P.CHECK_OUT }])
      );
      terminate();
    },
  },
  // handle check out while not in working state
  {
    state: [{ isWorking: false }],
    event: [
      { text: ["不做了", "下班", "下班了，不做了"] },
      { postbackPayload: P.CHECK_OUT },
      { payload: P.CHECK_OUT },
    ],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "哎呀，其實你今天還沒開始做功德啦，現在馬上開始做吧！",
        genQuickReply([{ type: P.CHECK_IN }])
      );
      terminate();
    },
  },
  // handle check out while in working state
  {
    state: [{ isWorking: true }],
    event: [
      { text: ["不做了", "下班", "打卡", "下班，不做了"] },
      { postbackPayload: P.CHECK_OUT },
      { payload: P.CHECK_OUT },
    ],
    handler: async (context, db, terminate) => {
      context.setState({ isWorking: false, endTime: new Date() });

      // prepare check in data
      const userId = context._session._id;
      const checkIn = prepareCheckIn(userId, context.state);
      await insertCheckIn(db, checkIn);

      // send ending message
      const time =
        context.state.endTime.getTime() - context.state.startTime.getTime();
      await context.sendText(
        `你今天總共生產了 ${formatTime(
          calcTime(time)
        )} 的功德，已經存到台灣功德大數據資料庫內。`
      );

      const userCheckIns = await getUserCheckIns(db, userId);
      const nUserCheckIns = calcCheckInDayCount(userCheckIns);
      const encouragement = getEncouragement(nUserCheckIns);
      await context.sendText(
        `你已經打了${nUserCheckIns}天的卡\n${encouragement}`
      );
      await context.sendText(
        "這時候，你可以查看你的打卡記錄。\n\n或是，會擔心忘記打卡嗎？ 馬上來設定打卡提醒！",
        genQuickReply([
          { type: P.VIEW_MY_WORKING_TIME },
          { type: P.SET_REMINDER },
          { type: P.CHECK_IN },
        ])
      );

      // reset check-in state
      resetCheckInState(context);
      terminate();
    },
  },
  {
    event: [
      { text: ["查看我的功德", "查看我的工時", "查看我的打卡記錄"] },
      { postbackPayload: P.VIEW_MY_WORKING_TIME },
      { payload: P.VIEW_MY_WORKING_TIME },
    ],
    handler: async (context, db, terminate) => {
      const userId = context._session._id;
      const urlKey = await findOrCreateUserUrlKey(db, userId);
      const url = `${FRONTEND_URL}/#/check-ins/${urlKey}`;
      const qrPayloads = [
        { type: P.VIEW_TOTAL_WORKING_TIME },
        { type: P.VIEW_WORKING_USER_COUNT },
      ];
      qrPayloads.push(
        context.state.isWorking ? { type: P.CHECK_OUT } : { type: P.CHECK_IN }
      );
      await context.sendText(
        "你製造的功德都在這了，應該拿到的加班費也幫你算好了！"
      );
      await context.sendText(url);
      await context.sendText(
        "噓！肥水不落外人田，不要隨便給別人看呀！",
        genQuickReply(qrPayloads)
      );
      terminate();
    },
  },
  {
    event: [
      { text: ["查看我的打卡提醒", "管理我的打卡提醒"] },
      { postbackPayload: P.VIEW_MY_REMINDERS },
      { payload: P.VIEW_MY_REMINDERS },
    ],
    handler: async (context, db, terminate) => {
      const userId = context._session._id;
      const urlKey = await findOrCreateUserUrlKey(db, userId);
      const url = `${FRONTEND_URL}/#/reminders/${urlKey}`;
      await context.sendButtonTemplate(
        "點擊下方按鈕，你可以看到你所有的打卡提醒，並可以進行刪除",
        [
          {
            type: "web_url",
            url,
            title: "打開",
          },
        ]
      );
      terminate();
    },
  },
  {
    event: [
      { text: ["看看全台灣功德量", "查看全台灣功德量"] },
      { postbackPayload: P.VIEW_TOTAL_WORKING_TIME },
      { payload: P.VIEW_TOTAL_WORKING_TIME },
    ],
    handler: async (context, db, terminate) => {
      const userId = context._session._id;
      const urlKey = await findOrCreateUserUrlKey(db, userId);
      const url = FRONTEND_URL;
      const qrPayloads = [{ type: P.VIEW_WORKING_USER_COUNT }];
      qrPayloads.push(
        context.state.isWorking ? { type: P.CHECK_OUT } : { type: P.CHECK_IN }
      );
      await context.sendText(
        "想要全台灣勞工的累積的功德嗎？想要的話可以全部給你，去找吧！我把所有的功德都放在那裡了。"
      );
      await context.sendText(url);
      await context.sendText("或者是，你想...", genQuickReply(qrPayloads));
      terminate();
    },
  },
  {
    state: [{ isWorking: true }],
    event: [
      {
        text: [
          "看看多少人在做功德",
          "現在多少人在做功德",
          "查看還有多少人在上班",
          "查看多少人在上班",
        ],
      },
      { postbackPayload: P.VIEW_WORKING_USER_COUNT },
      { payload: P.VIEW_WORKING_USER_COUNT },
    ],
    handler: async (context, db, terminate) => {
      const { workingCount, offWorkCount } = await getWorkingUserCount(db);
      const total = workingCount + offWorkCount;
      const percent = Math.round(workingCount / total * 100);
      if (percent > 50) {
        await context.sendText(
          `哇！ 現在還有 ${workingCount}位（${percent} %）的使用者和你一起在做功德呢！ 你並不孤單喔！`,
          genQuickReply([{ type: P.CHECK_OUT }])
        );
      } else {
        await context.sendText(
          `嗚，只剩 ${workingCount}位（${percent} %）的使用者還沒下班。`
        );
        await context.sendText(
          "知道你為了工作而努力奮鬥，辛苦了，趕緊回家好好休息，休息是為了走更長遠的路！",
          genQuickReply([{ type: P.CHECK_OUT }])
        );
      }
      terminate();
    },
  },
  {
    state: [{ isWorking: false }],
    event: [
      {
        text: [
          "看看多少人在做功德",
          "現在多少人在做功德",
          "查看還有多少人在上班",
          "查看多少人在上班",
        ],
      },
      { postbackPayload: P.VIEW_WORKING_USER_COUNT },
      { payload: P.VIEW_WORKING_USER_COUNT },
    ],
    handler: async (context, db, terminate) => {
      const { workingCount, offWorkCount } = await getWorkingUserCount(db);
      const total = workingCount + offWorkCount;
      const percent = Math.round(workingCount / total * 100);
      if (percent > 30) {
        await context.sendText(
          `哇！ 現在還有 ${workingCount}位（${percent} %）的使用者在做功德...。\n幸好你已經下班了，明天記得也要上班做功德喔 ^＿^`,
          genQuickReply([
            { type: P.VIEW_MY_WORKING_TIME },
            { type: P.CHECK_IN },
          ])
        );
      } else {
        await context.sendText(
          `唔！ 目前 ${workingCount}位（${percent} %）使用者在上班！`
        );
        await context.sendText(
          "明天記得也要上班打卡做功德喔 ^O^！",
          genQuickReply([
            { type: P.VIEW_MY_WORKING_TIME },
            { type: P.CHECK_IN },
          ])
        );
      }
      terminate();
    },
  },
  // show quick reply menu
  {
    event: [
      { text: ["顯示功能表"] },
      { postbackPayload: P.SHOW_QUICK_REPLY_MENU },
      { payload: P.SHOW_QUICK_REPLY_MENU },
    ],
    handler: async (context, db, terminate) => {
      const qrPayloads = [
        { type: P.VIEW_MY_WORKING_TIME },
        { type: P.VIEW_MY_REMINDERS },
        { type: P.SET_REMINDER },
        { type: P.VIEW_WORKING_USER_COUNT },
        { type: P.VIEW_TOTAL_WORKING_TIME },
      ];
      qrPayloads.push(
        context.state.isWorking ? { type: P.CHECK_OUT } : { type: P.CHECK_IN }
      );
      await context.sendText("你可以...", genQuickReply(qrPayloads));
      terminate();
    },
  },
  // reply random string for rest condition
  {
    handler: async (context, db, terminate) => {
      const reply = genRandomReply();
      await context.sendText(
        reply,
        genQuickReply([{ type: P.SHOW_QUICK_REPLY_MENU }])
      );
      const userId = context._session._id;
      await insertTextAsCorpus(db, userId, context.event.text, reply);
    },
  },
];

const checkCondition = (conditions, fact) => {
  // console.log('condition:', conditions, 'fact:', fact);
  if (!conditions) {
    return true;
  }
  if (!(conditions instanceof Array)) {
    console.error("condition object format error");
    return false;
  }

  for (let i = 0; i < conditions.length; i += 1) {
    const condition = conditions[i];
    const fail = Object.keys(condition).some(key => {
      if (fact[key] === null) {
        return true;
      }
      if (condition[key] instanceof Array) {
        if (condition[key].indexOf(fact[key]) < 0) {
          return true;
        }
      } else {
        if (condition[key] !== fact[key]) {
          return true;
        }
      }
    });
    // if one of them you pass, then you pass it
    if (!fail) {
      return true;
    }
  }
  return false;
};

const getPayloadFromContext = context => {
  const postbackPayload = context.event.isPostback
    ? context.event.postback.payload
    : null;
  const payload = context.event.isPayload ? context.event.payload : null;
  const text = context.event.isText ? context.event.text : null;
  const hasLocation = context.event.isLocation && context.event.hasAttachment;
  /* temporally not in use
  const location =
    context.event.isLocation && context.event.hasAttachment
      ? getLocation(context)
      : null;
  const locationTimestamp =
    context.event.isLocation && context.event.hasAttachment
      ? getTimeStamp(context)
      : null;

  const imgUrl =
    context.event.isImage && context.event.hasAttachment
      ? getImageUrl(context)
      : null;

  const eventPayload = {
    postbackPayload,
    text,
  };
  */
  return { postbackPayload, payload, text, hasLocation };
};

const mainHandler = db => async context => {
  // get information from context.event e.g. text & postbackPayload ...
  const eventPayload = getPayloadFromContext(context);

  // flag to break handlers loop
  let endFlag = false;
  const terminate = () => {
    endFlag = true;
  };

  // handlers loop
  for (let i = 0; i < handlers.length; i += 1) {
    if (
      checkCondition(handlers[i].event, eventPayload) &&
      checkCondition(handlers[i].state, context.state)
    ) {
      if (handlers[i].handler) {
        await handlers[i].handler(context, db, terminate);
      }
    }
    if (endFlag) {
      break;
    }
  }
};

const createEventHandler = db => {
  const handler = new MessengerHandler();

  // The handler logic

  // return handler
  // work around: wrap the mainHandlerr
  const _handler = handler.build();
  return middleware([
    createLoggingHandler(db),
    async (context, next) => {
      await _handler(context);

      if (!context.isHandled) {
        await next();
      }
    },
    tutorialHandler(db),
    mainHandler(db),
  ]);
};

module.exports = {
  mainHandler,
  createEventHandler,
};
