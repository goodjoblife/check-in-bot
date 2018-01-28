const get = require("lodash/get");
const map = require("lodash/map");
const uniq = require("lodash/uniqBy");
const {
  PAYLOADS: P,
  RANDOM_REPLIES,
  PROMO_IMG_URLS,
  MIN_TIME_INTERVAL,
} = require("./constants");

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
 * Calculate how many unique days within an object list
 * @param {Array} checkIns
 * @return {Number} nUniqDays
 */
function calcCheckInDayCount(checkIns) {
  const timestamps = map(checkIns, "startTime");
  const days = map(timestamps, ts => {
    const date = new Date(ts);
    date.setUTCHours(18, 0, 0, 0);
    return date.getTime();
  });
  const uniqDays = uniq(days);
  const nUniqDays = uniqDays.length;
  return nUniqDays;
}

/**
 * Calculate the encouragement sentence based on
 * the current days the user uses this bot
 * @param {Number} currentDays
 * @return {String} encouragement
 */
function getEncouragement(currentDays) {
  if (currentDays < 3) {
    return "再努力幾天，試著打滿3天吧！";
  }
  if (currentDays < 5) {
    return "再努力幾天，往5天邁進！";
  }
  if (currentDays < 7) {
    return "再撐一下，至少完成一週！";
  }
  return "台灣的勞工真的 hen 棒～";
}

/**
 *
 * @param {*} n number to be padded
 * @param {*} width total width of final string
 * @param {*} z padding sign
 */
function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
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
        case P.GET_STARTED:
          qrs.push({
            content_type: "text",
            title: p.text || "開始使用",
            payload: P.GET_STARTED,
          });
          break;
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
            title: p.text || "查看我的打卡記錄",
            payload: P.VIEW_MY_WORKING_TIME,
          });
          break;
        case P.VIEW_MY_REMINDERS:
          qrs.push({
            content_type: "text",
            title: p.text || "管理我的打卡提醒",
            payload: P.VIEW_MY_REMINDERS,
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
            title: p.text || "查看多少人在上班",
            payload: P.VIEW_WORKING_USER_COUNT,
          });
          break;
        case P.SHOW_QUICK_REPLY_MENU:
          qrs.push({
            content_type: "text",
            title: p.text || "顯示功能表",
            payload: P.SHOW_QUICK_REPLY_MENU,
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
  return RANDOM_REPLIES[Math.floor(Math.random() * RANDOM_REPLIES.length)];
}

// 這個是暫時用宣傳用的，就先設定 2018-01-19 ~ 2018-01-31
function getTodayPromoteImage() {
  const now = convertTimeZone(new Date(), 8);
  const { year, month, day } = getYearMonthDay(now);
  return get(PROMO_IMG_URLS, `[${year}][${month + 1}][${day}]`);
}

function resetCheckInState(context) {
  context.setState({
    isWorking: false,
    startTime: null,
    endTime: null,
    location: null,
    locationTimestamp: null,
    imgUrls: [],
  });
}

/**
 * parse time string to { hour, min } object if possible
 * available format: "1:20" "01:20" "01:2" "01：20" " 01:20 "
 * @param {String} timeStr
 * @return {Object}
 */
function parseTime(timeStr) {
  const regex = /\s*(\d{1,2})[:|：](\d{1,2})\s*/;
  const m = timeStr.match(regex);
  if (m === null) {
    return null;
  }
  const hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (hour < 0 || hour >= 24 || min < 0 || min >= 60) {
    return null;
  }

  return { hour, min };
}

/**
 * get closest time interval by given time
 * e.g. interval = 10, time = { hour: 23, min: 54 } => { hour: 23, min: 50 }
 * @param {*} time
 * @param {*} interval
 */
function getClosestTime(time, interval) {
  if (!time) {
    return null;
  }
  let { hour, min } = time;

  // get closest interval
  min = Math.round(min / interval) * interval;
  if (min >= 60) {
    min = 0;
    hour = hour + 1 >= 24 ? 0 : hour + 1;
  }
  return { hour, min };
}

module.exports = {
  getLocation,
  getTimeStamp,
  getImageUrl,
  calcTime,
  calcCheckInDayCount,
  getEncouragement,
  pad,
  formatTime,
  convertTimeZone,
  getYearMonthDay,
  genRandomStr,
  genQuickReply,
  genRandomReply,
  getTodayPromoteImage,
  resetCheckInState,
  parseTime,
  getClosestTime,
};
