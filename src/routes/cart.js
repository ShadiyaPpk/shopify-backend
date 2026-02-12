const express = require("express");
const { shopifyQuery } = require("../services/shopify");
const { updateCustomerCartId, getCustomerCartId } = require("../services/shopifyAdmin");

const router = express.Router();

/**
 * POST /cart/create
 * Creates a new cart.
 * Body: { 
 *   "lines": [{ "merchandiseId": "gid://...", "quantity": 1 }],
 *   "customerId": "gid://shopify/Customer/123" (Optional - to link cart to user)
 * } 
 */
router.post("/create", async (req, res) => {
  const { lines, customerId } = req.body;

  const mutation = `
    mutation cartCreate($input: CartInput) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          lines(first: 10) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                        amount
                        currencyCode
                    }
                    product {
                        title
                        handle
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const variables = { input: {} };
    if (lines && lines.length > 0) {
      variables.input.lines = lines;
    }

    const data = await shopifyQuery(mutation, variables);

    if (data.errors) {
      console.error("Shopify API Errors:", data.errors);
      return res.status(500).json({ error: "Failed to create cart (Shopify API Error)" });
    }

    const result = data.data.cartCreate;

    if (result.userErrors && result.userErrors.length > 0) {
      return res.status(400).json({ errors: result.userErrors });
    }

    const cart = result.cart;

    // Sync with Customer if logged in
    if (customerId && cart.id) {
      // Run in background, don't block response
      updateCustomerCartId(customerId, cart.id).catch(err => console.error("Bg meta update failed", err));
    }

    res.json(cart);
  } catch (error) {
    console.error("Cart Create Error:", error);
    res.status(500).json({ error: "Failed to create cart" });
  }
});

/**
 * GET /cart/customer/:customerId
 * Fetches the active cart ID for a specific customer.
 */
router.get("/customer/:customerId", async (req, res) => {
  const { customerId } = req.params;

  try {
    const cartId = await getCustomerCartId(customerId);

    if (!cartId) {
      return res.status(404).json({ message: "No active cart found for this customer" });
    }

    // Optionally, we could also fetch the full cart details here
    // But for mobile app logic, usually getting the ID is enough to then call GET /cart/:id

    res.json({ cartId });
  } catch (error) {
    console.error("Fetch Customer Cart Error:", error);
    res.status(500).json({ error: "Failed to fetch customer cart" });
  }
});

/**
 * GET /cart/:cartId
 * Fetches an existing cart by ID.
 */
router.get("/:cartId", async (req, res) => {
  const { cartId } = req.params;

  // The cartId from the client might be just the ID part or encoded.
  // Shopify expects the full GID usually.
  // If the client sends just "123", we might need to format it, but usually the GID is "gid://shopify/Cart/..."
  // We will assume the client sends whatever they got from /create

  // IMPORTANT: decodeURIComponent if it was passed in URL encoded
  const decodedId = decodeURIComponent(cartId);

  const query = `
    query cart($id: ID!) {
      cart(id: $id) {
        id
        checkoutUrl
        lines(first: 20) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  image {
                    url
                    altText
                  }
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
          totalTaxAmount {
             amount
             currencyCode
          }
        }
      }
    }
  `;

  try {
    const data = await shopifyQuery(query, { id: decodedId });

    if (data.errors) {
      // Shopify returns "errors" array if ID is malformed or not found in a way GQL doesn't like
      console.error("Shopify Cart Fetch Errors:", data.errors);
      return res.status(404).json({ error: "Cart not found or invalid ID" });
    }

    if (!data.data.cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    res.json(data.data.cart);
  } catch (error) {
    console.error("Cart Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

/**
 * POST /cart/lines/add
 * Adds items to an existing cart.
 * Body: {
 *   "cartId": "gid://shopify/Cart/...",
 *   "lines": [{ "merchandiseId": "gid://...", "quantity": 1 }]
 * }
 */
router.post("/lines/add", async (req, res) => {
  const { cartId, lines } = req.body;

  if (!cartId || !lines || lines.length === 0) {
    return res.status(400).json({ error: "cartId and lines are required" });
  }

  const mutation = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          lines(first: 20) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                        amount
                        currencyCode
                    }
                    product {
                        title
                        handle
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
    `;

  try {
    const data = await shopifyQuery(mutation, { cartId, lines });

    if (data.errors) {
      console.error("Shopify API Errors:", data.errors);
      return res.status(500).json({ error: "Failed to add items to cart" });
    }

    const result = data.data.cartLinesAdd;
    if (result.userErrors && result.userErrors.length > 0) {
      return res.status(400).json({ errors: result.userErrors });
    }

    res.json(result.cart);
  } catch (error) {
    console.error("ADD TO CART Error:", error);
    res.status(500).json({ error: "Failed to add items to cart" });
  }
});

module.exports = router;
