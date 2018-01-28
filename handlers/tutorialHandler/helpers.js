const R = require("ramda");
const { path, equals, compose } = R;
const P = require("../../constants").PAYLOADS;
const { genQuickReply, getPostbackPayload } = require("../../utils");

const haveSeenTutorial = compose(
  equals(false),
  path(["state", "seenTutorial"])
);

const isPostbackPayloadGetStarted = compose(
  equals(P.GET_STARTED),
  getPostbackPayload
);

module.exports = {
  haveSeenTutorial,
  isPostbackPayloadGetStarted,
};
