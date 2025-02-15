import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { currentHr, loginHr, registerHr, updateForgotPassword, updateHrDetails, updatePassword } from "../controllers/hr.controller.js";

const hrRouter = Router();

// Authentication routes
hrRouter.route("/register").post(registerHr);
hrRouter.route("/login").post(loginHr);
hrRouter.route("/me").get(verifyToken, currentHr);
hrRouter.route("/update").patch(verifyToken, updateHrDetails);
hrRouter.route("/reset-password").patch(verifyToken, updatePassword);
hrRouter.route("/forgot-password").patch(updateForgotPassword);
// hrRouter.route("/resume").post(upload.single("file"), verifyToken, resu);



export default hrRouter;