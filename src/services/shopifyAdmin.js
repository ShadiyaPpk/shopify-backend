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
    if (!customerId || !cartId) return;

    // customerId might be a GID, we need just the numeric ID for the REST API endpoint usually,
    // BUT for metafields endpoint we can use the customer ID. 
    // However, the REST API mostly uses numeric IDs in the URL: /customers/{customer_id}/metafields.json
    // Let's extract the numeric ID if it's a GID.
    const numericId = customerId.toString().replace("gid://shopify/Customer/", "");

    try {
        // First check if the metafield exists to update it, or create new.
        // For simplicity in REST, we can just POST to creating a metafield.
        // If we want to upsert, we might need to find it first or use GraphQL.
        // Let's use the standard POST to /customers/{id}/metafields.json which creates.
        // To update, we technically need the metafield ID if using REST, OR use the "key" to find it.

        // BETTER APPROACH: Use GraphQL for this as it handles "upsert" by key much better.
        // But since this file is using REST (axios), let's stick to REST but check if we can just overwrite.
        // Actually, for simple key-value storage without tracking IDs, GraphQL `customerUpdate` is cleaner.
        // But let's try to stick to the existing pattern of this file.

        // Strategy: Try to create. If it fails (rare for metafields if creating), handle it.
        // Actually, Shopify REST API allows creating/updating metafields via the Customer update endpoint too.

        await adminClient.put(`/customers/${numericId}.json`, {
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
        });
        console.log(`[ShopifyAdmin] Updated Cart ID ${cartId} for Customer ${numericId}`);
    } catch (error) {
        console.error("Error updating customer cart metafield:", error.response?.data || error.message);
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
        const response = await adminClient.get(`/customers/${numericId}/metafields.json?namespace=custom&key=active_cart_id`);
        // The response contains a list of metafields matching the query
        const metafields = response.data.metafields;

        const cartMetafield = metafields.find(m => m.key === "active_cart_id" && m.namespace === "custom");

        return cartMetafield ? cartMetafield.value : null;
    } catch (error) {
        console.error("Error fetching customer cart metafield:", error.response?.data || error.message);
        return null;
    }
}

module.exports = { findCustomerByEmail, createCustomer, updateCustomerCartId, getCustomerCartId };
