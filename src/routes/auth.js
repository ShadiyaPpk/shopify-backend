const express = require("express");
const jwt = require("jsonwebtoken");
const { shopifyQuery } = require("../services/shopify");
const { generateOTP, verifyOTP } = require("../services/otpService");
const { findCustomerByEmail, createCustomer } = require("../services/shopifyAdmin");

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

    res.json({
      message: "Login successful",
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name
      }
    });
  } catch (error) {
    console.error("OTP Login Error:", error);
    res.status(500).json({ error: "Login failed during customer lookup" });
  }
});

module.exports = router;
