const express = require("express");

const router = express.Router();

router.use("/check-ins", require("./check-ins"));

module.exports = router;
