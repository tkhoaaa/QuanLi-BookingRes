const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", verifyToken, authController.logout);
router.post("/refresh-token", authController.refreshTokenHandler);
router.get("/profile", verifyToken, authController.getProfile);
router.put("/profile", verifyToken, authController.updateProfile);
router.patch("/change-password", verifyToken, authController.changePassword);
router.get("/wishlist", verifyToken, authController.getWishlist);
router.post("/wishlist/:foodId", verifyToken, authController.addToWishlist);
router.delete("/wishlist/:foodId", verifyToken, authController.removeFromWishlist);

module.exports = router;
