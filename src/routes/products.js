const express = require("express");
const { shopifyQuery } = require("../services/shopify");

const router = express.Router();

router.get("/", async (req, res) => {
  const query = `
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyQuery(query);
    res.json(data.data.products.edges);
  } catch (err) {
    res.status(500).json({ error: "Shopify error" });
  }
});

module.exports = router;
