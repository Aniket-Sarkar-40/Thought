import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  id: { type: "string", required: true },
  username: { type: "string", required: true, unique: true },
  name: { type: "string", required: true },
  bio: { type: "string" },
  image: { type: "string" },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  thought: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thought",
    },
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Community =
  mongoose.models.Community || mongoose.model("Community", communitySchema);

export default Community;
