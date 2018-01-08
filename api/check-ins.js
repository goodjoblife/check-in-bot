const express = require("express");
const router = express.Router();

const wrap = fn => (req, res, next) => fn(req, res).catch(err => next(err));

router.get(
  "/working",
  wrap(async (req, res) => {
    const db = req.db.collection("sessions");
    const result = await db.find({ "_state.isWorking": true }).toArray();
    res.send(result);
  })
);

router.get(
  "/",
  wrap(async (req, res) => {
    const db = req.db.collection("checkIns");
    const result = await db.find().toArray();
    res.send(result);
  })
);

module.exports = router;
