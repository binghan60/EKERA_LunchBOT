const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello from restaurant router!');
});

router.post('/add', async (req, res) => {
    res.send('Add restaurant endpoint');
});

module.exports = router;
