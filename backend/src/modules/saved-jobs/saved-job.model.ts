import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const savedJobSchema = new Schema(
  {
    jobSeekerId: {
      type: Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    publicJobId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    savedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "saved_jobs",
  },
);

savedJobSchema.index({ jobSeekerId: 1, jobId: 1 }, { unique: true });
savedJobSchema.index({ jobSeekerId: 1, savedAt: -1 });

export type SavedJobDocument = InferSchemaType<typeof savedJobSchema> & {
  _id: Types.ObjectId;
};

export const SavedJobModel = model("SavedJob", savedJobSchema);
