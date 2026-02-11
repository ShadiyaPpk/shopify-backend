const axios = require("axios");

const SHOP_DOMAIN = process.env.SHOP_DOMAIN;
const ADMIN_API_ACCESS_TOKEN = process.env.ADMIN_API_ACCESS_TOKEN;

// API Version for Admin API (e.g., 2024-01)
const API_VERSION = "2024-01";

const adminClient = axios.create({
    baseURL: `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`,
    headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_API_ACCESS_TOKEN,
    },
});

/**
 * Find a customer by email using Shopify Admin API
 * @param {string} email 
 * @returns {object|null} Customer object or null
 */
async function findCustomerByEmail(email) {
    try {
        const response = await adminClient.get(`/customers/search.json?query=email:${email}`);
        if (response.data.customers && response.data.customers.length > 0) {
            return response.data.customers[0];
        }
        return null;
    } catch (error) {
        console.error("Error finding customer:", error.message);
        return null;
    }
}

/**
 * Create a new customer using Shopify Admin API
 * @param {string} email 
 * @returns {object} Created customer object
 */
async function createCustomer(email) {
    try {
        const response = await adminClient.post("/customers.json", {
            customer: {
                email: email,
                verified_email: true,
                send_email_welcome: false
            }
        });
        return response.data.customer;
    } catch (error) {
        console.error("Error creating customer:", error.message);
        throw error;
    }
}

module.exports = { findCustomerByEmail, createCustomer };
