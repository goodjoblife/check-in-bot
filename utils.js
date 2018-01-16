const get = require("lodash/get");
const P = require("./constants").PAYLOADS;

/**
 * get location {lat, long} from Context object
 * @param {Context} context
 * @return {Object} coordinates
 * @return {Number} coordinates.lat
 * @return {Number} coordinates.long
 */
function getLocation(context) {
  const attachments = get(context, "event.attachments");
  if (attachments) {
    for (let i = 0; i < attachments.length; i = i + 1) {
      const type = get(attachments, `[${i}].type`);
      if (type === "location") {
        const coordinates = get(attachments, `[${i}].payload.coordinates`);
        if (coordinates) {
          return coordinates;
        }
      }
    }
  }
  return null;
}

/**
 * get timestamp from Context object
 * @param {Context} context
 * @return {Number} timestamp - miniseconds
 */
function getTimeStamp(context) {
  return get(context, "event._rawEvent.timestamp");
}

/**
 * Get url of first image in attachments from Context object
 * @param {Context} context
 * @return {String} url
 */
function getImageUrl(context) {
  const attachments = get(context, "event.attachments");
  if (attachments) {
    for (let i = 0; i < attachments.length; i = i + 1) {
      const type = get(attachments, `[${i}].type`);
      if (type === "image") {
        const url = get(attachments, `[${i}].payload.url`);
        if (url) {
          return url;
        }
      }
    }
  }
  return null;
}

/**
 * Convert miniseconds to { hrs, mins, secs } format, hrs can be more than 24.
 * e.g. 3661000 ms -> { hrs: 1, mins: 1, secs: 1 }
 * @param {Number} ms
 * @return {Object} time
 * @return {Number} time.hrs
 * @return {Number} time.mins
 * @return {Number} time secs
 */
function calcTime(ms) {
  let secs = Math.round(ms / 1000);
  let mins = Math.floor(secs / 60);
  secs = secs % 60;
  let hrs = Math.floor(mins / 60);
  mins = mins % 60;
  return { hrs, mins, secs };
}

/**
 * Format { hrs, mins, secs } object into readable string
 * e.g. { hrs: 1, mins: 1, secs: 1} => 1小時 1分鐘
 * @param {Object} timeObj
 * @return {String} str
 */
function formatTime(timeObj) {
  let str = "";
  const { hrs, mins, secs } = timeObj;
  if (hrs === 0 && mins === 0) {
    return "不到一分鐘";
  }
  if (hrs > 0) {
    str = `${hrs}小時`;
  }
  if (mins > 0) {
    str = `${str} ${mins}分鐘`;
  }
  return str;
}

/**
 * function to calculate local time in given UTC offset
 * reference: https://stackoverflow.com/questions/10087819/convert-date-to-another-timezone-in-javascript
 */
function convertTimeZone(date, offset) {
  // convert to msec
  // add local time zone offset
  // get UTC time in msec
  var utc = date.getTime() + date.getTimezoneOffset() * 60000;

  // create new Date object for different city
  // using supplied offset
  var nd = new Date(utc + 3600000 * offset);

  return nd;
}

function getYearMonthDay(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

/**
 * Generate random string from English characters and numbers at given length
 * @param {Number} length
 * @return {String} randomStr
 */
function genRandomStr(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Generate quick reply payload
 * @param {*} payloads array of payload to be replied (e.g. CHECK_IN, CHECK_OUT)
 */
function genQuickReply(payloads) {
  const qrs = [];
  payloads.forEach(p => {
    if (p.type) {
      switch (p.type) {
        case P.CHECK_IN:
          qrs.push({
            content_type: "text",
            title: p.text || "開始上班做功德",
            payload: P.CHECK_IN,
          });
          break;
        case P.CHECK_OUT:
          qrs.push({
            content_type: "text",
            title: p.text || "下班了，不做了",
            payload: P.CHECK_OUT,
          });
          break;
        case P.SEND_LOCATION:
          qrs.push({
            content_type: "location",
            title: p.text || "傳送位置",
            payload: P.SEND_LOCATION,
          });
          break;
        case P.VIEW_MY_WORKING_TIME:
          qrs.push({
            content_type: "text",
            title: p.text || "查看我的功德",
            payload: P.VIEW_MY_WORKING_TIME,
          });
          break;
        case P.VIEW_TOTAL_WORKING_TIME:
          qrs.push({
            content_type: "text",
            title: p.text || "看看全台灣功德量",
            payload: P.VIEW_TOTAL_WORKING_TIME,
          });
          break;
        case P.VIEW_WORKING_USER_COUNT:
          qrs.push({
            content_type: "text",
            title: p.text || "現在多少人在做功德",
            payload: P.VIEW_WORKING_USER_COUNT,
          });
          break;
        default:
          break;
      }
    } else if (p.text) {
      qrs.push({
        content_type: "text",
        title: p.text,
        payload: "",
      });
    }
  });
  return { quick_replies: qrs };
}

function genRandomReply() {
  const replies = [
    "你真的以為我這麼聰明？會回覆你？",
    "我只是一個打卡機器人，沒有雲端大數據深度學習區塊鏈的技能啦",
    "阿密陀佛，功德主，你有什麼請教嗎？",
    "我只是不過是一介打卡機器人",
    "安安你好",
    "哈庫納馬踏踏",
    "拍拍澎呸，溫柔柔美",
    "何種命令？",
    "安安你好，你有聽過功德院嗎？",
    "你對我們的德德兄有什麼想法？",
    "你對我們的文文有什麼想法？",
    "你對我們的珠珠姊有什麼想法？",
    "每日一功德語：\n如果要配合把薪資提高到三萬元，我希望基本工資能凍漲五年 \n by 林伯伯",
    "每日一功德語：\n台灣勞工哪有過勞死？ 有也是本來就有病 \n by 資資代表",
    "每日一功德語：\n一個便當吃不飽，可以吃兩個啊！一份工作賺不夠，可以做兩份呀！",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function resetState(context) {
  const { seenTutorial } = context.state;
  context.resetState();
  context.setState({ seenTutorial });
}

module.exports = {
  getLocation,
  getTimeStamp,
  getImageUrl,
  calcTime,
  formatTime,
  convertTimeZone,
  getYearMonthDay,
  genRandomStr,
  genQuickReply,
  genRandomReply,
  resetState,
};
