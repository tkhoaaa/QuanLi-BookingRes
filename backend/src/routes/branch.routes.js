const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branch.controller");
const { verifyToken, restrictTo } = require("../middlewares/auth.middleware");

router.get("/", branchController.getBranches);

router.post("/", verifyToken, restrictTo("admin"), branchController.createBranch);
router.put("/:id", verifyToken, restrictTo("admin"), branchController.updateBranch);
router.delete("/:id", verifyToken, restrictTo("admin"), branchController.deleteBranch);

module.exports = router;
