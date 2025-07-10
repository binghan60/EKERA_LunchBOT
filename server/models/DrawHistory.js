import mongoose from 'mongoose';

const drawHistorySchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  groupId: {
    type: String,
    required: true,
  },
  drawnAt: {
    type: Date,
    default: Date.now,
  },
});

const DrawHistory = mongoose.model('DrawHistory', drawHistorySchema);

export default DrawHistory;
