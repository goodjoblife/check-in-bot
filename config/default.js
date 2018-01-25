module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost/checkin",
  CORS_ANY: process.env.CORS_ANY || "FALSE",
  ACCESS_TOKEN: process.env.accessToken,
  VERIFY_TOKEN: process.env.verifyToken,
  APP_ID: process.env.appId,
  APP_SECRET: process.env.appSecret,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  CHATBASE_API_KEY: process.env.CHATBASE_API_KEY,
  REMINDER_MAX_SENDING_NUM: process.env.REMINDER_MAX_SENDING_NUM || 10,
};
