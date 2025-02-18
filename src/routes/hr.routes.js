import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { currentHr, loginHr, registerHr, getPosition,candidateAdd,candidateGet,candidateUpdate, candidateGetById, employeeAdd, employeeGet, employeeUpdate, employeeGetById, employeeDelete ,attendanceGet, attendanceUpdate, leaveAdd, leaveGet, leaveUpdate, uploadResume, candidateDelete, uploadDocs, createPosition} from "../controllers/hr.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const hrRouter = Router();

// Authentication routes
hrRouter.route("/register").post(registerHr);
hrRouter.route("/login").post(loginHr);
hrRouter.route("/me").get(verifyToken, currentHr);

hrRouter.route("/upload").post(verifyToken, upload.single("file"), uploadResume);
hrRouter.route("/doc").post(verifyToken, upload.single("file"), uploadDocs);

hrRouter.route("/position").get(verifyToken, getPosition).post(createPosition);

hrRouter.route("/candidate").post(verifyToken, candidateAdd);
hrRouter.route("/candidate").get(verifyToken, candidateGet);
hrRouter.route("/candidate/:candidateId").patch(verifyToken, candidateUpdate);
hrRouter.route("/candidate/:candidateId").get(verifyToken, candidateGetById);
hrRouter.route("/candidate/:candidateId").delete(verifyToken, candidateDelete);

hrRouter.route("/employee").post(verifyToken, employeeAdd);
hrRouter.route("/employee").get(verifyToken, employeeGet);
hrRouter.route("/employee/:employeeId").patch(verifyToken, employeeUpdate);
hrRouter.route("/employee/:employeeId").get(verifyToken, employeeGetById);
hrRouter.route("/employee/:employeeId").delete(verifyToken, employeeDelete);


hrRouter.route("/attendance").get(verifyToken, attendanceGet);
hrRouter.route("/attendance/:attendanceId").patch(verifyToken, attendanceUpdate);


hrRouter.route("/leave").post(verifyToken, leaveAdd);
hrRouter.route("/leave").get(verifyToken, leaveGet);
hrRouter.route("/leave/:leaveId").patch(verifyToken, leaveUpdate);


export default hrRouter;