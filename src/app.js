import express from "express";
import route from "./routes/index.js";
import cors from "cors"

const  app = express();

app.use(cors());
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));

app.use(express.static("public"))

app.use("/api/v1", route)

export default app;