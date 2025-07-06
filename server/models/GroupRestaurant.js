import mongoose from 'mongoose';

const groupRestaurantSchema = new mongoose.Schema(
    {
        groupId: { type: String, required: true, index: true },
        office: { type: String, required: true, index: true },
        restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        isActiveInOffice: { type: Boolean, default: true },
        note: { type: String, default: '' },
    },
    {
        timestamps: true,
    }
);
groupRestaurantSchema.index({ groupId: 1, office: 1, restaurantId: 1 }, { unique: true });
groupRestaurantSchema.index({ groupId: 1, office: 1, isActiveInOffice: 1 });
export default mongoose.model('GroupRestaurant', groupRestaurantSchema);
