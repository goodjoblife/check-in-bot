const express = require("express");
const router = express.Router();

const wrap = fn => (req, res, next) => fn(req, res).catch(err => next(err));

/**
 * @api {get} GET /api/check-ins/working 取得現在正在上班狀態中的打卡資料
 * @apiGroup Check_Ins
 * @apiSuccess {Object[]} 一個 check-in 資料陣列，但每筆 check-in 資料只有 startTime 這個欄位
 * @apiSuccess {Date} startTime 該筆 check-in 的起始時間
 */
router.get(
  "/working",
  wrap(async (req, res) => {
    const db = req.db.collection("sessions");
    const states = await db.find({ "_state.isWorking": true }).toArray();
    const results = [];
    states.forEach(state => {
      if (state._state && state._state.startTime) {
        results.push({ startTime: state._state.startTime });
      }
    });
    res.send(results);
  })
);

/**
 * @api {get} GET /api/check-ins/total-work-time 取得該日期「已經完成打卡」的時間總長度
 * @apiGroup Check_Ins
 * @apiParam {Number} year 欲查詢的年 (UTC+8 時顯示的年)
 * @apiParam {Number} month 欲查詢的月 (UTC+8 時顯示的月)，從 0 開始，一月是 0
 * @apiParam {Number} day 欲查詢的日 (UTC+8 時顯示的日)
 * @apiSuccess {Number} accuHrs 該天已經完成打卡的總小時數
 * @apiSuccess {Number} accuMins 該天已經完成打卡的分鐘數
 * @apiSuccess {Number} accuSecs 該天已經完成打卡的秒數
 */
router.get(
  "/total-work-time",
  wrap(async (req, res) => {
    const totalWorkTimes = req.db.collection("totalWorkTimes");
    const { year, month, day } = req.query;
    const result = await totalWorkTimes.findOne({
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
    });
    if (result) {
      res.send(result);
    } else {
      res.send({});
    }
  })
);

module.exports = router;
