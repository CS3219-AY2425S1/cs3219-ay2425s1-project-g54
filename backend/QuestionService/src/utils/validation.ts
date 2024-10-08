import { body, Result, validationResult } from "express-validator"
import { NextFunction, Request, Response } from "express"

export const ValidateBodyForCreate = () => {
    return [
        body("qid")
            .notEmpty().withMessage("Missing question ID.").bail()
            .isInt({min : 1}).withMessage("Question IDs should be integer values starting from 1.").bail(),
        body("title").notEmpty().withMessage("Missing question title."),
        body("complexity").isIn(["Easy", "Medium", "Hard"]).withMessage("Invalid question complexity"),
        body("categories").isArray({min: 1}).withMessage("Missing question category."),
        body("description").notEmpty().withMessage("Missing question description."),
        (req : Request, res: Response, next : NextFunction) => {
            const err : Result = validationResult(req);
            if (!err.isEmpty()) {
                const msg = err.array()[0].msg;
                console.log(req.body)
                return res.status(400).json({msg : msg});
            }
            next();
        }
    ];
}

export const ValidateBodyForPatch = () => {
    return [
        body("qid").not().exists().withMessage("Question ID should not be changed."),
        body("title").notEmpty().withMessage("Missing question title."),
        body("complexity").isIn(["Easy", "Medium", "Hard"]).withMessage("Invalid question complexity"),
        body("categories").isArray({min: 1}).withMessage("Missing question category."),
        body("description").notEmpty().withMessage("Missing question description."),
        (req : Request, res: Response, next : NextFunction) => {
            const err : Result = validationResult(req);
            if (!err.isEmpty()) {
                const msg = err.array()[0].msg;
                console.log(msg);
                return res.status(400).json({msg : msg});
            }
            next();
        }
    ]
}

