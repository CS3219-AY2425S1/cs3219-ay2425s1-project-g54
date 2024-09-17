import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import questionRoute from "./routes/questionRoute";
import 'dotenv/config';



const app = express();

app.use(express.json());

app.use("/api/question", questionRoute);

app.use( (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({msg : "Internal Server Error."});
})

const mongoURI = process.env.MONGOURI;
const port = process.env.PORT;

mongoose.connect(mongoURI!)
    .then(() => {
        app.listen(port, () => {
            console.log("Listening.")
        })
    })
    .catch((err) => {
        console.log(err);
    });



