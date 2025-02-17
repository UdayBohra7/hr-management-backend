import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 3000;

app.on("error", (err) => {
    console.log("app error", err);
    throw err;
});

app.use("/", (req, res) => {
    res.send("Hello Management");
});
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`app is listening to the ${port}`)
    });
}).catch((reject) => {
    console.log("Db reject: ", reject);
})

