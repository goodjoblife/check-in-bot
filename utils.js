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
    switch (p) {
      case P.CHECK_IN:
        qrs.push({
          content_type: "text",
          title: "做功德",
          payload: P.CHECK_IN,
        });
        break;
      case P.CHECK_OUT:
        qrs.push({
          content_type: "text",
          title: "不做了",
          payload: P.CHECK_OUT,
        });
        break;
      case P.SEND_LOCATION:
        qrs.push({
          content_type: "location",
          title: "傳送位置",
          payload: P.SEND_LOCATION,
        });
        break;
      case P.VIEW_MY_WORKING_TIME:
        qrs.push({
          content_type: "text",
          title: "查看我的功德",
          payload: P.VIEW_MY_WORKING_TIME,
        });
      case P.VIEW_TOTAL_WORKING_TIME:
        qrs.push({
          content_type: "text",
          title: "查看全台灣功德量",
          payload: P.VIEW_TOTAL_WORKING_TIME,
        });
      default:
        break;
    }
  });
  return { quick_replies: qrs };
}

module.exports = {
  getLocation,
  getTimeStamp,
  getImageUrl,
  calcTime,
  formatTime,
  genRandomStr,
  genQuickReply,
};
