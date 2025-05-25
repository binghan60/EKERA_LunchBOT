const express = require('express');
const router = express.Router();
const GroupRestaurant = require('../models/GroupRestaurant');
const GroupSetting = require('../models/GroupSetting');

router.get('/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const results = await GroupRestaurant.find({ groupId }).populate('restaurantId').select('restaurantId office isActiveInOffice note');
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching group restaurants', error });
    }
});

router.post('/', async (req, res) => {
    try {
        const { groupId, office, restaurantId, isActiveInOffice = true, note } = req.body;

        if (!groupId || !office || !restaurantId) {
            return res.status(400).json({ error: 'groupId, office and restaurantId are required.' });
        }

        const existing = await GroupRestaurant.findOne({ groupId, office, restaurantId });
        if (existing) {
            return res.status(400).json({ error: 'This restaurant is already assigned to the office in this group.' });
        }

        const newGR = new GroupRestaurant({ groupId, office, restaurantId, isActiveInOffice, note });
        await newGR.save();
        res.status(201).json(newGR);
    } catch (error) {
        res.status(500).json({ message: 'Error creating group restaurant', error });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updateFields = {};
        const { office, isActiveInOffice, note } = req.body;

        if (office !== undefined) updateFields.office = office;
        if (isActiveInOffice !== undefined) updateFields.isActiveInOffice = isActiveInOffice;
        if (note !== undefined) updateFields.note = note;
        const groupRestaurant = await GroupRestaurant.findById(req.params.id);
        const groupSetting = await GroupSetting.findOne({ groupId: groupRestaurant.groupId });
        if (!groupSetting.officeOption.includes(office)) {
            res.status(400).json({ message: `${office}不在群組辦公室列表` });
        }
        console.log(groupSetting);
        const updated = await GroupRestaurant.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });

        if (!updated) {
            return res.status(404).json({ error: 'Group restaurant not found' });
        }

        res.status(200).json(updated);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating group restaurant', error });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deleted = await GroupRestaurant.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Group restaurant not found' });
        }
        res.status(200).json({ message: 'Group restaurant deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting group restaurant', error });
    }
});

module.exports = router;
