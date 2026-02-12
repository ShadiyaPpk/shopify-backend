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

/**
 * Updates the customer's active_cart_id metafield
 * @param {string} customerId (e.g., "gid://shopify/Customer/123456789")
 * @param {string} cartId (e.g., "gid://shopify/Cart/...")
 */
async function updateCustomerCartId(customerId, cartId) {
    if (!customerId || !cartId) {
        console.warn("[ShopifyAdmin] Missing customerId or cartId for update");
        return;
    }

    // customerId might be a GID, we need just the numeric ID for the REST API endpoint usually,
    // BUT for metafields endpoint we can use the customer ID. 
    // However, the REST API mostly uses numeric IDs in the URL: /customers/{customer_id}/metafields.json
    // Let's extract the numeric ID if it's a GID.
    const numericId = customerId.toString().replace("gid://shopify/Customer/", "");
    console.log(`[ShopifyAdmin] Attempting to update Metafield for Customer ID: ${numericId} with Cart ID: ${cartId}`);

    try {
        const payload = {
            customer: {
                id: numericId,
                metafields: [
                    {
                        namespace: "custom",
                        key: "active_cart_id",
                        value: cartId,
                        type: "single_line_text_field"
                    }
                ]
            }
        };

        const response = await adminClient.put(`/customers/${numericId}.json`, payload);
        console.log(`[ShopifyAdmin] Metafield Update Success. Status: ${response.status}`);
    } catch (error) {
        console.error("Error updating customer cart metafield:", error.response?.data || error.message);
        if (error.response?.data?.errors) {
            console.error("Detailed Errors:", JSON.stringify(error.response.data.errors, null, 2));
        }
    }
}

/**
 * Retrieves the active_cart_id from customer metafields
 * @param {string} customerId 
 * @returns {Promise<string|null>} The cart ID or null
 */
async function getCustomerCartId(customerId) {
    if (!customerId) return null;
    const numericId = customerId.toString().replace("gid://shopify/Customer/", "");

    try {
        console.log(`[ShopifyAdmin] Fetching Metafield for Customer ID: ${numericId}`);
        const response = await adminClient.get(`/customers/${numericId}/metafields.json?namespace=custom&key=active_cart_id`);

        const metafields = response.data.metafields;
        console.log(`[ShopifyAdmin] Found ${metafields.length} metafields for customer.`);

        const cartMetafield = metafields.find(m => m.key === "active_cart_id" && m.namespace === "custom");

        if (cartMetafield) {
            console.log(`[ShopifyAdmin] Found active_cart_id: ${cartMetafield.value}`);
            return cartMetafield.value;
        } else {
            console.log(`[ShopifyAdmin] active_cart_id metafield NOT found.`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching customer cart metafield:", error.response?.data || error.message);
        return null;
    }
}

module.exports = { findCustomerByEmail, createCustomer, updateCustomerCartId, getCustomerCartId };
