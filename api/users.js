const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const wrap = fn => (req, res, next) => fn(req, res).catch(err => next(err));

router.get(
  "/:key/check-ins",
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

router.delete(
  "/:key/check-ins/:checkin",
  wrap(async (req, res) => {
    const users = req.db.collection("users");
    const checkIns = req.db.collection("checkIns");
    const urlKey = req.params.key;
    const checkInId = req.params.checkin;
    const user = await users.findOne({ urlKey });
    const checkIn = await checkIns.findOne({ _id: new ObjectId(checkInId) });

    if (user && user._id && checkIn && checkIn.userId) {
      if (user._id.toString() === checkIn.userId.toString()) {
        const result = await checkIns.deleteOne({
          _id: new ObjectId(checkInId),
        });
        if (result.result.ok === 1) {
          res.send({ success: true });
          return;
        }
      }
    }
    res.send({ success: false });
  })
);

module.exports = router;
