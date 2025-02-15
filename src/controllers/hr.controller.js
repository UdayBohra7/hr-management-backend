import { generateOTP } from "../../helpers/otpGenerator.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import User from "../../models/user.models.js";
import requiredFields from "../../validators/requiredFieldValidator.js";
import { validateEmail } from "../../validators/emailValidater.js";
import { validateOtp } from "../../validators/otpValidator.js";
import mailSender from "../../utils/mailSender.js";
import Notification from "../../models/notification.model.js";
import jwt from "jsonwebtoken";
import Membership from "../../models/membership.model.js";
import Course from "../../models/course.model.js";
import Category from "../../models/category.model.js";
import Favorite from "../../models/favorite.model.js";
import mongoose from "mongoose";
import Transaction from "../../models/transaction.model.js";
import moment from "moment-timezone";
import ContactUs from "../../models/contactUs.model.js";


export const registerUser = asyncHandler(async (req, res) => {
    const {  email } = req.body;

    requiredFields(["fullName", "email", "password"], req.body);

    const validatedEmail = validateEmail(email);
    if (!validatedEmail) {
        throw new ApiError(400, "Invalid email format");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }


    const newUser = new User(req.body);

    await newUser.save();

    const mailTemp = {
        email,
        name: newUser.fullName,
        heading: "Welcome",
        type: "welcome",
        subject: "Welcome"
    }
    try {
        await mailSender(mailTemp);
    } catch (error) {
        console.log(error);
    }

    const options = {
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    };

    const accessToken = await newUser.generateTokens();
    newUser.password = undefined;
    newUser.otp = undefined;
    newUser.refreshToken = undefined;

    res.status(201)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse({ user: newUser, accessToken }, "User registered successfully"));
});
export const loginUser = asyncHandler(async (req, res) => {
    const { email, device } = req.body;

    if (!email || !req.body.password) {
        throw new ApiError(400, "Email and password are required");
    }

    let user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordMatch(req.body.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }
    user.device = device
    await user.save()
    const accessToken = await user.generateTokens();

    const options = {
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    };
    const { password, otp, ...rest } = user._doc
    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse({ user: rest, accessToken }, "Logged-in successfully"));
});
export const currentUser = asyncHandler(async (req, res) => {
    let currUser;
    if (req.user?.currentMembership) {
        currUser = await req.user.populate({
            path: "currentMembership",
            populate: {
                path: "membership",
            },
        });
    } else {
        currUser = req.user;
    }
    const now = moment().toISOString();
    if (currUser?.currentMembership && currUser.currentMembership.endDate < now) {
        console.log("Date", now);
        const expiredMembership = await Transaction.updateMany({
            // _id: currUser.currentMembership._id,
            user: currUser._id,
            endDate: { $lt: now },
            isExpired: false,
        },
            { $set: { isExpired: true, active: false } }
        );
        console.log("expired-membership:", expiredMembership);
        const mailTemp = {
            email: currUser.email,
            subject: "Membership Expired",
            expirationDate: moment(currUser.currentMembership.endDate).format("DD-MM-YYYY"),
            membershipPlan: currUser.currentMembership.membership.name,
            name: currUser.fullName,
            type: "membership-expired",
        };
        try {
            await mailSender(mailTemp, "membership-expired");
        } catch (error) {
            console.log(error);
        }
        currUser.currentMembership = null;
        await currUser.save();
    }

    const { password, otp, ...user } = currUser._doc;
    return res.status(200).json(new ApiResponse(user, "Current user fetched successfully"));
});

export const idVerifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (typeof otp !== 'string' || otp.length !== 6 || !/^\d+$/.test(otp)) {
        throw new ApiError(400, "Invalid OTP format");
    }

    let user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isOTPValid = validateOtp(user.otp, otp)

    if (isOTPValid) {
        user.otp = null;
        user.isVerified = true
        await user.save();
        return res.status(200).json(new ApiResponse({}, "OTP verified successfully"));
    } else {
        throw new ApiError(400, "Invalid OTP");
    }
});

export const updateUserDetails = asyncHandler(async (req, res) => {
    const { user } = req;
    if (!user || !user.email) {
        throw new ApiError(400, "User not authenticated");
    }

    const { fullName, gender, age, image, country, phone, password, oldPassword } = req.body;
    
    const filter = { email: user.email };

    if (gender && !["male", "female", "other"].includes(gender)) {
        throw new ApiError(400, "Incorrect value for gender enum")
    }

    const update = {};
    if (fullName !== undefined) update.fullName = fullName;
    if (image !== undefined) update.image = image;
    if (country !== undefined) update.country = country;
    if (phone !== undefined) update.phone = phone;
    if (age !== undefined) update.age = age;
    if (gender !== undefined) update.gender = gender;
    if (password !== undefined) {
        if(!oldPassword){
            throw new ApiError(400, "Old password is required");
        }
        const isPasswordMatch = await user.isPasswordMatch(oldPassword);
        if (!isPasswordMatch) {
            throw new ApiError(400, "Old password is incorrect");
        }
        update.password = password;
    }

    const options = { new: true, select: '-password -otp -refreshToken' };

    let updatedUser;
    try {
        updatedUser = await User.findOneAndUpdate(filter, update, options);
    } catch (error) {
        throw new ApiError(404, `User with email ${user.email} not found !`);
    }
    res.status(200).json(new ApiResponse(updatedUser, "Account updated successfully"));
});

// forgot password
export const updateForgotPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const headers = req.headers;
    const token = headers['x-token'];
    if (!token) {
        throw new ApiError(400, "Token is required");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decodedToken || decodedToken.type !== "forgot" || decodedToken.email !== email) {
            throw new ApiError(401, "Invalid token");
        }
    } catch (err) {
        console.log(err.message)
        if (err.name === 'TokenExpiredError') {
            throw new ApiError(401, "Token has expired");
        } else {
            throw new ApiError(401, "Invalid token");
        }
    }

    let user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordMatch = await user.isPasswordMatch(password);
    if (isPasswordMatch) {
        throw new ApiError(401, "The new password must be different from the old password");
    }

    user.password = password;
    await user.save();

    const mailTemp = {
        email,
        message: `
            We are pleased to inform you that your password has been successfully changed. This is a confirmation that the change was completed securely and your account is now updated with the new password.
        `,
        heading: "Password Changed",
        subject: "Password Changed",
        name: user?.fullName,
        type: "password"
    }
    try {
        await mailSender(mailTemp);
    } catch (error) {
        console.log(error);
    }

    return res.status(200).json(new ApiResponse({}, "Password changed successfully"));
});

// Update Password
export const updatePassword = asyncHandler(async (req, res) => {
    const { password, newPassword } = req.body;
    requiredFields(["password", "newPassword"], req.body);

    if (password === newPassword) {
        throw new ApiError(400, 'New password cannot be the same as the old password');
    }
    const user = req.user;
    const isPasswordValid = await user.isPasswordMatch(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Old password not matched")
    }
    user.password = newPassword
    await user.save()
    const mailTemp = {
        email: user?.email,
        message: `
            We are pleased to inform you that your password has been successfully changed. This is a confirmation that the change was completed securely and your account is now updated with the new password.
        `,
        heading: "Password Changed",
        subject: "Password Changed",
        name: user?.fullName,
        type: "password"
    }

    try {
        mailSender(mailTemp);
    } catch (error) {
        console.log(error);
    }
    return res.status(200).json(new ApiResponse(null, "Password updated successfully"));
});
