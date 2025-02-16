import express from "express";
import route from "./routes/index.js";
import cors from "cors"
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const  app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));

app.use(express.static(path.join(__dirname, '../public')));

app.use("/api/v1", route)

export default app;