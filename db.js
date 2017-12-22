
/**
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
    console.log('checkin:', checkIn);
    if (!checkIn) { return; }
    if (!checkIn.userId || !checkIn.startTime || !checkIn.endTime) { return; }
    if (checkIn.location) {
        if (!checkIn.locationTimestamp) { return; }
        if (!checkIn.location.lat || checkIn.location.long) { return; }
    }
    // insert to db
    const result = await db.collection('checkIns').insert(checkIn);
    console.log('insertCheckIn result:', result);
}

module.exports = {
    insertCheckIn,
}