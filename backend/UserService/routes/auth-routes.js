import express from "express";

import { handleLogin, handleLogout, handleVerifyToken } from "../controller/auth-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";

const router = express.Router();

router.post("/login", handleLogin);

router.delete("/login", verifyAccessToken, handleLogout);

router.get("/verify-token", verifyAccessToken, handleVerifyToken);

export default router;
