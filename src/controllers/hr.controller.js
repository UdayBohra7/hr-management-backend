import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import Hr from "../models/hr.model.js";
import { validateEmail } from "../validators/emailValidator.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import requiredFields from "../validators/requiredFieldValidator.js";
import ApiResponse from "../utils/apiResponse.js";


export const registerHr = asyncHandler(async (req, res) => {
    const {  email } = req.body;

    requiredFields(["fullName", "email", "password"], req.body);

    const validatedEmail = validateEmail(email);
    if (!validatedEmail) {
        throw new ApiError(400, "Invalid email format");
    }

    const existingHr = await Hr.findOne({ email });
    if (existingHr) {
        throw new ApiError(409, "Hr with this email already exists");
    }

    const newHr = new Hr(req.body);

    await newHr.save();

    const accessToken = await newHr.generateTokens();
    newHr.password = undefined;

    res.status(201)
        .json(new ApiResponse({ ...newHr, accessToken }, "Hr registered successfully"));
});
export const loginHr = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || !req.body.password) {
        throw new ApiError(400, "Email and password are required");
    }

    let hr = await Hr.findOne({ email });
    if (!hr) {
        throw new ApiError(404, "Hr does not exist");
    }

    const isPasswordValid = await hr.isPasswordMatch(req.body.password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Hr credentials");
    }
    const accessToken = await hr.generateTokens();
    
    const { password, otp, ...rest } = hr._doc
    res
        .status(200)
        .json(new ApiResponse({ ...rest, accessToken }, "Logged-in successfully"));
});
export const currentHr = asyncHandler(async (req, res) => {
    let currHr;
    if (req.Hr?.currentMembership) {
        currHr = await req.Hr.populate({
            path: "currentMembership",
            populate: {
                path: "membership",
            },
        });
    } else {
        currHr = req.Hr;
    }
    const now = moment().toISOString();
    if (currHr?.currentMembership && currHr.currentMembership.endDate < now) {
        console.log("Date", now);
        const expiredMembership = await Transaction.updateMany({
            // _id: currHr.currentMembership._id,
            Hr: currHr._id,
            endDate: { $lt: now },
            isExpired: false,
        },
            { $set: { isExpired: true, active: false } }
        );
        console.log("expired-membership:", expiredMembership);
        const mailTemp = {
            email: currHr.email,
            subject: "Membership Expired",
            expirationDate: moment(currHr.currentMembership.endDate).format("DD-MM-YYYY"),
            membershipPlan: currHr.currentMembership.membership.name,
            name: currHr.fullName,
            type: "membership-expired",
        };
        try {
            await mailSender(mailTemp, "membership-expired");
        } catch (error) {
            console.log(error);
        }
        currHr.currentMembership = null;
        await currHr.save();
    }

    const { password, otp, ...Hr } = currHr._doc;
    return res.status(200).json(new ApiResponse(Hr, "Current Hr fetched successfully"));
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

    let Hr = await Hr.findOne({ email });
    if (!Hr) {
        throw new ApiError(404, "Hr not found");
    }

    const isOTPValid = validateOtp(Hr.otp, otp)

    if (isOTPValid) {
        Hr.otp = null;
        Hr.isVerified = true
        await Hr.save();
        return res.status(200).json(new ApiResponse({}, "OTP verified successfully"));
    } else {
        throw new ApiError(400, "Invalid OTP");
    }
});

export const updateHrDetails = asyncHandler(async (req, res) => {
    const { Hr } = req;
    if (!Hr || !Hr.email) {
        throw new ApiError(400, "Hr not authenticated");
    }

    const { fullName, gender, age, image, country, phone, password, oldPassword } = req.body;
    
    const filter = { email: Hr.email };

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
        const isPasswordMatch = await Hr.isPasswordMatch(oldPassword);
        if (!isPasswordMatch) {
            throw new ApiError(400, "Old password is incorrect");
        }
        update.password = password;
    }

    const options = { new: true, select: '-password -otp -refreshToken' };

    let updatedHr;
    try {
        updatedHr = await Hr.findOneAndUpdate(filter, update, options);
    } catch (error) {
        throw new ApiError(404, `Hr with email ${Hr.email} not found !`);
    }
    res.status(200).json(new ApiResponse(updatedHr, "Account updated successfully"));
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

    let Hr = await Hr.findOne({ email });
    if (!Hr) {
        throw new ApiError(404, "Hr not found");
    }

    const isPasswordMatch = await Hr.isPasswordMatch(password);
    if (isPasswordMatch) {
        throw new ApiError(401, "The new password must be different from the old password");
    }

    Hr.password = password;
    await Hr.save();

    const mailTemp = {
        email,
        message: `
            We are pleased to inform you that your password has been successfully changed. This is a confirmation that the change was completed securely and your account is now updated with the new password.
        `,
        heading: "Password Changed",
        subject: "Password Changed",
        name: Hr?.fullName,
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
    const Hr = req.Hr;
    const isPasswordValid = await Hr.isPasswordMatch(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Old password not matched")
    }
    Hr.password = newPassword
    await Hr.save()
    const mailTemp = {
        email: Hr?.email,
        message: `
            We are pleased to inform you that your password has been successfully changed. This is a confirmation that the change was completed securely and your account is now updated with the new password.
        `,
        heading: "Password Changed",
        subject: "Password Changed",
        name: Hr?.fullName,
        type: "password"
    }

    try {
        mailSender(mailTemp);
    } catch (error) {
        console.log(error);
    }
    return res.status(200).json(new ApiResponse(null, "Password updated successfully"));
});
