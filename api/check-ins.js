const express = require("express");
const router = express.Router();

router.get("/working", async (req, res) => {
  const db = req.db.collection("sessions");
  const result = await db.find({ "_state.isWorking": true }).toArray();
  res.send(result);
});

router.get("/:id", async (req, res) => {
  const db = req.db.collection("checkIns");
  const userId = req.params.id;
  const result = await db.find({ userId }).toArray();
  res.send(result);
});

router.get("/", async (req, res) => {
  const db = req.db.collection("checkIns");
  const result = await db.find().toArray();
  res.send(result);
});

module.exports = router;
