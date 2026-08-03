import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNEL_DEFAULTS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_RECIPIENT_TYPES,
  NOTIFICATION_TYPES,
} from "./notification.constants.js";

const notificationChannelsSchema = new Schema(
  {
    inApp: { type: Boolean, default: NOTIFICATION_CHANNEL_DEFAULTS.inApp },
    whatsapp: {
      type: Boolean,
      default: NOTIFICATION_CHANNEL_DEFAULTS.whatsapp,
    },
    email: { type: Boolean, default: NOTIFICATION_CHANNEL_DEFAULTS.email },
    push: { type: Boolean, default: NOTIFICATION_CHANNEL_DEFAULTS.push },
  },
  { _id: false },
);

const notificationSchema = new Schema(
  {
    recipientType: {
      type: String,
      enum: NOTIFICATION_RECIPIENT_TYPES,
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: "normal",
      index: true,
    },
    referenceType: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    referenceId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    actionPath: {
      type: String,
      trim: true,
      default: "",
    },
    channels: {
      type: notificationChannelsSchema,
      default: () => ({ ...NOTIFICATION_CHANNEL_DEFAULTS }),
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    /**
     * Inbox visibility end. Recalculated on read (unread → read retention window).
     * Conversation/timeline APIs ignore this field so Messages history stays intact.
     */
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    /**
     * Soft-dismiss from inbox (Clear All / Delete). Does not remove conversation history.
     */
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  },
);

notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });
notificationSchema.index({
  recipientType: 1,
  recipientId: 1,
  readAt: 1,
  createdAt: -1,
});
notificationSchema.index({
  recipientType: 1,
  recipientId: 1,
  deletedAt: 1,
  expiresAt: -1,
  createdAt: -1,
});
notificationSchema.index({ expiresAt: 1, referenceType: 1 });
notificationSchema.index({ deletedAt: 1, referenceType: 1 });

export type NotificationDocumentLean = InferSchemaType<
  typeof notificationSchema
> & {
  _id: Types.ObjectId;
};

export const NotificationModel = model("Notification", notificationSchema);
