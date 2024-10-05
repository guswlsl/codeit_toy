const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  nickname: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  postPassword: { type: String, required: true },
  groupPassword: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  tags: [String],
  location: { type: String, default: '' },
  moment: { type: Date, default: Date.now },
  isPublic: { type: Boolean, default: true },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
