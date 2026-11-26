import { model, Schema } from "mongoose";

const uploadedVideoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    storagePath: { type: String, default: "", trim: true },
    storageProvider: { type: String, enum: ["local", "cloudinary"], default: "local" },
    publicId: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "", trim: true },
    fileSize: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const videoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, default: "", maxlength: 400 },
    source: { type: String, enum: ["youtube", "uploaded"], required: true, index: true },
    youtubeUrl: { type: String, trim: true, default: "" },
    youtubeVideoId: { type: String, trim: true, default: "", index: true },
    thumbnailUrl: { type: String, trim: true, default: "" },
    uploadedVideo: { type: uploadedVideoSchema, default: null },
    category: { type: String, trim: true, default: "", maxlength: 80 },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0, min: 0, max: 9999, index: true },
    publishedAt: { type: Date, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "OperationsTeamUser", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "OperationsTeamUser", default: null },
  },
  { timestamps: true },
);

videoSchema.index({ status: 1, displayOrder: 1, publishedAt: -1 });

export const VideoModel = model("Video", videoSchema);
