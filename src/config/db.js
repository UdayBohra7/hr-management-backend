import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DB_URI}/${process.env.DB_NAME}`);
        console.log("DB Host: ", connectionInstance?.connection?.host);
    } catch (error) {
        console.log("DB Error: ", error);
    }
}

export default connectDB;