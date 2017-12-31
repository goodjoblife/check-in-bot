const config = require("config");

module.exports = {
  messenger: {
    accessToken: config.ACCESS_TOKEN,
    verifyToken: config.VERIFY_TOKEN,
    appId: config.APP_ID,
    appSecret: config.APP_SECRET,
  },
};
