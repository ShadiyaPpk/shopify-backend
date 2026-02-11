const otpStore = new Map();

/**
 * Generates a 6-digit OTP and stores it for the given email.
 * @param {string} email 
 * @returns {string} The generated OTP
 */
const generateOTP = (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { otp, expiresAt });

    // In a real app, send this via Email/SMS provider
    console.log(`[OTP-SERVICE] Generated OTP for ${email}: ${otp}`);

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
