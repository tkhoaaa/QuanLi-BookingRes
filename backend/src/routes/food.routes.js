const express = require("express");
const router = express.Router();
const foodController = require("../controllers/food.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

router.get("/", foodController.getFoods);
router.get("/:id", foodController.getFood);

router.post("/", verifyToken, restrictTo("admin"), foodController.createFood);
router.put("/:id", verifyToken, restrictTo("admin"), foodController.updateFood);
router.delete("/:id", verifyToken, restrictTo("admin"), foodController.deleteFood);

module.exports = router;
