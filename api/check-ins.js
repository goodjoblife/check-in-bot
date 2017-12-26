
const express = require("express");
const router = express.Router();

router.get('/:id', async(req, res) => {
    const db = req.db.collection('checkIns');
    const userId = req.params.id;
    const result = await db.find({ userId }).toArray();
    res.send(result);
})

module.exports = router;