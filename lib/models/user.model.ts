import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  id: { type: "string", required: true },
  username: { type: "string", required: true, unique: true },
  name: { type: "string", required: true },
  bio: { type: "string" },
  image: { type: "string" },
  thought: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thought",
    },
  ],
  onboarded: {
    type: Boolean,
    default: false,
  },
  communities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
  ],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
