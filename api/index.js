const express = require("express");

const router = express.Router();

router.use("/check-ins", require("./check-ins"));
router.use("/users", require("./users"));

module.exports = router;
