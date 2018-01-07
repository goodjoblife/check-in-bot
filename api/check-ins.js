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
  "/:key",
  wrap(async (req, res) => {
    const users = req.db.collection("users");
    const urlKey = req.params.key;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // TODO: validation

    const user = await users.findOne({ urlKey });
    if (user) {
      const checkIns = req.db.collection("checkIns");
      const query = { userId: user._id };
      if (startDate && endDate) {
        Object.assign(query, {
          startTime: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        });
      }
      const result = await checkIns.find(query).toArray();
      res.send(result);
    } else {
      res.send([]);
    }
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
