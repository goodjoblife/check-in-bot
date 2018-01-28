const R = require("ramda");
const { path, equals, compose } = R;

const haveSeenTutorial = compose(
  equals(false),
  path(["state", "seenTutorial"])
);

module.exports = {
  haveSeenTutorial,
};
