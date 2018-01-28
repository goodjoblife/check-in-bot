const { MessengerHandler } = require("bottender");
const { haveSeenTutorial, isPostbackPayloadGetStarted } = require("./helpers");
const { genQuickReply } = require("../../utils");
const P = require("../../constants").PAYLOADS;

const childHandler = db =>
  new MessengerHandler()
    .onPayload(P.GET_STARTED, async context => {
      await context.sendText(
        "嗨嗨你好，我是功德無量打卡機本人，請叫我阿德就好。",
        genQuickReply([{ text: "你是誰? 你可以幹嘛?" }])
      );
    })
    .onPostback(isPostbackPayloadGetStarted, async context => {
      await context.sendText(
        "嗨嗨你好，我是功德無量打卡機本人，請叫我阿德就好。",
        genQuickReply([{ text: "你是誰? 你可以幹嘛?" }])
      );
    })
    .onText("你是誰? 你可以幹嘛?", async context => {
      await context.sendText(
        "我是一個打卡機，我可以幫你：\n\n- 紀錄工時\n- 計算應該拿到的加班費\n\n還有... 製造滿滿的功德",
        genQuickReply([{ text: "要怎麼使用？" }])
      );
    })
    .onText("要怎麼使用？", async context => {
      await context.sendText(
        "很簡單，按下「上班，做功德」，就會開始記錄你的工時，你的功德就會源源不絕地產生囉^^",
        genQuickReply([{ text: "那要怎麼下班？" }])
      );
    })
    .onText("那要怎麼下班？", async context => {
      await context.sendText(
        "按下「下班，不做了」，就會結束記錄你的工時囉！",
        genQuickReply([{ text: "就這樣？還有其他功能嗎？" }])
      );
    })
    .onText("就這樣？還有其他功能嗎？", async context => {
      context.setState({ seenTutorial: true });
      await context.sendText(
        "當然有，你還可以：\n\n - 查看你的每一筆工時，而且加班費都幫你算好了喔\n\n - 查看今天台灣人已經累積多少功德\n\n - 上下班即時動態，看現在還有多少人在做功德 \n\n (教學完畢)",
        genQuickReply([{ text: "好，我懂了，開始使用！" }])
      );
    })
    .build();

const tutorialHandler = db => {
  const handler = childHandler(db);
  return async (context, next) => {
    if (haveSeenTutorial(context)) {
      return childHandler(db)(context);
    }

    await next();
  };
};

module.exports = {
  tutorialHandler,
};
