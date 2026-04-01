const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, adminKey, shipperKey } = req.body;

  // Validate required fields
  if (!name || name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }
  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Valid email is required" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Role assignment based on registration type
  let assignedRole = "customer";
  if (role === "admin") {
    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Invalid admin registration key" });
    }
    assignedRole = "admin";
  } else if (role === "shipper") {
    if (shipperKey !== process.env.SHIPPER_SECRET) {
      return res.status(403).json({ message: "Invalid shipper registration key" });
    }
    assignedRole = "shipper";
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: assignedRole,
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return res
    .status(201)
    .json(
      new ApiResponse(201, { user, accessToken, refreshToken }, "Registration successful")
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { user, accessToken, refreshToken }, "Login successful"));
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  return res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

const refreshTokenHandler = asyncHandler(async (req, res) => {
  // Support both Authorization header (frontend) and body (other clients)
  let refreshToken =
    req.body?.refreshToken ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { accessToken: newAccessToken, refreshToken: newRefreshToken }));
  } catch {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  return res.status(200).json(new ApiResponse(200, user));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, addresses } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (addresses) user.addresses = addresses;

  await user.save();
  return res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  return res.status(200).json(new ApiResponse(200, user.wishlist));
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const user = await User.findById(req.user._id);

  if (user.wishlist.includes(foodId)) {
    return res.status(400).json({ message: "Food already in wishlist" });
  }

  user.wishlist.push(foodId);
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Added to wishlist"));
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const user = await User.findById(req.user._id);

  user.wishlist = user.wishlist.filter((id) => id.toString() !== foodId);
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Removed from wishlist"));
});

module.exports = {
  register,
  login,
  logout,
  refreshTokenHandler,
  getProfile,
  updateProfile,
  changePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
