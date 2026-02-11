const nodemailer = require("nodemailer");

const otpStore = new Map();

// Configure Nodemailer Transporter
// User needs to set EMAIL_USER and EMAIL_PASS in .env
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This should be an App Password, not main password
    },
});

/**
 * Generates a 6-digit OTP and stores it for the given email.
 * @param {string} email 
 * @returns {Promise<string>} The generated OTP
 */
const generateOTP = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { otp, expiresAt });

    // Console log for dev/debugging
    console.log(`[OTP-SERVICE] Generated OTP for ${email}: ${otp}`);

    // Send Real Email if credentials exist
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            await transporter.sendMail({
                from: `"Shopify App" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Your Login OTP",
                text: `Your OTP code is: ${otp}. It expires in 5 minutes.`,
                html: `<p>Your OTP code is: <b>${otp}</b></p><p>It expires in 5 minutes.</p>`,
            });
            console.log(`[OTP-SERVICE] Email sent to ${email}`);
        } catch (error) {
            console.error(`[OTP-SERVICE] Failed to send email:`, error);
            // We don't throw here so the API still returns success (OTP is generated)
        }
    } else {
        console.warn("[OTP-SERVICE] Email credentials not found in .env. Email not sent.");
    }

    return otp;
};

/**
 * Verifies the OTP for the given email.
 * @param {string} email 
 * @param {string} otp 
 * @returns {boolean} True if valid, false otherwise
 */
const verifyOTP = (email, otp) => {
    const record = otpStore.get(email);

    if (!record) return false;

    if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return false;
    }

    if (record.otp === otp) {
        otpStore.delete(email);
        return true;
    }

    return false;
};

module.exports = { generateOTP, verifyOTP };
