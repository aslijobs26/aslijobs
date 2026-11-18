import { Schema, model } from "mongoose";

const blogAssetSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    storagePath: { type: String, default: "" },
    storageProvider: { type: String, enum: ["local", "cloudinary"], default: "local" },
    publicId: { type: String, default: "" },
    purpose: {
      type: String,
      enum: ["cover", "inline", "author", "social"],
      required: true,
    },
    blogId: { type: Schema.Types.ObjectId, ref: "Blog", default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "OperationsTeamUser", default: null },
  },
  { timestamps: true },
);

export const BlogAssetModel = model("BlogAsset", blogAssetSchema);
