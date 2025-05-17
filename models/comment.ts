import mongoose from "mongoose"

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, "Comment content is required"],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema)
