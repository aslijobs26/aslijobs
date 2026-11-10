import { Schema, model, type InferSchemaType, type Types } from "mongoose";

/**
 * Employer-workspace view state for one Messages thread (application or job).
 * Kept apart from notifications so starring / archiving / muting never edits
 * or hides notification history. Unique per employer + thread.
 */
const employerMessageThreadStateSchema = new Schema(
  {
    employerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    referenceId: {
      type: String,
      required: true,
      trim: true,
    },
    starredAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    mutedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "employer_message_thread_states",
  },
);

employerMessageThreadStateSchema.index(
  { employerId: 1, referenceId: 1 },
  { unique: true },
);
employerMessageThreadStateSchema.index({ employerId: 1, starredAt: 1 });
employerMessageThreadStateSchema.index({ employerId: 1, archivedAt: 1 });
employerMessageThreadStateSchema.index({ employerId: 1, mutedAt: 1 });

export type EmployerMessageThreadStateLean = InferSchemaType<
  typeof employerMessageThreadStateSchema
> & {
  _id: Types.ObjectId;
};

export const EmployerMessageThreadStateModel = model(
  "EmployerMessageThreadState",
  employerMessageThreadStateSchema,
);

export const EMPLOYER_MESSAGE_THREAD_STATE_COLLECTION =
  "employer_message_thread_states";
