const createLoggingHandler = db => {
  return async (context, next) => {
    const collection = db.collection("eventLogs");

    const log = {
      userId: context.session._id, // may be undefined
      text: context.event.isText ? context.event.text : null,
      payload: context.event.isPayload ? context.event.payload : null,
      postback: context.event.isPostback ? context.event.postback : null,
      createdAt: new Date(),
    };

    collection.insertOne(log); // don't wait

    await next();
  };
};

module.exports = {
  createLoggingHandler,
};
