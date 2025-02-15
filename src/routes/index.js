import { Router } from "express";
import hrRouter from "./hr.routes.js";

const route = Router();

route.use("/hr", hrRouter);

export default route;