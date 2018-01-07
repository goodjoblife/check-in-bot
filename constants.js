// The list of payloads
const PAYLOADS = {
  CHECK_IN: "CHECK_IN", // 上班
  CHECK_OUT: "CHECK_OUT", // 下班
  SEND_LOCATION: "SEND_LOCATION", // 傳送位置
  GET_STARTED: "GET_STARTED", // 開始使用
  VIEW_MY_WORKING_TIME: "VIEW_MY_WORKING_TIME", // 查看我的工時
  VIEW_TOTAL_WORKING_TIME: "VIEW_TOTAL_WORKING_TIME", // 查看全台總工時
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

module.exports = {
  PAYLOADS,
  INIT_STATE,
};
