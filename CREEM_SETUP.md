# Creem Billing Integration Setup Guide

This guide will help you complete the Creem billing integration for your Next.js application.

## ✅ Completed Steps

1. ✅ Installed `@creem_io/better-auth` package
2. ✅ Updated `lib/auth.ts` with Creem plugin configuration
3. ✅ Updated `lib/auth-client.ts` with Creem client plugin
4. ✅ Created billing components:
   - `components/subscription-status.tsx` - Display subscription status
   - `components/billing-button.tsx` - Create checkout sessions
   - `components/customer-portal-button.tsx` - Open customer portal
5. ✅ Updated billing page with Creem integration
6. ✅ Added environment variables to `.env`

## 🔧 Required Setup Steps

### 1. Get Your Creem API Keys

1. Go to [Creem Dashboard](https://creem.io/dashboard/developers)
2. Navigate to the "Developers" section
3. Copy your API key
4. Update `.env` file:

```env
CREEM_API_KEY=your_actual_creem_api_key_here
```

### 2. Set Up Webhooks

1. Go to [Creem Webhooks](https://creem.io/dashboard/developers/webhooks)
2. Click "Add Webhook"
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/auth/creem/webhook
   ```
   For local development:
   ```
   http://localhost:3000/api/auth/creem/webhook
   ```
4. Copy the webhook signing secret
5. Update `.env` file:
   ```env
   CREEM_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### 3. Run Database Migration

The Creem plugin requires additional database tables for subscription persistence:

```bash
# Generate migration
npx @better-auth/cli generate

# Run migration
npx @better-auth/cli migrate
```

### 4. Create Products in Creem Dashboard

1. Go to [Creem Products](https://creem.io/dashboard/products)
2. Create your subscription products (e.g., Starter, Pro, Enterprise)
3. Copy the product IDs
4. Update the product IDs in `app/dashboard/billing/page.tsx`:

```typescript
<BillingButton
  productId="prod_your_actual_product_id"
  label="Subscribe"
/>
```

### 5. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/dashboard/billing`

3. Test the checkout flow:
   - Click on a "Subscribe" button
   - Complete the checkout process
   - Verify webhook is received
   - Check subscription status updates

### 6. Local Development with Webhooks

For local testing, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Then update your Creem webhook URL with the ngrok URL.

## 📚 Usage Examples

### Check Subscription in Server Component

```typescript
import { checkUserSubscription } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/auth");
  }

  const status = await checkUserSubscription(session.user.id);

  if (!status.hasAccess) {
    redirect("/dashboard/billing");
  }

  return <div>Premium Content</div>;
}
```

### Create Checkout with Discount

```typescript
<BillingButton
  productId="prod_xyz"
  label="Subscribe with 50% Off"
  discountCode="LAUNCH50"
  metadata={{ source: "landing_page" }}
/>
```

### Cancel Subscription

```typescript
"use client";

import { authClient } from "@/lib/auth-client";

export function CancelButton() {
  const handleCancel = async () => {
    const { data, error } = await authClient.creem.cancelSubscription();
    
    if (data?.success) {
      console.log('Subscription canceled');
    }
  };

  return <button onClick={handleCancel}>Cancel Subscription</button>;
}
```

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set `testMode: false` in `lib/auth.ts`
- [ ] Use production Creem API key
- [ ] Update webhook URL to production domain
- [ ] Test webhook delivery in production
- [ ] Set up monitoring for webhook failures
- [ ] Configure proper error handling
- [ ] Add loading states to all billing actions
- [ ] Test subscription flows end-to-end

## 🔗 Resources

- [Creem Documentation](https://docs.creem.io)
- [Better Auth Creem Plugin](https://better-auth.com/docs/plugins/creem)
- [Creem Dashboard](https://creem.io/dashboard)
- [Webhook Testing Guide](https://docs.creem.io/webhooks)

## 🆘 Troubleshooting

### Webhooks not received
- Check webhook URL is correct
- Verify webhook secret matches
- Check server logs for errors
- Test with ngrok for local development

### Subscription status not updating
- Verify database migration ran successfully
- Check webhook is being processed
- Look for errors in `onGrantAccess` / `onRevokeAccess` handlers

### Checkout not working
- Verify product ID is correct
- Check API key is valid
- Ensure user is authenticated
- Check browser console for errors
