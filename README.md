# Family Donation Collection Platform

A full-stack Next.js application for managing monthly family donations with Stripe subscriptions and Firebase backend.

## Features

- **User Authentication**: Secure login and registration with Firebase Authentication
- **Family Profiles**: Manage family information and monthly donation amounts
- **Stripe Integration**: Automated monthly subscription payments via Stripe Checkout
- **Donation Tracking**: Complete history of all donations with receipts
- **Admin Dashboard**: Overview of all families, subscriptions, and donation metrics
- **Real-time Updates**: Webhook integration for payment status updates
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Cloud Firestore (Firebase)
- **Authentication**: Firebase Authentication
- **Payments**: Stripe (Subscriptions, Checkout, Webhooks)
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Firebase account and project
- A Stripe account (with test mode for development)
- A Vercel account (for deployment)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd nektaa
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (optional)

#### Enable Firebase Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Click "Save"

#### Create a Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your preferred location
5. Click "Enable"

#### Deploy Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Copy the contents of `firestore.rules` from this repository
3. Paste and publish the rules

#### Get Firebase Configuration

1. In Firebase Console, go to **Project settings** (gear icon)
2. Scroll down to "Your apps" and click the web icon (</>)
3. Register your app with a nickname
4. Copy the configuration values (apiKey, authDomain, projectId, etc.)

#### Get Firebase Admin SDK Credentials

1. In Firebase Console, go to **Project settings** > **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. You'll need the `project_id`, `client_email`, and `private_key` from this file

### 4. Set Up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Go to Dashboard > Developers > API keys
3. Copy your Publishable key and Secret key (use test mode for development)
4. Set up a webhook endpoint:
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - For local development: Use a tool like [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com/)
   - For production: `https://your-domain.com/api/stripe/webhook`
   - Select these events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (from service account JSON)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: For the `FIREBASE_PRIVATE_KEY`, copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`, and make sure to keep the `\n` characters for line breaks.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create an Admin User

1. Register a new family account through the UI
2. Go to Firebase Console > Firestore Database
3. Find the `families` collection and your user document
4. Add a field: `is_admin` (boolean) = `true`
5. Refresh the app to access the admin dashboard

### 8. Testing Stripe Webhooks Locally

For local development, use the Stripe CLI:

```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret and update your .env.local
```

## Deployment to Vercel

### 1. Prepare Firebase for Production

1. Ensure Firestore security rules are deployed
2. Generate a new service account key for production (optional, or use the same one)
3. Keep your Firebase Admin SDK credentials secure

### 2. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Import Project"
3. Import your GitHub repository
4. Configure environment variables:
   - Add all variables from `.env.local`
   - For `FIREBASE_PRIVATE_KEY`, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Deploy

### 4. Update Stripe Webhook URL

After deployment:

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add a new endpoint: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
3. Select the same events as before
4. Copy the new webhook signing secret
5. Update the `STRIPE_WEBHOOK_SECRET` environment variable in Vercel
6. Redeploy if necessary

## Usage

### For Families

1. **Register**: Create an account with family information
2. **Set Monthly Amount**: Choose your monthly donation amount during registration
3. **Subscribe**: Click "Setup Monthly Donation" to enter payment details via Stripe
4. **View Dashboard**: Track your subscription status and donation history
5. **Manage Subscription**: Cancel or update your subscription anytime

### For Admins

1. **Access Admin Dashboard**: Click "Admin Dashboard" in the navigation
2. **View All Families**: See all registered families and their subscription status
3. **Track Donations**: Monitor all incoming donations and payment statuses
4. **View Metrics**: See total monthly revenue and lifetime donations

## Database Structure

### Families Collection
```
families/{userId}
  ├── id: string
  ├── user_id: string
  ├── family_name: string
  ├── contact_email: string
  ├── contact_phone?: string
  ├── monthly_amount: number
  ├── stripe_customer_id?: string
  ├── stripe_subscription_id?: string
  ├── subscription_status: "active" | "inactive" | "cancelled" | "past_due"
  ├── is_admin: boolean
  ├── created_at: timestamp
  └── updated_at: timestamp
```

### Donations Collection
```
donations/{donationId}
  ├── id: string
  ├── family_id: string
  ├── amount: number
  ├── stripe_payment_intent_id: string
  ├── stripe_invoice_id?: string
  ├── status: "pending" | "succeeded" | "failed"
  ├── receipt_url?: string
  ├── period_start: timestamp
  ├── period_end: timestamp
  └── created_at: timestamp
```

## Security Features

- Firestore Security Rules protect user data
- Users can only view/edit their own family data
- Admins can view all data but cannot modify other families
- Stripe webhook signature verification
- Secure API routes with proper error handling
- Environment variables for sensitive credentials
- Firebase Admin SDK for server-side operations

## API Routes

- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/cancel-subscription` - Cancel a subscription
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Project Structure

```
├── app/
│   ├── api/stripe/          # Stripe API routes
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboard
│   ├── admin/               # Admin dashboard
│   └── page.tsx             # Landing page
├── lib/
│   ├── firebase.ts          # Firebase client
│   ├── firebase-admin.ts    # Firebase admin SDK
│   └── stripe.ts            # Stripe client
├── types/
│   └── database.ts          # TypeScript types
├── firestore.rules          # Firestore security rules
└── components/              # Reusable React components
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check Stripe webhook logs in Dashboard
2. Verify webhook URL is correct
3. Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
4. Check Vercel function logs
5. For local development, ensure Stripe CLI is running

### Firebase Connection Issues

1. Verify Firebase credentials in environment variables
2. Check Firestore security rules are deployed
3. Ensure Firebase Authentication is enabled
4. Check browser console for detailed errors

### Authentication Problems

1. Verify Firebase Auth is enabled in console
2. Check that Email/Password provider is enabled
3. Ensure cookies are enabled in browser
4. Check Firebase Auth configuration in `lib/firebase.ts`

### Private Key Issues

1. Ensure `FIREBASE_PRIVATE_KEY` includes the full key with headers
2. Keep the `\n` characters in the private key
3. Wrap the entire key in double quotes in `.env.local`
4. In Vercel, paste the key exactly as it appears in the service account JSON

## Development Tips

- Use Stripe test mode for development
- Use Stripe CLI to test webhooks locally
- Check Firebase Console for real-time database updates
- Monitor Vercel function logs for API route errors
- Use Firebase Auth emulator for testing (optional)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
