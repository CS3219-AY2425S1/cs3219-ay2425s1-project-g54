import express, { Request, Response, NextFunction } from "express";
import historyRoute from "./routes";
import mongoose from "mongoose";
import cors from "cors";


const app = express();

app.use(express.json());

app.use(cors({
  origin: `${process.env.FRONTEND_ENDPOINT}`,
  methods: ['GET', 'POST'],
}));


app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Hello World from history-service" });
});

app.use("/api/history/", historyRoute);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(`Error occurred: ${err}`);
  res.status(500).json({ message: "Internal Server Error" });
});


mongoose.connect(process.env.MONGOURI!)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Listening on port ${process.env.PORT}.`)
    })
  })
  .catch((err: Error) => {
    console.log(err);
  });
