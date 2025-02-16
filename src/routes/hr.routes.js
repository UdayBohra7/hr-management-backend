import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { currentHr, loginHr, registerHr, updateForgotPassword, updateHrDetails, updatePassword,getPosition,candidateAdd,candidateGet,candidateUpdate, candidateGetById, employeeAdd, employeeGet, employeeUpdate, employeeGetById, employeeDelete ,attendanceGet, attendanceUpdate, leaveAdd, leaveGet, leaveUpdate} from "../controllers/hr.controller.js";

const hrRouter = Router();

// Authentication routes
hrRouter.route("/register").post(registerHr);
hrRouter.route("/login").post(loginHr);
hrRouter.route("/me").get(verifyToken, currentHr);
hrRouter.route("/update").patch(verifyToken, updateHrDetails);
hrRouter.route("/reset-password").patch(verifyToken, updatePassword);
hrRouter.route("/forgot-password").patch(updateForgotPassword);
// hrRouter.route("/resume").post(upload.single("file"), verifyToken, resu);
hrRouter.route("/position").get(getPosition);
hrRouter.route("/candidate").post(candidateAdd);
hrRouter.route("/candidate").get(candidateGet);

hrRouter.route("/employee").post(employeeAdd);
hrRouter.route("/employee").get(employeeGet);


hrRouter.route("/attendance").get(attendanceGet);
hrRouter.route("/leave").post(leaveAdd);
hrRouter.route("/leave").get(leaveGet);



hrRouter.route("/candidate/:candidateId").patch(candidateUpdate);
hrRouter.route("/candidate/:candidateId").get(candidateGetById);

hrRouter.route("/employee/:employeeId").patch(employeeUpdate);
hrRouter.route("/employee/:employeeId").get(employeeGetById);
hrRouter.route("/employee/:employeeId").delete(employeeDelete);


hrRouter.route("/attendance/:attendanceId").patch(attendanceUpdate);

hrRouter.route("/leave/:leaveId").patch(leaveUpdate);


export default hrRouter;