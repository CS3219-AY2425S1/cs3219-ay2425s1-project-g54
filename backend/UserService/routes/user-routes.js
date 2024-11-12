import express from "express";

import {
  createUser,
  deleteUser,
  forgetPassword,
  getAllUsers,
  getUser,
  resetPassword,
  updateUser,
  updateUserPrivilege,
  verifyUserAccount,
} from "../controller/user-controller.js";
import {
  verifyAccessToken,
  verifyIsAdmin,
  verifyIsOwnerOrAdmin,
} from "../middleware/basic-access-control.js";
import upload from "../config/multer-config.js";

const router = express.Router();

router.get("/", verifyAccessToken, verifyIsAdmin, getAllUsers);

//Change user to isAdmin. During creation, default is false
router.patch(
  "/:id/privilege",
  verifyAccessToken,
  verifyIsAdmin,
  updateUserPrivilege
);

router.post("/", createUser);

router.get("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, getUser);

//Update User password only
router.patch(
  "/:id",
  verifyAccessToken,
  verifyIsOwnerOrAdmin,
  upload.single("avatar"),
  updateUser
);

router.delete("/:id", verifyAccessToken, verifyIsOwnerOrAdmin, deleteUser);

router.get("/forgotpassword/:email", forgetPassword);
router.post("/forgotpassword/:token", resetPassword);
router.get("/verify/:token", verifyUserAccount);

export default router;
