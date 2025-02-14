import express from "express";
import route from "./routes/index.js";

const  app = express();

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));

app.use(express.static("public"))

app.use("/api/v1", route)

export default app;