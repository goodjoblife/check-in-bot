const { genRandomStr } = require("./utils");

/**
 * Insert a check-in data into database
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
  const result = await db.collection("checkIns").insert(checkIn);
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

module.exports = {
  insertCheckIn,
  findOrCreateUserUrlKey,
};
