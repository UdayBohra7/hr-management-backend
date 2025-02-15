import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import {createFavoriteCourse, currentUser, profileUpload, getCategories, getCategoryById, getCourseById, getCourses, getFavoriteCourses, getMembershipById, getMemberships, loginUser, otpSender, otpVerify, registerUser, removeFavoriteCourse, updateForgotPassword, updatePassword, updateUserDetails, purchaseMembership, transactionHistory, contactForQuery} from "../../controllers/user/user.controller.js";
import { upload } from "../../middleware/multer.middleware.js";

const userRouter = Router();

// Authentication routes
userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/me").get(verifyToken, currentUser);
userRouter.route("/update").patch(verifyToken, updateUserDetails);
userRouter.route("/profile").post(upload.single("file"), verifyToken, profileUpload);
userRouter.route("/otp").post(otpSender);
userRouter.route("/verify-otp").post(otpVerify);
userRouter.route("/reset-password").patch(verifyToken, updatePassword);
userRouter.route("/forgot-password").patch(updateForgotPassword);

// Category
userRouter.route("/category").get(verifyToken, getCategories);
userRouter.route("/category/:id").get(verifyToken, getCategoryById);

// Course
userRouter.route("/course").get(verifyToken, getCourses);
userRouter.route("/course/:id").get(verifyToken, getCourseById);

// Membership
userRouter.route("/membership").get(verifyToken, getMemberships);
userRouter.route("/membership/:id").get(verifyToken, getMembershipById);
// Purchase membership
userRouter.route("/purchase-membership").post(verifyToken, purchaseMembership);
userRouter.route("/transaction").get(verifyToken, transactionHistory);

// Favorite
userRouter.route("/favorite-course").post(verifyToken, createFavoriteCourse);
userRouter.route("/favorite-course").get(verifyToken, getFavoriteCourses);
userRouter.route("/favorite-course/:id").delete(verifyToken, removeFavoriteCourse);

// contact us
userRouter.route("/contact-us").post(verifyToken, contactForQuery);


export default userRouter;