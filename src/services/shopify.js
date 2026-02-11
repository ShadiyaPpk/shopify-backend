const axios = require("axios");

const SHOP_DOMAIN = process.env.SHOP_DOMAIN;
const STOREFRONT_TOKEN = process.env.STOREFRONT_TOKEN;

const shopifyClient = axios.create({
    baseURL: `https://${SHOP_DOMAIN}/api/2024-01/graphql.json`,
    headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
});

async function shopifyQuery(query, variables = {}) {
    const response = await shopifyClient.post("", {
        query,
        variables,
    });

    return response.data;
}

module.exports = { shopifyQuery };
