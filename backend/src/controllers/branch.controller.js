const Branch = require("../models/Branch.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const getBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find({ isActive: true }).sort("-createdAt");
  return res.status(200).json(new ApiResponse(200, branches));
});

const createBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.create(req.body);
  return res.status(201).json(new ApiResponse(201, branch, "Branch created"));
});

const updateBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const branch = await Branch.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }
  return res.status(200).json(new ApiResponse(200, branch, "Branch updated"));
});

const deleteBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const branch = await Branch.findByIdAndDelete(id);
  if (!branch) {
    return res.status(404).json({ message: "Branch not found" });
  }
  return res.status(200).json(new ApiResponse(200, null, "Branch deleted"));
});

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};
