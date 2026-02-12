const express = require("express");
const jwt = require("jsonwebtoken");
const { shopifyQuery } = require("../services/shopify");
const { generateOTP, verifyOTP } = require("../services/otpService");
const { findCustomerByEmail, createCustomer, getCustomerCartId } = require("../services/shopifyAdmin");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_change_me";

// Standard Email/Password Login (Storefront API)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const mutation = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          message
        }
      }
    }
  `;

  try {
    const data = await shopifyQuery(mutation, {
      input: { email, password },
    });

    res.json(data.data.customerAccessTokenCreate);
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// --- OTP Login Routes ---

/**
 * Step 1: Request OTP
 * Body: { "email": "customer@example.com" }
 */
router.post("/otp/send", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const otp = await generateOTP(normalizedEmail);
    // In production, send this via Email/SMS. 
    // For development, it's logged in console by the service.

    res.json({ message: "OTP sent successfully", dev_note: "Check server console for OTP" });
  } catch (error) {
    console.error("OTP Send Error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/**
 * Step 2: Verify OTP
 * Body: { "email": "customer@example.com", "otp": "123456" }
 */
router.post("/otp/verify", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const isValid = verifyOTP(email, otp);

  if (!isValid) {
    return res.status(401).json({ error: "Invalid or expired OTP" });
  }

  // OTP is valid. Now find/create customer in Shopify.
  try {
    let customer = await findCustomerByEmail(email);

    if (!customer) {
      // Option: Auto-signup if customer doesn't exist
      console.log(`Customer ${email} not found, creating new one...`);
      customer = await createCustomer(email);
    }

    // Generate JWT for our BFF
    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Fetch active cart if exists
    // We need to require this function. Since I can't easily add require to top in this block, 
    // I will assume I need to add the require in a separate edit or use a dynamic import if needed, 
    // but better to just add it to the top. for now let's hope the user accepts a follow up or I do it in next step.
    // Wait, I can do it here if I am careful. But `require` is usually at top.
    // I will add the require line in a separate tool call to be safe and clean.

    // Check if we have the function available. 
    // Actually, I'll return the customer object and let the frontend call /cart/customer/:id for simplicity
    // OR, I can try to fetch it here.

    // Let's assume I will add the import in next step.
    // checks existing imports...
    // const { findCustomerByEmail, createCustomer } = require("../services/shopifyAdmin");
    // I need to update THAT line too.

    // Fetch active cart if exists
    let activeCartId = null;
    try {
      activeCartId = await getCustomerCartId(customer.id);
    } catch (e) {
      console.warn("Failed to fetch active cart during login", e.message);
    }

    res.json({
      message: "Login successful",
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        activeCartId // Send this to the frontend!
      }
    });
  } catch (error) {
    console.error("OTP Login Error:", error);
    res.status(500).json({ error: "Login failed during customer lookup" });
  }
});

module.exports = router;
