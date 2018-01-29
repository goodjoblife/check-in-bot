// The list of payloads
const PAYLOADS = {
  CHECK_IN: "CHECK_IN", // 上班
  CHECK_OUT: "CHECK_OUT", // 下班
  SEND_LOCATION: "SEND_LOCATION", // 傳送位置
  GET_STARTED: "GET_STARTED", // 開始使用
  VIEW_MY_WORKING_TIME: "VIEW_MY_WORKING_TIME", // 查看我的工時
  VIEW_MY_REMINDERS: "VIEW_MY_REMINDERS", // 查看我的打卡提醒
  VIEW_TOTAL_WORKING_TIME: "VIEW_TOTAL_WORKING_TIME", // 查看全台總工時
  VIEW_WORKING_USER_COUNT: "VIEW_WORKING_USER_COUNT", // 查看還在工作的人數
  SHOW_QUICK_REPLY_MENU: "SHOW_QUICK_REPLY_MENU", // 顯示 quick reply 的功能表
  SET_REMINDER: "SET_REMINDER", // 設定打卡提醒
};

// initial state for bot
const INIT_STATE = {
  isWorking: false,
  startTime: null,
  endTime: null,
  location: null,
  locationTimestamp: null,
  imgUrls: [],
  seenTutorial: false,
  // for setting reminders
  setReminderStep: 0,
  reminderData: {
    days: [false, false, false, false, false, false, false], //[Sunday, Monday, Tuesday ... Saturaday]
    hour: null,
    min: null,
    text: "",
  },
};

// minimum and maximum length of check-in length to be accumulated
const CHECK_IN_LENGTH = {
  MIN: 0, // 300000, // 5 mins = 300,000 miliseconds
  MAX: 86400000, // 24 hours = 86400000 miliseconds
};

const RANDOM_REPLIES = [
  "你真的以為我這麼聰明？隨便寫字都能回覆你？🙄",
  "哎呀，我只是一個打卡機器人，沒有雲端大數據深度學習區塊鏈的技能，不會回話啦",
  "糟糕，我有點不太懂你在說什麼，不過，功德主，你有什麼請教嗎？😃",
  "看不懂你的話，我只是不過是一介打卡機器人🤖🤖🤖",
  "安安你好，我看不懂你的話。不過，你有聽過功德院嗎？🤔",
  "你說的我聽不懂，不過，你對我們的德德兄有什麼想法？😇",
  "你說的我聽不懂，不過，你對我們的蔡文文有什麼想法？🤓",
  "你說的我聽不懂，不過想問你有聽過我們的珠珠表姊嗎？😚",
  "糟糕，看不懂你在寫什麼。問一下你今天上班心情如何呀？😘",
  "每日一功德語：\n如果要配合把薪資提高到三萬元，我希望基本工資能凍漲五年 \n by 林伯伯 💩",
  "每日一功德語：\n台灣勞工哪有過勞死？ 有也是本來就有病 \n by 資資代表 💩",
  "每日一功德語：\n一個便當吃不飽，可以吃兩個啊！一份工作賺不夠，可以做兩份呀！💩",
  "你這句話我看不懂>< 不過你可以多嘗試左下角功能表的功能唷 😎",
  "糟糕，我有點看不太懂。\n但沒關係，我來自我介紹好了：我們是 GoodJob 團隊，是致力於幫助勞工的團隊唷唷！我們在找有經驗社群行銷夥伴！\n有興趣的話，快用粉專聯絡我們：https://www.facebook.com/goodjob.life/ 😎",
  "哎呀，沒懂你在說什麼。\n不過，跟你打個廣告：\n歡迎你來我們的網站，留下你的薪資工時資訊：\n\nhttps://www.goodjob.life/share/time-and-salary 😍",
  "><，其實我沒有那麼智慧，知道怎麼跟你聊天。\n不過，如果你願意的話，請給予我們回饋和建議，讓我們做得更好！ 回饋表單：https://goo.gl/forms/hhS8mh7xU9LJcvzH2",
];

const PROMO_IMG_URLS = {
  2018: {
    1: {
      18: "https://image.goodjob.life/check-in/bot/2018-01-18.png",
      19: "https://image.goodjob.life/check-in/bot/2018-01-19.png",
      20: "https://image.goodjob.life/check-in/bot/2018-01-20.png",
      21: "https://image.goodjob.life/check-in/bot/2018-01-21.png",
      22: "https://image.goodjob.life/check-in/bot/2018-01-22.png",
      23: "https://image.goodjob.life/check-in/bot/2018-01-23.png",
      24: "https://image.goodjob.life/check-in/bot/2018-01-24.png",
      25: "https://image.goodjob.life/check-in/bot/2018-01-25.png",
      26: "https://image.goodjob.life/check-in/bot/2018-01-26.png",
    },
  },
};

//[Sunday, Monday, Tuesday ... Saturaday]
const REMINDER_DAYS_MAPPING = {
  週一到週五: [false, true, true, true, true, true, false],
  週一: [false, true, false, false, false, false, false],
  週二: [false, false, true, false, false, false, false],
  週三: [false, false, false, true, false, false, false],
  週四: [false, false, false, false, true, false, false],
  週五: [false, false, false, false, false, true, false],
  週六: [false, false, false, false, false, false, true],
  週日: [true, false, false, false, false, false, false],
};

// reminder's minimum interval: 10 mins
const MIN_TIME_INTERVAL = 10;

module.exports = {
  PAYLOADS,
  INIT_STATE,
  CHECK_IN_LENGTH,
  RANDOM_REPLIES,
  PROMO_IMG_URLS,
  REMINDER_DAYS_MAPPING,
  MIN_TIME_INTERVAL,
};
