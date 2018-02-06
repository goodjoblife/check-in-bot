/**
 * The script to send reminding text to users
 */
const { MessengerClient } = require("messaging-api-messenger");
const MongoClient = require("mongodb").MongoClient;
const config = require("config");
const map = require("lodash").map;
const difference = require("lodash").difference;

const { convertTimeZone, getClosestTime, genQuickReply } = require("../utils");
const { MIN_TIME_INTERVAL, PAYLOADS: P } = require("../constants");
const REMINDER_MAX_SENDING_NUM = config.REMINDER_MAX_SENDING_NUM || 10;

async function getReminders(db) {
  const now = new Date();
  // convert to UTC+8 time zone
  const timeAtUTC8 = convertTimeZone(now, 8);
  const time = getClosestTime(
    {
      hour: timeAtUTC8.getHours(),
      min: timeAtUTC8.getMinutes(),
    },
    MIN_TIME_INTERVAL
  );
  const day = timeAtUTC8.getDay();
  return await db
    .collection("weeklyReminders")
    .find({
      [`days.${day}`]: true,
      hour: time.hour,
      min: time.min,
    })
    .toArray();
}

// currently only support messenger platform
async function sendRemindText(client, reminder, workingStatusOfOthers) {
  const { platformId, text } = reminder;
  if (!platformId || !text) {
    return false;
  } else {
    const id = platformId.split(":")[1];
    try {
      await client.sendText(id, workingStatusOfOthers.message);
      await client.sendText(
        id,
        `打卡提醒： ${text}`,
        genQuickReply([
          { text: "上班", type: P.CHECK_IN },
          { text: "下班", type: P.CHECK_OUT },
        ])
      );
      return true;
    } catch (err) {
      console.error("Send reminder failed:", err);
      return false;
    }
  }
}

async function getWorkingUserIds(db, fromTime, toTime) {
  const sessions = await db
    .collection("sessions")
    .find({
      "_state.startTime": {
        $gt: fromTime,
        $lt: toTime,
      },
    })
    .toArray();
  const userIds = map(sessions, "_id");
  return userIds;
}

async function getOffDutyUserIds(db, fromTime, toTime) {
  const checkIns = await db
    .collection("checkIns")
    .find({
      startTime: {
        $gt: fromTime,
        $lt: toTime,
      },
    })
    .toArray();
  const userIds = map(checkIns, "userId");
  return userIds;
}

async function getWorkingStatusOfOthers(db) {
  const now = Date.now();
  const fromTime = new Date(now - 1000 * 60 * 60 * 10); // 10 hours ago
  const toTime = new Date(now - 1000 * 60 * 60 * 8); // 8 hours ago

  let workingUserIds = await getWorkingUserIds(db, fromTime, toTime);
  let offDutyUserIds = await getOffDutyUserIds(db, fromTime, toTime);

  // For users in both working and off-duty lists
  // assume them still in working status
  // (i.e. remove them from off-duty list)
  offDutyUserIds = difference(offDutyUserIds, workingUserIds);

  const nWorkingUsers = workingUserIds.length;
  const nOffDutyUsers = offDutyUserIds.length;
  const nUsers = nWorkingUsers + nOffDutyUsers;

  const dayOffRatio = nOffDutyUsers / nUsers * 100;

  const message = `目前8小時前上班的 ${nUsers} 位使用者中，已經有 ${nOffDutyUsers}人 (${dayOffRatio.toFixed(
    0
  )}%) 下班啦！`;

  return {
    nWorkingUsers,
    nOffDutyUsers,
    nUsers,
    message,
  };
}

async function main() {
  console.log("=== Start ===");
  // connect to database
  const db = await MongoClient.connect(config.MONGODB_URI);

  // setup client
  const client = MessengerClient.connect(config.ACCESS_TOKEN);

  // get all reminders to be sent
  const reminders = await getReminders(db);
  console.log(reminders.length);

  // get working status for broadcasing
  const workingStatusOfOthers = await getWorkingStatusOfOthers(db);

  // send reminders one by one
  let promiseQueue = [];
  for (let [index, reminder] of reminders.entries()) {
    if (promiseQueue.length < REMINDER_MAX_SENDING_NUM) {
      promiseQueue.push(
        sendRemindText(client, reminder, workingStatusOfOthers)
      );
    } else {
      const modIndex = index % REMINDER_MAX_SENDING_NUM;
      promiseQueue[modIndex] = promiseQueue[modIndex].then(() =>
        sendRemindText(client, reminder, workingStatusOfOthers)
      );
    }
  }
  await Promise.all(promiseQueue);
  await db.close();
  console.log("=== Done ===");
}

main().catch(err => console.log(err));
