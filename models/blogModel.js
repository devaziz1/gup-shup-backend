const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  name: {
    type: String,
    required: true,
  },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const blogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: {
      type: String,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    commentCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    likes: { type: [String], default: [] },
    category: {
      type: String,
      enum: ["Technology", "Sports", "Business", "Health", "Entertainment"],
    },
    tags: { type: [String], default: [] },
    comments: [commentSchema],
    image: { type: String },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
