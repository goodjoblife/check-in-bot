// The list of payloads
const PAYLOADS = {
  CHECK_IN: "CHECK_IN", // 上班
  CHECK_OUT: "CHECK_OUT", // 下班
  SEND_LOCATION: "SEND_LOCATION", // 傳送位置
  GET_STARTED: "GET_STARTED", // 開始使用
  VIEW_MY_WORKING_TIME: "VIEW_MY_WORKING_TIME", // 查看我的工時
  VIEW_TOTAL_WORKING_TIME: "VIEW_TOTAL_WORKING_TIME", // 查看全台總工時
  VIEW_WORKING_USER_COUNT: "VIEW_WORKING_USER_COUNT", // 查看還在工作的人數
};

// initial state for bot
const INIT_STATE = {
  isWorking: false,
  startTime: null,
  endTime: null,
  location: null,
  locationTimestamp: null,
  imgUrls: [],
};

// minimum and maximum length of check-in length to be accumulated
const CHECK_IN_LENGTH = {
  MIN: 0, // 300000, // 5 mins = 300,000 miliseconds
  MAX: 86400000, // 24 hours = 86400000 miliseconds
};

module.exports = {
  PAYLOADS,
  INIT_STATE,
  CHECK_IN_LENGTH,
};
