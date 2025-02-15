import { model, Schema } from "mongoose";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";

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


hrSchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) return next();
        const hashPassword = await bcrypt.hash(this.password, 10);
        this.password = hashPassword;
        next();
    } catch (error) {
        next(error);
    }
});

hrSchema.methods.isPasswordMatch = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        return false;
    }
}

hrSchema.methods.generateTokens = async function () {
    const accessToken = jwt.sign(
        {
            id: this._id,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
    return accessToken;
}

const updateMiddleware = async function (next) {
    try {
        const data = this.getUpdate();
        if (data?.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            data.password = hashedPassword;
        }
        next();
    } catch (error) {
        next(error);
    }
}

hrSchema.pre(["updateOne", "findByIdAndUpdate", "findOneAndUpdate"], updateMiddleware);

const Hr = model("Hr", hrSchema);
export default Hr;