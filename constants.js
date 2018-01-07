const PAYLOADS = {
  CHECK_IN: "CHECK_IN",
  CHECK_OUT: "CHECK_OUT",
  SEND_LOCATION: "SEND_LOCATION",
  GET_STARTED: "GET_STARTED",
  VIEW_WORKING_TIME: "VIEW_WORKING_TIME",
};

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
