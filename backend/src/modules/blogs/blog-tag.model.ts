import { Schema, model } from "mongoose";

const blogTagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true },
);

export const BlogTagModel = model("BlogTag", blogTagSchema);
