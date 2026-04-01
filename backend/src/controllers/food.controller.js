const Food = require("../models/Food.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const getFoods = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    sort = "-createdAt",
    page = 1,
    limit = 20,
    featured,
    minPrice,
    maxPrice,
  } = req.query;

  const query = { isAvailable: true };

  if (search) {
    query.$text = { $search: search };
  }
  if (category) {
    query.category = category;
  }
  if (featured === "true") {
    query.isFeatured = true;
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Food.countDocuments(query);
  const foods = await Food.find(query)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("category", "name");

  return res.status(200).json(
    new ApiResponse(200, {
      foods,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    })
  );
});

const getFood = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const food = await Food.findById(id);
  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }
  return res.status(200).json(new ApiResponse(200, food));
});

const createFood = asyncHandler(async (req, res) => {
  const food = await Food.create(req.body);
  return res.status(201).json(new ApiResponse(201, food, "Food created"));
});

const updateFood = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const food = await Food.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }
  return res.status(200).json(new ApiResponse(200, food, "Food updated"));
});

const deleteFood = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const food = await Food.findByIdAndDelete(id);
  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }
  return res.status(200).json(new ApiResponse(200, null, "Food deleted"));
});

module.exports = {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood,
};
