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
    const normalizedEmail = email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(normalizedEmail, { otp, expiresAt });

    // Console log for dev/debugging
    console.log(`[OTP-SERVICE] Generated OTP for ${normalizedEmail}: ${otp}`);

    // Send Real Email via Resend
    if (process.env.RESEND_API_KEY) {
        try {
            await resend.emails.send({
                from: 'onboarding@resend.dev', // Default testing domain. Verify your own domain in Resend dashboard for production.
                to: normalizedEmail,
                subject: 'Your OTP Code',
                html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>It expires in 5 minutes.</p>`
            });
            console.log(`[OTP-SERVICE] Email sent to ${normalizedEmail} via Resend`);
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
const verifyOTP = (email, inputOtp) => {
    const normalizedEmail = email.toLowerCase().trim();
    const otp = String(inputOtp).trim(); // Ensure it's a string for comparison

    const record = otpStore.get(normalizedEmail);

    console.log(`[OTP-SERVICE] Verifying for ${normalizedEmail}. Input OTP: "${otp}" (type: ${typeof inputOtp})`);

    if (!record) {
        console.warn(`[OTP-SERVICE] No OTP record found for ${normalizedEmail}`);
        // Debug: Print all keys in store to see if it's stored under a different key
        console.log(`[OTP-SERVICE] Current keys in store:`, [...otpStore.keys()]);
        return false;
    }

    if (Date.now() > record.expiresAt) {
        console.warn(`[OTP-SERVICE] OTP expired for ${normalizedEmail}`);
        otpStore.delete(normalizedEmail);
        return false;
    }

    if (record.otp === otp) {
        console.log(`[OTP-SERVICE] OTP Success for ${normalizedEmail}`);
        otpStore.delete(normalizedEmail);
        return true;
    }

    console.warn(`[OTP-SERVICE] Invalid OTP for ${normalizedEmail}. Expected: "${record.otp}" (${typeof record.otp}), Got: "${otp}" (${typeof otp})`);
    return false;
};

module.exports = { generateOTP, verifyOTP };
