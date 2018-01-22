const {
  calcTime,
  convertTimeZone,
  getYearMonthDay,
  genRandomStr,
} = require("./utils");
const { CHECK_IN_LENGTH } = require("./constants");

/**
 * Insert a check-in data into database, accumulate working time into database
 * @param {Object} checkIn
 * @param {String} checkIn.userId
 * @param {Date} checkIn.startTime
 * @param {Date} checkIn.endTime
 * @param {Object} checkIn.location
 * @param {Object} checkIn.location.lat
 * @param {Object} checkIn.location.long
 * @param {Date} checkIn.locationTimestamp
 * @param {Array} checkIn.imgUrls
 * @param {String} checkIn.imgUrls[i]
 */
async function insertCheckIn(db, checkIn) {
  // data validation
  // TODO: throw error
  if (!checkIn) {
    return;
  }
  if (!checkIn.userId || !checkIn.startTime || !checkIn.endTime) {
    return;
  }
  if (checkIn.location) {
    if (!checkIn.locationTimestamp) {
      return;
    }
    if (!checkIn.location.lat || !checkIn.location.long) {
      return;
    }
  }
  // insert to db
  await db.collection("checkIns").insert(checkIn);
  await accuWorkTime(db, checkIn);
}

async function getUserCheckIns(db, userId) {
  return await db
    .collection("checkIns")
    .find({ userId })
    .toArray();
}

/**
 * 累計打卡的時間總長度。
 * 1. 為簡化問題，時間會算到起始日上。
 *  e.g. 2018-01-13 23:00:00 ~ 2018-01-14 01:00:00 會算到 2017-01-23 上面，累積兩小時上去。
 * 2. 為避免伺服器時區問題，統一轉乘 UTC +8 時區後，再看年、月、日
 * @param {Object} checkIn
 * @param {Date} checkIn.startTime
 * @param {Date} checkIn.endTime
 */
async function accuWorkTime(db, checkIn) {
  if (checkIn.startTime && checkIn.endTime) {
    const period = checkIn.endTime.getTime() - checkIn.startTime.getTime();
    if (period >= CHECK_IN_LENGTH.MIN && period <= CHECK_IN_LENGTH.MAX) {
      const startTime = convertTimeZone(checkIn.startTime, 8);
      const { year, month, day } = getYearMonthDay(startTime);
      const { hrs, mins, secs } = calcTime(period);

      const totalWorkTimes = db.collection("totalWorkTimes");
      const time = await totalWorkTimes.findOne({ year, month, day });
      if (time) {
        await totalWorkTimes.updateOne(
          { year, month, day },
          {
            $set: {
              accuHrs: time.accuHrs + hrs,
              accuMins: time.accuMins + mins,
              accuSecs: time.accuSecs + secs,
            },
          }
        );
      } else {
        await totalWorkTimes.insertOne({
          year,
          month,
          day,
          accuHrs: hrs,
          accuMins: mins,
          accuSecs: secs,
        });
      }
    }
  }
  return;
}

/**
 * Find or create a url key for users to access their working time
 * This is a temporal solution for user login
 * @param {Object} db database connection object
 * @param {String} userId unique user id generated in session store
 */
async function findOrCreateUserUrlKey(db, userId) {
  const users = db.collection("users");
  const r1 = await users.findOne({ _id: userId });
  if (r1) {
    return r1.urlKey;
  } else {
    const randStr = genRandomStr(36);
    const result = await db.collection("users").insertOne({
      _id: userId,
      urlKey: randStr,
    });
    console.log("create a new user, result:", result);
    return randStr;
  }
}

/**
 * 計算上下班的人數。上班指的是 state.isWorking = true 的使用者數
 * 下班指的是，過去 24 小時有打過卡的人數。總數：上班＋下班。
 */
async function getWorkingUserCount(db) {
  const sessions = db.collection("sessions");
  const checkIns = db.collection("checkIns");
  const workingCount = await sessions.count({ "_state.isWorking": true });
  const oneDayBefore = new Date(new Date().getTime() - 86400000);
  // 當打卡數足夠多的時候，記得建 index
  const offWorkUsers = await checkIns.distinct("userId", {
    endTime: { $gt: oneDayBefore },
  });
  const offWorkCount = offWorkUsers.length;
  return { workingCount, offWorkCount };
}

async function insertTextAsCorpus(db, userId, incomingText, ourReply) {
  await db.collection("corpus").insertOne({
    userId,
    incomingText,
    ourReply,
    timeStamp: new Date(),
  });
}

module.exports = {
  insertCheckIn,
  getUserCheckIns,
  findOrCreateUserUrlKey,
  getWorkingUserCount,
  insertTextAsCorpus,
  accuWorkTime,
};
