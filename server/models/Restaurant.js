import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    name: { type: String, required: true },
    menu: { type: [String], default: [] },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    tags: [{ type: String, default: [] }],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model('Restaurant', restaurantSchema);
