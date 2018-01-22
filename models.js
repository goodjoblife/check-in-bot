/**
 * View model of checkIn data
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
function prepareCheckIn(userId, state) {
  return {
    userId,
    startTime: state.startTime,
    endTime: state.endTime,
    location: state.location,
    locationTimestamp: state.locationTimestamp,
    imgUrls: state.imgUrls,
  };
}

module.exports = {
  prepareCheckIn,
};
