const P = require("../constants").PAYLOADS;
const {
  getLocation,
  getTimeStamp,
  getImageUrl,
  calcTime,
  formatTime,
  genQuickReply,
  genRandomReply,
} = require("../utils");
const { prepareCheckIn } = require("../models");
const {
  insertCheckIn,
  findOrCreateUserUrlKey,
  getWorkingUserCount,
  insertTextAsCorpus,
} = require("../db");

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
const handlers = [
  // handle get started
  {
    event: [{ postbackPayload: P.GET_STARTED }, { payload: P.GET_STARTED }],
    handler: async (context, db, terminate) => {
      context.resetState();
      await context.sendText(
        "歡迎使用功德無量打卡機，這是一款協助你紀錄工時、計算加班費，同時製造無量功德的聊天機器人。"
      );
      await context.sendText(
        "馬上就來使用看看吧！",
        genQuickReply([P.CHECK_IN])
      );
      terminate();
    },
  },
  // handle check in while not in working state
  {
    state: [{ isWorking: false }],
    event: [
      { text: ["做功德", "上班"] },
      { postbackPayload: P.CHECK_IN },
      { payload: P.CHECK_IN },
    ],
    handler: async (context, db, terminate) => {
      context.setState({ isWorking: true, startTime: new Date() });
      await context.sendText(
        "哈庫納罵踏踏！！ 你的功德正在源源不絕地產生中..."
      );
      await context.sendText(
        "不如來看看其他人已經產生了多少功德？",
        genQuickReply([
          P.VIEW_TOTAL_WORKING_TIME,
          P.VIEW_WORKING_USER_COUNT,
          P.VIEW_MY_WORKING_TIME,
          P.CHECK_OUT,
        ])
      );
      terminate();
    },
  },
  // handle check in while in working state
  {
    state: [{ isWorking: true }],
    event: [
      { text: ["做功德", "上班"] },
      { postbackPayload: P.CHECK_IN },
      { payload: P.CHECK_IN },
    ],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "哎呀，你已經在做功德了啦！ 不如看看其他人做了多少功德吧！",
        genQuickReply([
          P.VIEW_TOTAL_WORKING_TIME,
          P.VIEW_WORKING_USER_COUNT,
          P.CHECK_OUT,
        ])
      );
      terminate();
    },
  },
  // handle check out while not in working state
  {
    state: [{ isWorking: false }],
    event: [
      { text: ["不做了", "下班"] },
      { postbackPayload: P.CHECK_OUT },
      { payload: P.CHECK_OUT },
    ],
    handler: async (context, db, terminate) => {
      await context.sendText(
        "哎呀，其實你今天還沒開始做功德啦，現在馬上開始做吧！",
        genQuickReply([P.CHECK_IN])
      );
      terminate();
    },
  },
  // handle check out while in working state
  {
    state: [{ isWorking: true }],
    event: [
      { text: ["不做了", "下班"] },
      { postbackPayload: P.CHECK_OUT },
      { payload: P.CHECK_OUT },
    ],
    handler: async (context, db, terminate) => {
      context.setState({ isWorking: false, endTime: new Date() });

      // prepare check in data
      const userId = context._session._id;
      const checkIn = prepareCheckIn(userId, context.state);
      await insertCheckIn(db, checkIn);

      // send ending message
      const time =
        context.state.endTime.getTime() - context.state.startTime.getTime();
      await context.sendText(
        `你今天總共生產了 ${formatTime(
          calcTime(time)
        )} 的功德，已經存到台灣功德大數據資料庫內。`
      );
      await context.sendText(
        "台灣因為有你的功德，才能有今日亮眼的經濟成績。\n\n善哉善哉，讚嘆、感恩施主。",
        genQuickReply([
          P.VIEW_MY_WORKING_TIME,
          P.VIEW_WORKING_USER_COUNT,
          P.VIEW_TOTAL_WORKING_TIME,
          P.CHECK_IN,
        ])
      );

      // reset state
      context.resetState();
      terminate();
    },
  },
  {
    event: [
      { text: ["查看我的功德", "查看我的工時"] },
      { postbackPayload: P.VIEW_MY_WORKING_TIME },
      { payload: P.VIEW_MY_WORKING_TIME },
    ],
    handler: async (context, db, terminate) => {
      const userId = context._session._id;
      const urlKey = await findOrCreateUserUrlKey(db, userId);
      const url = `https://goodjoblife.github.io/check-in-frontend/#/check-ins/${urlKey}`;
      const qrPayloads = [P.VIEW_TOTAL_WORKING_TIME, P.VIEW_WORKING_USER_COUNT];
      qrPayloads.push(context.state.isWorking ? P.CHECK_OUT : P.CHECK_IN);
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
      { text: ["看看全台灣功德量"] },
      { postbackPayload: P.VIEW_TOTAL_WORKING_TIME },
      { payload: P.VIEW_TOTAL_WORKING_TIME },
    ],
    handler: async (context, db, terminate) => {
      const userId = context._session._id;
      const urlKey = await findOrCreateUserUrlKey(db, userId);
      const url = "https://goodjoblife.github.io/check-in-frontend/#/";
      const qrPayloads = [P.VIEW_WORKING_USER_COUNT, P.VIEW_MY_WORKING_TIME];
      qrPayloads.push(context.state.isWorking ? P.CHECK_OUT : P.CHECK_IN);
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
      { text: ["看看多少人在做功德"] },
      { postbackPayload: P.VIEW_WORKING_USER_COUNT },
      { payload: P.VIEW_WORKING_USER_COUNT },
    ],
    handler: async (context, db, terminate) => {
      const { count, total } = await getWorkingUserCount(db);
      const percent = Math.round(count / total * 100);
      if (percent > 30) {
        await context.sendText(
          `哇！ 現在還有 ${percent}% 的使用者和你一起在做功德呢！ 你並不孤單喔！`
        );
        await context.sendText(
          '為了台灣的經濟，犧牲奉獻一點，做點功德，沒關係的啦^^"',
          genQuickReply([P.VIEW_MY_WORKING_TIME, P.CHECK_OUT])
        );
      } else {
        await context.sendText(
          `呃...好像只剩 ${percent}% 的使用者還在做功德耶。`
        );
        await context.sendText(
          "也沒關係啦，俗話說一個便當吃不飽，可以吃兩個。\n\n做一點功德還不夠，可以做兩點呀！"
        );
        await context.sendText(
          `樂觀一點想，還有 ${percent}% 的使用者在陪你做功德嘛`,
          genQuickReply([P.VIEW_MY_WORKING_TIME, P.CHECK_OUT])
        );
      }
      terminate();
    },
  },
  {
    state: [{ isWorking: false }],
    event: [
      { text: ["看看還有多少人在做功德"] },
      { postbackPayload: P.VIEW_WORKING_USER_COUNT },
      { payload: P.VIEW_WORKING_USER_COUNT },
    ],
    handler: async (context, db, terminate) => {
      const { count, total } = await getWorkingUserCount(db);
      const percent = Math.round(count / total * 100);
      if (percent > 30) {
        await context.sendText(`哇！ 現在還有 ${percent}% 的使用者在做功德...`);
        await context.sendText(
          '本打卡機覺得台灣真是個寶島，勞工為國家的經濟發展犧牲奉獻，GDP卻越分越少，簡直便宜大碗又好用，這種地方哪裡找呀^^"'
        );
        await context.sendText(
          "明天記得也要上班做功德喔 ^＿^",
          genQuickReply([P.VIEW_MY_WORKING_TIME, P.CHECK_IN])
        );
      } else {
        await context.sendText(`只剩 ${percent}% 的使用者還在做功德了`);
        await context.sendText(
          "明天記得也要上班做功德，讓台灣功德滿滿，台灣萬歲 ^O^！",
          genQuickReply([P.VIEW_MY_WORKING_TIME, P.CHECK_IN])
        );
      }
      terminate();
    },
  },
  {
    handler: async (context, db, terminate) => {
      const reply = genRandomReply();
      await context.sendText(reply);
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
  return { postbackPayload, payload, text };
};

const mainHandler = db => async context => {
  // get information from context.event e.g. text & postbackPayload ...
  const eventPayload = getPayloadFromContext(context);

  // flag to break handlers loop
  let endFlag = false;
  const terminate = () => {
    endFlag = true;
  };

  console.log(context.state, eventPayload);
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

module.exports = mainHandler;
