import { model, Schema } from "mongoose";

const candidateSchema = new Schema({
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
    experience: {
        type: String,
        required: true,
    },
    resume: {
        type: String,
        required: true,
    },
    positionId: {
        type: Schema.ObjectId,
        required: true,
    },
    status: {
        type: String,
        enum:['scheduled','ongoing','selected','rejected','new'],
        default:'new'
    },
    consentCheck: {
        type: Boolean,
        default: false
    }
},{timestamps: true})



const Candidate = model("candidate", candidateSchema);
export default Candidate;