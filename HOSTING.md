# Simple Hosting Guide (For Flutter Dev)

We need to host this Node.js app so your Flutter app talks to **this server** instead of Shopify directly.

## Easiest Way: Render.com (Free & Fast)

1.  **Push this code to GitHub**.
2.  Go to **[Render.com](https://render.com/)** and sign up/login.
3.  Click **"New +"** -> **"Web Service"**.
4.  Select your GitHub repository.
5.  **Settings**:
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node src/server.js`
6.  **Environment Variables** (Click "Advanced" -> "Add Environment Variable"):
    Add these 4 values from your `.env` file:
    *   `SHOP_DOMAIN` (e.g. `your-store.myshopify.com`)
    *   `STOREFRONT_TOKEN`
    *   `ADMIN_API_ACCESS_TOKEN`
    *   `JWT_SECRET` (Use any random string)
    *   `EMAIL_USER` (Your Gmail address)
    *   `EMAIL_PASS` (Your Gmail App Password)
7.  Click **Create Web Service**.

## What to give your Flutter Developer

Once it finishes, Render will give you a URL like:
`https://shopify-bff-xyz.onrender.com`

**Your Flutter Developer needs to:**
1.  **Change the Base URL** in the app to: `https://shopify-bff-xyz.onrender.com`
2.  **Call these endpoints**:
    *   **Send OTP**: `POST /auth/otp/send`
        *   Body: `{ "email": "user@gmail.com" }`
    *   **Verify OTP**: `POST /auth/otp/verify`
        *   Body: `{ "email": "user@gmail.com", "otp": "..." }`
    *   **Login Response**:
        *   Save the `token` (JWT) locally.
        *   Send it in headers for future requests: `Authorization: Bearer <TOKEN>`
