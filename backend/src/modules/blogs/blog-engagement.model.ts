import { Schema, model } from "mongoose";

const blogEngagementSchema = new Schema(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    visitorId: {
      type: String,
      required: true,
      trim: true,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
    liked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "blog_engagements",
  },
);

blogEngagementSchema.index({ blogId: 1, visitorId: 1 }, { unique: true });
blogEngagementSchema.index({ blogId: 1, lastViewedAt: -1 });

export const BlogEngagementModel = model("BlogEngagement", blogEngagementSchema);
