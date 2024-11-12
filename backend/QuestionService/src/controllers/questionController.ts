import mongoose from "mongoose";
import Question from "../models/questionModel";
import { Response, Request, NextFunction } from "express";

const DUPKEYERRORCODE = 11000; 

export const getAllQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const questions = await Question.find({}, {_id: 0, __v: 0}).sort({qid: "asc"});
        res.status(200).json(questions);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

export const getOneQuestion = async (req: Request, res: Response, next: NextFunction) => {
    const { qid } = req.params;
    if (isNaN(+qid)) {
        return res.status(404).send({msg: "Please enter a valid question ID."})
    }
    try {
        const question = await Question.findOne({qid: qid}, {_id: 0, __v: 0});
        if (!question) {
            return res.status(404).send({msg : `No question with ID ${qid}.`});
        }
        res.status(200).json(question);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

export const addQuestion = async (req: Request, res: Response, next : NextFunction) => {
    const {qid, title, description, categories, complexity} = req.body;
    try {
        console.log(req.body)
        const question = await Question.create({qid, title, description, categories, complexity});
        res.status(200).json(question);
    } catch (err) {
        console.log(err);
        if (err instanceof mongoose.mongo.MongoError && err.code === DUPKEYERRORCODE) { // this catches duplicate key error
            return res.status(404).json({msg: "A question with this ID or title already exists."});
        }
        next(err);
    }
}

export const deleteQuestion = async (req: Request, res: Response, next : NextFunction) => {
    const { qid } = req.params;
    if (isNaN(+qid)) {
        return res.status(404).send({msg: "Please enter a valid question ID."})
    }
    try {
        const question = await Question.findOneAndDelete({qid: qid}, {_id: 0, __v: 0});
        if (!question) {
            return res.status(404).send({msg: `No question with ID ${qid}`});
        }
        res.status(200).json(question);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

export const updateQuestion = async (req: Request, res: Response, next : NextFunction) => {
    const { qid } = req.params;
    if (isNaN(+qid)) {
        return res.status(404).send({msg: "Please enter a valid question ID."})
    }
    try {
        const question = await Question.findOneAndUpdate({qid: qid}, {...req.body, qid}, {_id: 0, __v: 0})
        if (!question) {
            return res.status(404).send({msg: `No question with ID ${qid}`});
        }
        res.status(200).json(question);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

export const getRandomQuestion = async (req: Request, res: Response, next: NextFunction) => {
    const { difficulty, topic } = req.params;
    try {
        const questions = await Question.aggregate([
            { $match: { complexity: difficulty, categories: topic } },
            { $sample: { size: 1 } },
            { $project: { _id: 0, __v: 0 } }
        ]);
        if (questions.length === 0) {
            return res.status(404).send({ msg: `No question found for difficulty ${difficulty} and topic ${topic}.` });
        }
        res.status(200).json(questions[0]);
    } catch (err) {
        console.log(err);
        next(err);
    }
}
