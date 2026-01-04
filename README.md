# Family Donation Collection Platform

A full-stack Next.js application for managing monthly family donations with Stripe subscriptions and Supabase backend.

## Features

- **User Authentication**: Secure login and registration with Supabase Auth
- **Family Profiles**: Manage family information and monthly donation amounts
- **Stripe Integration**: Automated monthly subscription payments via Stripe Checkout
- **Donation Tracking**: Complete history of all donations with receipts
- **Admin Dashboard**: Overview of all families, subscriptions, and donation metrics
- **Real-time Updates**: Webhook integration for payment status updates
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (Subscriptions, Checkout, Webhooks)
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- A Stripe account (with test mode for development)
- A Vercel account (for deployment)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd donation-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Run the database migration:
   - Go to SQL Editor in Supabase Dashboard
   - Copy the contents of `supabase/migrations/20240101000000_initial_schema.sql`
   - Execute the SQL to create tables and policies

### 4. Set Up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from Dashboard > Developers > API keys
3. Set up a webhook endpoint:
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create an Admin User

1. Register a new family account
2. Go to Supabase Dashboard > Table Editor > families
3. Find your family record and set `is_admin` to `true`
4. Refresh the app to access the admin dashboard

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Import Project"
3. Import your GitHub repository
4. Configure environment variables (same as `.env.local`)
5. Deploy

### 3. Update Stripe Webhook URL

After deployment, update your Stripe webhook endpoint URL to your production domain:
```
https://your-vercel-domain.vercel.app/api/stripe/webhook
```

### 4. Update Supabase Redirect URLs

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel domain to Site URL and Redirect URLs:
   - `https://your-vercel-domain.vercel.app`
   - `https://your-vercel-domain.vercel.app/auth/callback`

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

## Database Schema

### Families Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `family_name`: Text
- `contact_email`: Text
- `contact_phone`: Text (optional)
- `monthly_amount`: Decimal
- `stripe_customer_id`: Text
- `stripe_subscription_id`: Text
- `subscription_status`: Enum (active, inactive, cancelled, past_due)
- `is_admin`: Boolean

### Donations Table
- `id`: UUID (Primary Key)
- `family_id`: UUID (Foreign Key to families)
- `amount`: Decimal
- `stripe_payment_intent_id`: Text
- `stripe_invoice_id`: Text
- `status`: Enum (pending, succeeded, failed)
- `receipt_url`: Text
- `period_start`: Timestamp
- `period_end`: Timestamp

## Security Features

- Row Level Security (RLS) policies on all tables
- Users can only view/edit their own family data
- Admins can view all data but cannot modify other families
- Stripe webhook signature verification
- Secure API routes with proper error handling
- Environment variables for sensitive credentials

## API Routes

- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/cancel-subscription` - Cancel a subscription
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Troubleshooting

### Webhook Not Receiving Events

1. Check Stripe webhook logs in Dashboard
2. Verify webhook URL is correct
3. Ensure STRIPE_WEBHOOK_SECRET is set correctly
4. Check Vercel function logs

### Database Connection Issues

1. Verify Supabase credentials in environment variables
2. Check if RLS policies are enabled
3. Ensure migrations were run successfully

### Authentication Problems

1. Verify Supabase Auth is enabled
2. Check redirect URLs in Supabase settings
3. Ensure cookies are enabled in browser

## Development

### Project Structure

```
├── app/
│   ├── api/stripe/          # Stripe API routes
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboard
│   ├── admin/               # Admin dashboard
│   └── page.tsx             # Landing page
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── supabase-server.ts   # Supabase admin client
│   └── stripe.ts            # Stripe client
├── types/
│   └── database.ts          # TypeScript database types
├── supabase/
│   └── migrations/          # Database migrations
└── components/              # Reusable React components
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
