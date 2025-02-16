import { model, Schema } from "mongoose";

const attendanceSchema = new Schema({
    task: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: Schema.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum:['absent','present'],
        required: true,
    },
},{timestamps: true})



const Attendance = model("attendance", attendanceSchema);
export default Attendance;