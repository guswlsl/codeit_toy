const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  imageUrl: { type: String },
  isPublic: { type: Boolean, default: true },
  introduction: { type: String },
  likeCount: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  postCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
