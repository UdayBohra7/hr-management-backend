import Hr from "../models/hr.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';

export const verifyToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken ||
        (req.headers["authorization"]?.replace("Bearer ", "") || "").trim();

    if (!token) {
        throw new ApiError(403, "Unauthorized request");
    }

    const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log("decodedData-> : ", decodedData);
    let user = await Hr.findById(decodedData?.id).select("-otp");

    if (!user) {
        return res.status(401).json("Invalid token")
    }
    req.user = user;
    next();
});

