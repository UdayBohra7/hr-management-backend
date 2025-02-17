import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import Hr from "../models/hr.model.js";
import { validateEmail } from "../validators/emailValidator.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import requiredFields from "../validators/requiredFieldValidator.js";
import ApiResponse from "../utils/apiResponse.js";
import Candidate from "../models/candidate.model.js";
import Position from "../models/position.model.js";
import Employee from "../models/employee.model.js";
import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";
import { Types } from "mongoose";


export const registerHr = asyncHandler(async (req, res) => {
    const { email } = req.body;

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
    const { password, otp, ...rest } = req.user._doc;
    return res.status(200).json(new ApiResponse(rest, "Current Hr fetched successfully"));
});


export const getPosition = asyncHandler(async (req, res) => {
    const data = await Position.find({});
    if (data?.length) {
        res.status(201)
            .json(new ApiResponse(data, "Position get successfully"));

    } else {
        res.status(201)
            .json(new ApiResponse([], "Data not found"));
    }
});

// candidate service
export const candidateAdd = asyncHandler(async (req, res) => {
    const { email } = req.body;

    requiredFields(["fullName", "email", "phoneNumber", "experience", "resume", "positionId"], req.body);

    const validatedEmail = validateEmail(email);
    if (!validatedEmail) {
        throw new ApiError(400, "Invalid email format");
    }

    const existingCandidate = await Candidate.findOne({ email });
    if (existingCandidate) {
        throw new ApiError(409, "Candidate with this email already exists");
    }

    const newCandidate = new Candidate(req.body);

    await newCandidate.save();

    res.status(201)
        .json(new ApiResponse(newCandidate, "Candidate registered successfully"));
});
export const candidateUpdate = asyncHandler(async (req, res) => {
    requiredFields(["status"], req.body);

    const update = await Candidate.findOneAndUpdate({ _id: req.params.candidateId }, { $set: req.body }, { new: true })
    if (update) {
        res.status(201)
            .json(new ApiResponse({}, "Status updated successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse({}, "Bad request!"));
    }

});
export const candidateGet = asyncHandler(async (req, res) => {
    let filter = {}
    if (req.query.search) {
        filter.$or = [
            { email: { $regex: req.query.search, $options: "i" } },
            { fullName: { $regex: req.query.search, $options: "i" } }
        ]
        delete req.query.search
    }
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.positionId) {
        filter.positionId = new Types.ObjectId(String(req.query.positionId));
    }
    const data = await Candidate.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: 'positions',
                let: { positionId: '$positionId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$positionId'] },
                        }
                    },
                ],
                as: 'position'
            }
        },
        { $unwind: "$position" }
    ])
    if (data?.length) {
        res.status(200)
            .json(new ApiResponse(data, "Candidate get successfully"));
    } else {
        res.status(200)
            .json(new ApiResponse([], "Data not found"));
    }
});
export const candidateGetById = asyncHandler(async (req, res) => {
    const data = await Candidate.findById(req.params.candidateId)
    if (data) {
        res.status(201)
            .json(new ApiResponse(data, "Candidate get successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse([], "Data not found"));
    }
});
export const candidateDelete = asyncHandler(async (req, res) => {
    const deleteData = await Candidate.findByIdAndDelete(req.params.candidateId)
    if (deleteData) {
        res.status(200)
            .json(new ApiResponse({}, "Candidate delete successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse({}, "Bad request!"));
    }

});

// Employee service

export const employeeAdd = asyncHandler(async (req, res) => {
    const { email } = req.body;

    requiredFields(["fullName", "email", "phoneNumber", "department", "dateOfJoining", "positionId"], req.body);

    const validatedEmail = validateEmail(email);
    if (!validatedEmail) {
        throw new ApiError(400, "Invalid email format");
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
        throw new ApiError(409, "Employee with this email already exists");
    }

    const newEmployee = new Employee(req.body);
    await newEmployee.save();

    await Attendance.create({employeeId: newEmployee._id, status: "absent"});

    res.status(201)
        .json(new ApiResponse(newEmployee, "Employee registered successfully"));
});
export const employeeGet = asyncHandler(async (req, res) => {
    let filter = {}
    if (req.query.search) {
        filter.$or = [
            { email: { $regex: req.query.search, $options: "i" } },
            { fullName: { $regex: req.query.search, $options: "i" } }
        ]
        delete req.query.search
    }
    if (req.query.positionId) {
        filter.positionId = new Types.ObjectId(String(req.query.positionId));
    }
    const data = await Employee.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: 'positions',
                let: { positionId: '$positionId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$positionId'] },
                        }
                    },
                ],
                as: 'position'
            }
        },
        { $unwind: "$position" }
    ])
    if (data?.length) {
        res.status(200)
            .json(new ApiResponse(data, "Employee get successfully"));
    } else {
        res.status(200)
            .json(new ApiResponse([], "Data not found"));
    }
});
export const employeeGetById = asyncHandler(async (req, res) => {
    const data = await Employee.findById(req.params.employeeId)
    if (data) {
        res.status(201)
            .json(new ApiResponse(data, "Employee get successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse([], "Data not found"));
    }
});
export const employeeUpdate = asyncHandler(async (req, res) => {

    const update = await Employee.findOneAndUpdate({ _id: req.params.employeeId }, { $set: req.body }, { new: true })
    if (update) {
        res.status(201)
            .json(new ApiResponse({}, "Employee update successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse({}, "Bad request!"));
    }

});

export const employeeDelete = asyncHandler(async (req, res) => {
    const deleteData = await Employee.findByIdAndDelete(req.params.employeeId)
    if (deleteData) {
        await Attendance.deleteOne({employeeId: deleteData._id})
        res.status(200)
            .json(new ApiResponse({}, "Employee delete successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse({}, "Bad request!"));
    }

});

// Attendance service

export const attendanceGet = asyncHandler(async (req, res) => {
    let filter = {}
    if (req.query.status) {
        filter.status = req.query.status
    }
    const data = await Attendance.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: 'employees',
                let: { employeeId: '$employeeId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$employeeId'] },
                            $or: [
                                { email: new RegExp(req.query.search, 'i') },
                                { fullName: new RegExp(req.query.search, 'i') }
                            ]
                        }
                    },
                ],
                as: 'employee'
            }
        },
        { $unwind: "$employee" },
        {
            $lookup: {
                from: 'positions',
                let: { positionId: '$employee.positionId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$positionId'] },
                        }
                    },
                ],
                as: 'employee.position'
            }
        },
        { $unwind: { path: "$employee.position", preserveNullAndEmptyArrays: true } }

    ])
    if (data?.length) {
        res.status(200)
            .json(new ApiResponse(data, "Attendance get successfully"));
    } else {
        res.status(200)
            .json(new ApiResponse([], "Data not found"));
    }
});
export const attendanceUpdate = asyncHandler(async (req, res) => {

    const update = await Attendance.findOneAndUpdate({ _id: req.params.attendanceId }, { $set: req.body }, { new: true })
    if (update) {
        res.status(201)
            .json(new ApiResponse({}, "Attendance update successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse({}, "Bad request!"));
    }

});

//leave service
export const leaveAdd = asyncHandler(async (req, res) => {

    requiredFields(["employeeId", "designation", "leaveDate", "reason"], req.body);

    const addLeave = new Leave(req.body);
    await addLeave.save();

    res.status(201)
        .json(new ApiResponse(addLeave, "Leave add successfully"));
});

export const leaveGet = asyncHandler(async (req, res) => {
    let filter = {}
    if (req.query.status) {
        filter.status = req.query.status
    }
    const data = await Leave.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: 'employees',
                let: { employeeId: '$employeeId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$employeeId'] },
                            $or: [
                                { email: new RegExp(req.query.search, 'i') },
                                { fullName: new RegExp(req.query.search, 'i') }
                            ]
                        }
                    },
                ],
                as: 'employee'
            }
        },
        { $unwind: "$employee" }
    ])
    if (data?.length) {
        res.status(200)
            .json(new ApiResponse(data, "Leave get successfully"));
    } else {
        res.status(200)
            .json(new ApiResponse([], "Data not found"));
    }
});
export const leaveUpdate = asyncHandler(async (req, res) => {

    const update = await Leave.findOneAndUpdate({ _id: req.params.leaveId }, { $set: req.body }, { new: true })
    if (update) {
        res.status(201)
            .json(new ApiResponse({}, "Leave update successfully"));
    } else {
        res.status(400)
            .json(new ApiResponse({}, "Bad request!"));
    }

});

// upload resume
export const uploadResume = asyncHandler(async (req, res) => {
    const fileType = req.file.mimetype;

    if (!fileType.includes("pdf")) {
        throw new ApiError(400, "File should be pdf type");
    }
    const fileUrl = `${process.env.BASE_URL}/resumes/${req.file.filename}`;

    res.status(200).json(new ApiResponse(fileUrl, "File uploaded successfully"));
});
export const uploadDocs = asyncHandler(async (req, res) => {
    const fileType = req.file.mimetype;

    const fileUrl = `${process.env.BASE_URL}/leaves/${req.file.filename}`;

    res.status(200).json(new ApiResponse(fileUrl, "File uploaded successfully"));
});