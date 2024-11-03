import Attempt from "./model";
import { Request, Response, NextFunction } from "express";

export const getUserHistory = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params["userId"];
  if (!userId) {
    return res.status(400).json({ message: "Missing user id" });
  }

  try {
    const history = await Attempt.find({ userId: userId }, { _id: 0, __v: 0, userId: 0 });
    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
};

export const addUserAttempt = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, qid } = req.body;
  if (!(userId && qid && +qid > 0)) {
    return res.status(400).json({ message: "Missing user or question id" });
  }

  try {
    console.log(`Adding attempt by user ${userId} for Q${qid}`);

    await Attempt.create({ userId, qid });
    res.status(200).json("User attempt recorded");
  } catch (err) {
    next(err);
  }
};
