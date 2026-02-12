require("dotenv").config();
const express = require("express");
const cors = require("cors");

const products = require("./routes/products");
const auth = require("./routes/auth");
const cart = require("./routes/cart");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/products", products);
app.use("/products", products);
app.use("/auth", auth);
app.use("/cart", cart);

// --- DEBUG ROUTE (Temporary) ---
const { updateCustomerCartId, getCustomerCartId } = require("./services/shopifyAdmin");
app.get("/debug/meta-test/:customerId/:cartId", async (req, res) => {
    try {
        const { customerId, cartId } = req.params;
        console.log("Debug: Forcing update...");
        await updateCustomerCartId(customerId, cartId);

        console.log("Debug: Reading back...");
        const result = await getCustomerCartId(customerId);

        res.json({
            success: true,
            message: "Test complete. Check logs.",
            readBackValue: result,
            instructions: "If readBackValue is null, the write failed."
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});
// -------------------------------

app.listen(process.env.PORT, () => {
    console.log("Server running on port", process.env.PORT);
    if (!process.env.ADMIN_API_ACCESS_TOKEN) {
        console.warn("WARNING: ADMIN_API_ACCESS_TOKEN is not set. OTP Login will fail.");
    }
});
