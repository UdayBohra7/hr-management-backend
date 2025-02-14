import { Router } from "express";
import userRoutes from "./user/user.routes.js";

const route = Router();

route.use("/users", userRoutes);

export default route;