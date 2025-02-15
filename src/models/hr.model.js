import { model, Schema } from "mongoose";

const hrSchema = new Schema({
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
    password: {
        type: String,
        required: true,
        trim: true
    }, 
},{timestamps: true})




const Hr = model("Hr", hrSchema);
export default Hr;