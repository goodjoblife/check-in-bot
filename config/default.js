module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost/checkin",
  CORS_ANY: process.env.CORS_ANY || "FALSE",
  ACCESS_TOKEN: process.env.accessToken,
  VERIFY_TOKEN: process.env.verifyToken,
  APP_ID: process.env.appId,
  APP_SECRET: process.env.appSecret,
};
