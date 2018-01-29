/**
 * The script to send reminding text to users
 */
const { MessengerClient } = require("messaging-api-messenger");
const MongoClient = require("mongodb").MongoClient;
const config = require("config");

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
async function sendRemindText(client, reminder) {
  const { platformId, text } = reminder;
  if (!platformId || !text) {
    return false;
  } else {
    const id = platformId.split(":")[1];
    try {
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

async function main() {
  console.log("=== Start ===");
  // connect to database
  const db = await MongoClient.connect(config.MONGODB_URI);

  // setup client
  const client = MessengerClient.connect(config.ACCESS_TOKEN);

  // get all reminders to be sent
  const reminders = await getReminders(db);
  console.log(reminders.length);

  // send reminders one by one
  let promiseQueue = [];
  for (let [index, reminder] of reminders.entries()) {
    if (promiseQueue.length < REMINDER_MAX_SENDING_NUM) {
      promiseQueue.push(sendRemindText(client, reminder));
    } else {
      promiseQueue[index % REMINDER_MAX_SENDING_NUM].then(() =>
        sendRemindText(client, reminder)
      );
    }
  }
  await Promise.all(promiseQueue);
  await db.close();
  console.log("=== Done ===");
}

main().catch(err => console.log(err));
