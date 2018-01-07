const config = require("config");

module.exports = {
  messenger: {
    accessToken: config.ACCESS_TOKEN,
    verifyToken: config.VERIFY_TOKEN,
    appId: config.APP_ID,
    appSecret: config.APP_SECRET,
    profile: {
      get_started: {
        payload: "GET_STARTED",
      },
      persistent_menu: [
        {
          locale: "default",
          composer_input_disabled: false,
          call_to_actions: [
            {
              type: "postback",
              title: "開始使用",
              payload: "GET_STARTED",
            },
            {
              type: "nested",
              title: "功德無量打卡機功能表",
              call_to_actions: [
                {
                  title: "開始上班，做功德",
                  type: "postback",
                  payload: "CHECK_IN",
                },
                {
                  title: "下班了，不做了",
                  type: "postback",
                  payload: "CHECK_OUT",
                },
                {
                  title: "查看我的功德",
                  type: "postback",
                  payload: "VIEW_MY_WORKING_TIME",
                },
                {
                  title: "查看全台灣功德量",
                  type: "web_url",
                  url: "https://goodjoblife.github.io/check-in-frontend/#/",
                  webview_height_ratio: "full",
                },
              ],
            },
            {
              type: "nested",
              title: "GoodJob 好工作評論網",
              call_to_actions: [
                {
                  type: "web_url",
                  title: "勞動法令權益懶人包",
                  url: "https://www.goodjob.life/labor-rights",
                  webview_height_ratio: "full",
                },
                {
                  type: "web_url",
                  title: "分享我的工時、薪資資訊",
                  url: "https://www.goodjob.life/share/time-and-salary",
                  webview_height_ratio: "full",
                },
                {
                  type: "web_url",
                  title: "分享我的面試經驗",
                  url: "https://www.goodjob.life/share/interview",
                  webview_height_ratio: "full",
                },
                {
                  type: "web_url",
                  title: "分享我的工作經驗",
                  url: "https://www.goodjob.life/share/work-experiences",
                  webview_height_ratio: "full",
                },
              ],
            },
          ],
        },
      ],
    },
  },
};
