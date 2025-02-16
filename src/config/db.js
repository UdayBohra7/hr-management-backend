import mongoose from "mongoose";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DB_URI}/${process.env.DB_NAME}`);
        console.log("DB Connected successfully");
    } catch (error) {
        console.log("DB Error: ", error);
    }
}

export default connectDB;