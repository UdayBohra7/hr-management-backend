import { model, Schema } from "mongoose";

const leaveSchema = new Schema({
   
    employeeId: {
        type: Schema.ObjectId,
        required: true,
    },
    designation: {
        type: String,
        required: true,
        trim: true
    },
    leaveDate: {
        type: Date,
        required: true,
    },
    document: {
        type: String,
        required: false,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum:['pending','approve','reject'],
        default:'pending'
    },
},{timestamps: true})



const Leave = model("leaves", leaveSchema);
export default Leave;