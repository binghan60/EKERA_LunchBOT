const express = require('express');
const router = express.Router();
const GroupSetting = require('../models/GroupSetting');

router.get('/', (req, res) => {
    res.send('Hello from group setting router!');
});

router.get('/:id', async (req, res) => {
    const groupId = req.params.id;
    console.log('Group ID:', groupId);
    const groupSetting = await GroupSetting.findOne({ groupId });
    console.log(groupSetting);
    if (!groupSetting) {
        return res.status(404).send('Group setting not found');
    }
    res.status(200).json(groupSetting);
});
module.exports = router;
