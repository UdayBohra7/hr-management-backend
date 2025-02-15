import { Router } from "express";
import userRoutes from "./user.routes";

const route = Router();

route.use("/users", userRoutes);

export default route;