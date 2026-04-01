const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    variants: [
      {
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
      },
    ],
    toppings: [
      {
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

foodSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    const slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    this.slug = slug;
  }
  next();
});

foodSchema.index({ name: "text", description: "text" });
foodSchema.index({ category: 1 });
foodSchema.index({ slug: 1 });

const Food = mongoose.model("Food", foodSchema);
module.exports = Food;
