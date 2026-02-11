const { Resend } = require("resend");

const otpStore = new Map();

// Initialize Resend
// User needs to set RESEND_API_KEY in .env
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send Real Email via Resend
    if (process.env.RESEND_API_KEY) {
        try {
            await resend.emails.send({
                from: 'onboarding@resend.dev', // Default testing domain. Verify your own domain in Resend dashboard for production.
                to: email,
                subject: 'Your OTP Code',
                html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`
            });
            console.log(`[OTP-SERVICE] Email sent to ${email} via Resend`);
        } catch (error) {
            console.error(`[OTP-SERVICE] Failed to send email via Resend:`, error);
            // We don't throw here so the API still returns success (OTP is generated)
        }
    } else {
        console.warn("[OTP-SERVICE] RESEND_API_KEY not found in .env. Email not sent.");
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
