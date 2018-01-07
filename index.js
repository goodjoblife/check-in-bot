const { MessengerBot, MongoSessionStore } = require("bottender");
const { createServer } = require("bottender/express");
const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");
const expressMongoDb = require("express-mongo-db");

// read configs
const config = require("config");
const PORT = parseInt(process.env.PORT) || 5000;

// import backend api routes
const routes = require("./api");

// import event handler for bot server
const eventHandler = require("./handlers");

// import some constants
const { INIT_STATE } = require("./constants");

async function main() {
  // connect to database
  const db = await MongoClient.connect(config.MONGODB_URI);

  /* Setup bot servr */
  const bot = new MessengerBot({
    accessToken: config.ACCESS_TOKEN,
    appSecret: config.APP_SECRET,
    sessionStore: new MongoSessionStore(config.MONGODB_URI),
  });
  bot.setInitialState(INIT_STATE);
  // set event handler
  bot.onEvent(eventHandler(db));
  const server = createServer(bot, {
    verifyToken: config.VERIFY_TOKEN,
  });

  /* Setup api server */
  // set CORS
  if (config.CORS_ANY !== "FALSE" && config.CORS_ANY !== false) {
    server.use(cors());
  } else {
    server.use(
      cors({
        origin: [/\.goodjob\.life$/, /goodjoblife.github.io$/, /localhost/],
      })
    );
  }
  // setup api routes
  server.use(expressMongoDb(config.MONGODB_URI));
  server.use("/api", routes);

  // start server
  server.listen(PORT, () => {
    console.log(`server is running on ${PORT} port...`);
  });
}

main();
