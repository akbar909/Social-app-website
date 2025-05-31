import mongoose, { Schema, models } from "mongoose"

const storySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mediaUrl: { type: String }, // optional for text stories
  mediaType: { type: String, enum: ["text", "image", "video"], required: true },
  text: { type: String }, // for text stories
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 24*60*60*1000 },
  // Optionally: viewers, caption, etc.
})

export default models.Story || mongoose.model("Story", storySchema) 