# How to Get Admin API Access Token

To use the OTP Login feature, you need an **Admin API Access Token** because the Storefront API does not allow looking up customers by email without a password.

## Step-by-Step Instructions

> [!IMPORTANT]
> **Do not use the Shopify Partners Dashboard** (dev.shopify.com). You must log in to your **Store Admin** directly.

1.  **Log in to Shopify Admin**:
    Go to `https://admin.shopify.com/store/YOUR-STORE-NAME`.
    *   If you see "Home", "Versions", "Monitoring" in the sidebar, **you are in the wrong place**.
    *   You should see "Home", "Orders", "Products", "Customers", etc.

2.  **Go to Settings**:
    Click strictly on **Settings** (bottom left corner).

3.  **Apps and sales channels**:
    In the left sidebar, click **Apps and sales channels**.

4.  **Develop apps**:
    Click on the **Develop apps** button (usually at the top right).
    *   *Note: If this is your first time, you may need to click "Allow custom app development".*

5.  **Create an app**:
    Click **Create an app**.
    *   **App name**: Enter something like `Flutter Mobile App BFF`.
    *   **App developer**: Select your account.
    *   Click **Create app**.

6.  **Configure Admin API Scopes**:
    *   **Do not create a new app**. You are already in the right place!
    *   Click the **Configure** button inside the "Admin API integration" box (as seen in your screenshot).
    *   In the search bar, type `customers`.
    *   Check the boxes for:
        *   `read_customers`
        *   `write_customers`
    *   Click **Save** (top right).

7.  **Get the Token**:
    *   Go to the **API credentials** tab (next to "Configuration").
    *   Look for **Admin API access token**.
    *   Click **Install app** (if not installed yet).
    *   Click **Reveal token once**.
    *   **Copy this token** (starts with `shpat_...`).

## Where to put it

Paste this token into your `.env` file:

```env
ADMIN_API_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
