const express = require("express");
const router = express.Router();

router.get("/working", async (req, res) => {
  const db = req.db.collection("sessions");
  const result = await db.find({ "_state.isWorking": true }).toArray();
  res.send(result);
});

router.get("/:key", async (req, res) => {
  const users = req.db.collection("users");
  const urlKey = req.params.key;
  const user = await users.findOne({ urlKey });
  if (user) {
    const checkIns = req.db.collection("checkIns");
    const result = await checkIns.find({ userId: user._id }).toArray();
    res.send(result);
  } else {
    res.send([]);
  }
});

router.get("/", async (req, res) => {
  const db = req.db.collection("checkIns");
  const result = await db.find().toArray();
  res.send(result);
});

module.exports = router;
