# Creem Billing - Quick Start Guide

## 🎯 What's Been Set Up

Your Next.js app now has full Creem billing integration with Better Auth:

### ✅ Completed
- Creem plugin added to Better Auth server (`lib/auth.ts`)
- Creem client plugin added (`lib/auth-client.ts`)
- Database schema updated with subscription tables
- Billing page with subscription management (`app/dashboard/billing/page.tsx`)
- Premium content example with access control (`app/dashboard/premium/page.tsx`)
- Reusable components:
  - `SubscriptionStatus` - Display subscription info
  - `BillingButton` - Create checkout sessions
  - `CustomerPortalButton` - Manage subscriptions

## 🚀 Next Steps

### 1. Add Your Creem API Key

Update `.env` with your actual Creem credentials:

```env
CREEM_API_KEY=your_actual_api_key_from_creem_dashboard
CREEM_WEBHOOK_SECRET=your_webhook_secret_from_creem_dashboard
```

Get these from: https://creem.io/dashboard/developers

### 2. Set Up Webhook

1. Go to: https://creem.io/dashboard/developers/webhooks
2. Add webhook URL: `http://localhost:3000/api/auth/creem/webhook`
3. Copy the signing secret to `.env`

For production, use your actual domain.

### 3. Create Products

1. Go to: https://creem.io/dashboard/products
2. Create your subscription products
3. Copy product IDs
4. Update in `app/dashboard/billing/page.tsx`:

```typescript
<BillingButton
  productId="prod_your_actual_id_here"
  label="Subscribe"
/>
```

### 4. Test It Out

```bash
npm run dev
```

Visit:
- `/dashboard/billing` - View plans and subscribe
- `/dashboard/premium` - Protected premium content

## 📖 Common Use Cases

### Protect a Route

```typescript
// app/premium-feature/page.tsx
import { checkUserSubscription } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PremiumFeature() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) redirect("/auth");
  
  const status = await checkUserSubscription(session.user.id);
  if (!status.hasAccess) redirect("/dashboard/billing");

  return <div>Premium Feature</div>;
}
```

### Add Subscribe Button Anywhere

```typescript
import { BillingButton } from "@/components/billing-button";

<BillingButton
  productId="prod_xyz"
  label="Upgrade to Pro"
  color="primary"
/>
```

### Check Subscription Status

```typescript
"use client";
import { authClient } from "@/lib/auth-client";

const { data } = await authClient.creem.hasAccessGranted();
if (data?.hasAccess) {
  // User has active subscription
}
```

### Open Customer Portal

```typescript
import { CustomerPortalButton } from "@/components/customer-portal-button";

<CustomerPortalButton label="Manage Billing" />
```

## 🔧 Configuration Options

### Server Config (`lib/auth.ts`)

```typescript
creem({
  apiKey: process.env.CREEM_API_KEY!,
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET,
  testMode: true, // false for production
  defaultSuccessUrl: "/dashboard",
  persistSubscriptions: true, // Recommended
  onGrantAccess: async ({ reason, product, customer, metadata }) => {
    // Custom logic when access is granted
  },
  onRevokeAccess: async ({ reason, product, customer, metadata }) => {
    // Custom logic when access is revoked
  },
})
```

## 🎨 Available Components

### SubscriptionStatus
Displays current subscription status with expiry date.

```typescript
import { SubscriptionStatus } from "@/components/subscription-status";
<SubscriptionStatus />
```

### BillingButton
Creates checkout session for a product.

```typescript
import { BillingButton } from "@/components/billing-button";

<BillingButton
  productId="prod_xyz"
  label="Subscribe"
  color="primary"
  variant="solid"
  discountCode="LAUNCH50"
  metadata={{ source: "landing" }}
/>
```

### CustomerPortalButton
Opens Creem customer portal for subscription management.

```typescript
import { CustomerPortalButton } from "@/components/customer-portal-button";

<CustomerPortalButton
  label="Manage Subscription"
  variant="bordered"
/>
```

## 🔐 Access Control Patterns

### Server-Side (Recommended)
```typescript
const status = await checkUserSubscription(userId);
if (!status.hasAccess) redirect("/billing");
```

### Client-Side
```typescript
const { data } = await authClient.creem.hasAccessGranted();
if (!data?.hasAccess) router.push("/billing");
```

### Middleware (Coming Soon)
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Check subscription and redirect if needed
}
```

## 📊 Webhook Events

The plugin automatically handles these webhook events:

- `subscription.created` - New subscription
- `subscription.updated` - Subscription changed
- `subscription.canceled` - Subscription canceled
- `subscription.expired` - Subscription expired
- `payment.succeeded` - Payment successful
- `payment.failed` - Payment failed

Access is automatically granted/revoked based on these events.

## 🐛 Troubleshooting

### "Webhook signature verification failed"
- Check `CREEM_WEBHOOK_SECRET` matches Creem dashboard
- Ensure webhook URL is correct

### "Product not found"
- Verify product ID is correct
- Check you're using the right test/production mode

### Subscription status not updating
- Check webhook is configured correctly
- Verify database migration ran successfully
- Look for errors in server logs

## 📚 Resources

- [Full Setup Guide](./CREEM_SETUP.md)
- [Creem Docs](https://docs.creem.io)
- [Better Auth Creem Plugin](https://better-auth.com/docs/plugins/creem)
- [Creem Dashboard](https://creem.io/dashboard)
