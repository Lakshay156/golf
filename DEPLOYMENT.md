# Deployment Guide - FairwayCause Golf Charity Platform

## 1. Supabase (Database) Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `database/schema.sql` and click **Run**.
4. Go to **Project Settings -> Database** to find your connection string (`DATABASE_URL`).

## 2. Stripe Integration
1. Create a [Stripe Account](https://stripe.com).
2. In the Dashboard under Developers -> API Keys, get your **Secret Key**.
3. Create Subscription Products for "Monthly" and "Yearly", and note their **Price IDs**.
4. *(Note: You will configure the Stripe Webhook later in Step 5, because Stripe needs your live backend URL first!)*

## 3. Frontend Initial Deployment (Vercel)
*We must deploy the frontend first to generate a valid domain for backend CORS and Stripe redirect URLs.*
1. In Vercel, "Add New Project" and import your GitHub repository.
2. Set the Root Directory to `client/`.
3. Framework settings (Vite) should auto-populate (`npm run build`, `dist`).
4. You can leave `VITE_API_URL` missing or point it to localhost for now.
5. Click **Deploy**. Note the assigned live URL (e.g., `https://fairwaycause.vercel.app`).

## 4. Backend Deployment (Render / Railway)
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
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `WEBHOOK_SECRET=dummy_for_now` (We will update this in Step 5)
   - `CLIENT_URL=https://your-frontend-domain.vercel.app` (The Vercel URL generated in Step 3)
8. Deploy the backend and copy its new live URL (e.g., `https://fairwaycause-backend.onrender.com`).

## 5. Connecting the Dots (Webhooks & Vercel API URL)
Now that both sides have live URLs, we must connect them to each other and to Stripe:

**A. Vercel (Frontend) Configuration:**
1. Go back to your Vercel project Settings -> Environment Variables.
2. Add: `VITE_API_URL=https://fairwaycause-backend.onrender.com/api` (The backend URL from Step 4)
3. Go to the Deployments tab and click **Redeploy**.

**B. Stripe Webhook Configuration:**
1. In your Stripe Dashboard, go to Developers -> Webhooks -> **Add an endpoint**.
2. For the Endpoint URL, paste your backend URL adding the webhook path: `https://fairwaycause-backend.onrender.com/api/subscriptions/webhook`
3. Select the event: `checkout.session.completed` and save.
4. Stripe will reveal a **Signing Secret** (`whsec_...`). Copy it.

**C. Render (Backend) Configuration:**
1. Go back to your Render backend Settings -> Environment Variables.
2. Update `WEBHOOK_SECRET` with the real `whsec_...` value you just copied.
3. **Save Changes** (Render will automatically restart the server with the new secret).

## 6. Verify Setup
- Register a user on your live Vercel frontend.
- Log in manually to your Supabase instance to assign that user `role = 'admin'` for access to the Admin Dashboard.
- Subscriptions can be tested using Stripe's test mode credentials.
- Execute a sample Monthly Draw from the Admin dashboard.
