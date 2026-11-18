import { Schema, model, type InferSchemaType } from "mongoose";

const blogCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: "", maxlength: 400 },
    imageUrl: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type BlogCategoryDocument = InferSchemaType<typeof blogCategorySchema> & {
  _id: Schema.Types.ObjectId;
};

export const BlogCategoryModel = model("BlogCategory", blogCategorySchema);
