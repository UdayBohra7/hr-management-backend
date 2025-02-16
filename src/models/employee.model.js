import { model, Schema } from "mongoose";

const employeeSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    }, 
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    }, 
    department: {
        type: String,
        required: true,
    },
    dateOfJoining: {
        type: Date,
        required: true,
    },
    positionId: {
        type: Schema.ObjectId,
        required: true,
    },
},{timestamps: true})



const Employee = model("employee", employeeSchema);
export default Employee;