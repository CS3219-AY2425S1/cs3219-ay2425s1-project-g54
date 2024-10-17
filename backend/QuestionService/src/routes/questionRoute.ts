import express from "express";
import {getAllQuestions, getOneQuestion, addQuestion, deleteQuestion, updateQuestion} from "../controllers/questionController"
import { ValidateBodyForCreate, ValidateBodyForPatch } from "../utils/validation";

const router = express.Router();

router.get("/", getAllQuestions);

router.get("/:qid", getOneQuestion);

router.post("/", ValidateBodyForCreate(), addQuestion); // parenthesis for validate function is required

router.delete("/:qid", deleteQuestion);

router.patch("/:qid", ValidateBodyForPatch(), updateQuestion);

export default router;