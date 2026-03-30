# Deployment Guide - FairwayCause Golf Charity Platform

## 1. Supabase (Database) Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `database/schema.sql` and click **Run**.
4. Go to **Project Settings -> Database** to find your connection string (`DATABASE_URL`).

## 2. Razorpay Integration
1. Create a [Razorpay Account](https://razorpay.com).
2. In the Dashboard under Settings -> API Keys, get your **Key ID** and **Key Secret**.
3. Create Subscription Plans for "Monthly" and "Yearly", note their **Plan IDs**.
4. Set up a Webhook pointing to `https://your-backend-domain.com/api/subscriptions/webhook` testing for events like `subscription.charged`.
5. Specify a **Webhook Secret** and save it.

## 3. Backend Deployment (Render / Railway)
1. Push your repository to GitHub.
2. Create a new Web Service on Render or Railway.
3. Connect your GitHub repository.
4. Set the Root Directory to `server/`.
5. Build Command: `npm install`
6. Start Command: `node src/index.js`
7. Add Environment Variables:
   - `PORT=5000`
   - `DATABASE_URL=your_supabase_postgresql_url`
   - `JWT_SECRET=generate_a_random_secure_string`
   - `RAZORPAY_KEY_ID=rzp_live_...`
   - `RAZORPAY_KEY_SECRET=...`
   - `WEBHOOK_SECRET=your_webhook_secret`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`

## 4. Frontend Deployment (Vercel)
1. In Vercel, "Add New Project" and import your GitHub repository.
2. Set the Root Directory to `client/`.
3. Framework settings (Vite) should auto-populate (`npm run build`, `dist`).
4. Add Environment Variable:
   - `VITE_API_URL=https://your-backend-domain.onrender.com/api`
5. Click **Deploy**.

## 5. Verify Setup
- Register a user on your live Vercel frontend.
- Log in manually to your Supabase instance to assign that user `role = 'admin'` for access to the Admin Dashboard.
- Subscriptions can be tested using Razorpay's test mode credentials.
- Execute a sample Monthly Draw from the Admin dashboard.
