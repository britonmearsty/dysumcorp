# Pricing Model Implementation

## Overview
This document outlines the pricing structure and implementation for the portal/file-sharing platform.

## Pricing Tiers

### 🆓 Free Plan - "Starter"
**Price:** $0/month

**Limits:**
- 1 Portal
- 1GB Storage
- Solo user only
- No custom domains
- No white-labeling

**Features:**
- Unlimited downloads
- Basic file sharing
- Community support
- Subdomain only (yourname.platform.com)
- Powered by branding

---

### 💼 Pro Plan - "Professional"
**Price:** $29/month ($276/year with 20% discount)

**Limits:**
- 10 Portals
- 50GB Storage
- Solo user only
- 1 Custom domain

**Features:**
- Everything in Free
- Remove branding
- Password protection per portal
- Expiring links
- Basic analytics
- Custom portal themes
- Email support (24-48hr response)

---

### 👥 Team Plan - "Business"
**Price:** $99/month ($948/year with 20% discount)

**Limits:**
- 50 Portals
- 250GB Storage
- 5 Team members ($15/month per additional)
- 5 Custom domains

**Features:**
- Everything in Pro
- Full white-labeling
- Team collaboration & permissions
- Client management system
- Advanced analytics & reporting
- API access
- Branded email notifications
- Priority support (12hr response)

**Most Popular Plan** ⭐

---

### 🏢 Enterprise Plan - "Enterprise"
**Price:** $299/month ($2,868/year with 20% discount)

**Limits:**
- Unlimited Portals
- 1TB Storage (expandable)
- Unlimited Team members
- Unlimited Custom domains

**Features:**
- Everything in Business
- SSO/SAML authentication
- Advanced security (2FA enforcement, audit logs)
- Custom integrations
- SLA guarantees (99.9% uptime)
- Dedicated account manager
- Phone support (4hr SLA)
- Dedicated infrastructure option
- Custom contract terms

---

## Implementation Files

### Configuration
- **`config/pricing.ts`** - Central pricing configuration with all plans, limits, and features

### Components
- **`components/pricing-card.tsx`** - Reusable pricing card component
- **`components/usage-dashboard.tsx`** - Real-time usage tracking dashboard
- **`app/dashboard/billing/page.tsx`** - Billing management page
- **`app/pricing/page.tsx`** - Public pricing page

### API Routes
- **`app/api/user/usage/route.ts`** - Get current usage statistics
- **`app/api/portals/create/route.ts`** - Portal creation with limit enforcement
- **`app/api/storage/upload/route.ts`** - File upload with storage limit checks

### Utilities
- **`lib/plan-limits.ts`** - Plan limit checking and enforcement functions

---

## Limit Enforcement

### Portal Creation
```typescript
import { checkPortalLimit, getUserPlanType } from "@/lib/plan-limits";

const planType = await getUserPlanType(userId);
const portalCheck = await checkPortalLimit(userId, planType);

if (!portalCheck.allowed) {
  // Show upgrade prompt
}
```

### Storage Upload
```typescript
import { checkStorageLimit } from "@/lib/plan-limits";

const storageCheck = await checkStorageLimit(userId, planType, fileSize);

if (!storageCheck.allowed) {
  // Show storage limit error
}
```

### Feature Access
```typescript
import { checkFeatureAccess } from "@/lib/plan-limits";

const hasWhiteLabeling = checkFeatureAccess(planType, "whiteLabeling");
const hasAPIAccess = checkFeatureAccess(planType, "apiAccess");
```

---

## Database Schema

The pricing system uses the following database fields:

### User Table
```prisma
model User {
  subscriptionPlan   String?  @default("free")
  subscriptionStatus String?  @default("active")
  creemCustomerId    String?
  hadTrial           Boolean? @default(false)
}
```

### Portal Table
```prisma
model Portal {
  customDomain  String?  @unique
  whiteLabeled  Boolean  @default(false)
}
```

### Usage Tracking Table
```prisma
model UsageTracking {
  userId         String
  month          String   // Format: YYYY-MM
  storageUsed    BigInt   @default(0)
  portalsCreated Int      @default(0)
  filesUploaded  Int      @default(0)
  bandwidth      BigInt   @default(0)
}
```

---

## Integration with Creem

### Product IDs
Update these in `config/pricing.ts` with your actual Creem product IDs:

```typescript
creemProductId: "prod_pro_monthly"
creemProductIdAnnual: "prod_pro_annual"
```

### Webhook Handling
The Creem plugin automatically handles:
- Subscription creation
- Subscription updates
- Subscription cancellation
- Payment failures

Callbacks are configured in `lib/auth.ts`:
```typescript
onGrantAccess: async ({ reason, product, customer }) => {
  // Update user's subscription plan
}

onRevokeAccess: async ({ reason, product, customer }) => {
  // Downgrade user to free plan
}
```

---

## Usage Tracking

### Real-time Calculations
Usage is calculated on-demand from the database:
- **Portals:** Count of Portal records
- **Storage:** Sum of File.size across all user portals
- **Team Members:** Count of TeamMember records + owner
- **Custom Domains:** Count of portals with customDomain set

### Monthly Aggregation
For historical tracking, use the `UsageTracking` table to store monthly snapshots.

---

## Upgrade Flow

1. User hits a limit (e.g., tries to create 2nd portal on Free plan)
2. API returns 403 with `upgrade: true` flag
3. Frontend shows upgrade modal with current plan and recommended upgrade
4. User clicks upgrade → redirected to `/dashboard/billing`
5. User selects plan and billing cycle
6. Redirected to Creem checkout
7. After payment, webhook updates user's plan
8. User can now access premium features

---

## Testing Checklist

- [ ] Free plan users can create 1 portal
- [ ] Free plan users blocked from creating 2nd portal
- [ ] Storage limits enforced on file upload
- [ ] Custom domain blocked on Free/Pro plans
- [ ] White-labeling blocked on Free/Pro plans
- [ ] Team member limits enforced
- [ ] Usage dashboard shows accurate data
- [ ] Pricing page displays correctly
- [ ] Annual billing shows 20% discount
- [ ] Upgrade prompts appear when limits hit
- [ ] Downgrade reduces available features

---

## Next Steps

1. **Set up Creem Products**
   - Create products in Creem dashboard
   - Update product IDs in `config/pricing.ts`

2. **Configure Webhooks**
   - Set webhook URL in Creem dashboard
   - Test subscription lifecycle events

3. **Add Upgrade Modals**
   - Create modal component for upgrade prompts
   - Show when users hit limits

4. **Implement Checkout Flow**
   - Create checkout API route
   - Handle Creem redirect URLs

5. **Add Analytics**
   - Track plan conversions
   - Monitor upgrade triggers
   - Analyze feature usage by plan

6. **Customer Portal**
   - Ensure CustomerPortalButton works
   - Test plan changes
   - Verify invoice access

---

## Support

For questions about pricing implementation:
- Check `config/pricing.ts` for plan definitions
- Review `lib/plan-limits.ts` for enforcement logic
- See API routes for usage examples
