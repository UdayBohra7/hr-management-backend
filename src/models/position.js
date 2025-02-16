import { model, Schema } from "mongoose";

const positionSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
},{timestamps: true})



const Position = model("positions", positionSchema);
export default Position;