import { Schema, model } from "mongoose";

const jobCounterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    collection: "job_counters",
  },
);

export const JobCounterModel = model("JobCounter", jobCounterSchema);
