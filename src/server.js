require("dotenv").config();
const express = require("express");
const cors = require("cors");

const products = require("./routes/products");
const auth = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/products", products);
app.use("/auth", auth);

app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
    if (!process.env.ADMIN_API_ACCESS_TOKEN) {
        console.warn("WARNING: ADMIN_API_ACCESS_TOKEN is not set. OTP Login will fail.");
    }
});
