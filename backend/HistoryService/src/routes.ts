import express from "express";
import {
  getUserHistory,
  addUserAttempt,
} from "./controller";

const router = express.Router();

router.get("/:userId", getUserHistory);

router.post("/", addUserAttempt);

export default router;
