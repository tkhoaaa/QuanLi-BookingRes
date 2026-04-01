const express = require("express");
const router = express.Router();
const { upload, uploadImage } = require("../controllers/upload.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, restrictTo("admin"), upload.single("image"), uploadImage);

module.exports = router;
