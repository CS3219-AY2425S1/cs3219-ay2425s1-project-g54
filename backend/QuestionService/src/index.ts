import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import questionRoute from "./routes/questionRoute";
import 'dotenv/config';
import cors from "cors";


const app = express();

app.use(express.json());

app.use(cors<Request>(
    {
        origin: `${process.env.FRONTEND_ENDPOINT}`, // config cors so that front-end can use
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    }
));

app.use("/api/question", questionRoute);


//global error handler
app.use( (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({msg : "Internal Server Error."});
})

const mongoURI = process.env.MONGOURI;
const port = process.env.PORT;

mongoose.connect(mongoURI!)
    .then(() => {
        app.listen(port, () => {
            console.log(`Listening at port ${port}.`)
        })
    })
    .catch((err: Error) => {
        console.log(err);
    });
