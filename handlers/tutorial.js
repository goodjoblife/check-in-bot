const { MessengerHandler } = require("bottender");
const P = require("../constants").PAYLOADS;
const { genQuickReply } = require("../utils");

/** 這個 handler 要解決兩個問題：
 * 1. 部分的裝置在第一次使用的時候，不會出現「開始使用」的按鈕。為了避免它沒有經過教學流程，這邊等於是強制他走完教學流程。
 * 2. 部分使用者已經使用過舊版的 handler ，不會再按「開始使用」一次，這邊也是把它攔截下來，讓他跑教學流程。
 */
const tutorialHandler = new MessengerHandler();

tutorialHandler.onText("你是誰? 你可以幹嘛?", async context => {
  await context.sendText(
    "我是一個打卡機，我可以幫你：\n\n- 紀錄工時\n- 計算應該拿到的加班費\n\n還有... 製造滿滿的功德",
    genQuickReply([{ text: "要怎麼使用？" }])
  );
});

tutorialHandler.onText("要怎麼使用？", async context => {
  await context.sendText(
    "很簡單，按下「上班，做功德」，就會開始記錄你的工時，你的功德就會源源不絕地產生囉^^",
    genQuickReply([{ text: "那要怎麼下班？" }])
  );
});

tutorialHandler.onText("那要怎麼下班？", async context => {
  await context.sendText(
    "按下「下班，不做了」，就會結束記錄你的工時囉！",
    genQuickReply([{ text: "就這樣？還有其他功能嗎？" }])
  );
});

tutorialHandler.onText("就這樣？還有其他功能嗎？", async context => {
  await context.sendText(
    "當然有，你還可以：\n\n - 查看你的每一筆工時，而且加班費都幫你算好了喔\n - 查看今天台灣人已經累積多少功德\n - 上下班即時動態，看現在還有多少人在做功德",
    genQuickReply([{ text: "好，我懂了，開始使用！" }])
  );
});

tutorialHandler.onText("好，我懂了，開始使用！", async context => {
  context.setState({ seenTutorial: true });
  await context.sendText(
    "太好了！ 馬上來做功德吧！",
    genQuickReply([{ type: P.CHECK_IN }])
  );
});

tutorialHandler.onEvent(async context => {
  context.setState({ seenTutorial: false });
  await context.sendText(
    "嗨嗨你好，我是功德無量打卡機本人，請叫我阿德就好。",
    genQuickReply([{ text: "你是誰? 你可以幹嘛?" }])
  );
});

module.exports = {
  tutorialHandler,
};
