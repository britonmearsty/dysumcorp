# Creem API Examples

Additional examples for advanced Creem integration patterns.

## API Route Examples

### Check Subscription in API Route

```typescript
// app/api/check-access/route.ts
import { auth } from "@/lib/auth";
import { checkUserSubscription } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await checkUserSubscription(session.user.id);

  return NextResponse.json({
    hasAccess: status.hasAccess,
    status: status.status,
    expiresAt: status.expiresAt,
  });
}
```

### Create Checkout Session from API

```typescript
// app/api/create-checkout/route.ts
import { authClient } from "@/lib/auth-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { productId, discountCode } = await request.json();

  try {
    const { data, error } = await authClient.creem.createCheckout({
      productId,
      discountCode,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ url: data?.url });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
```

## Client-Side Patterns

### React Hook for Subscription Status

```typescript
// hooks/use-subscription.ts
"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function useSubscription() {
  const [status, setStatus] = useState<{
    hasAccess: boolean;
    loading: boolean;
    error: Error | null;
  }>({
    hasAccess: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data, error } = await authClient.creem.hasAccessGranted();
        
        if (error) throw new Error(error.message);

        setStatus({
          hasAccess: data?.hasAccess || false,
          loading: false,
          error: null,
        });
      } catch (err) {
        setStatus({
          hasAccess: false,
          loading: false,
          error: err as Error,
        });
      }
    };

    checkSubscription();
  }, []);

  return status;
}

// Usage:
// const { hasAccess, loading } = useSubscription();
```

### Conditional Rendering Based on Subscription

```typescript
"use client";

import { useSubscription } from "@/hooks/use-subscription";

export function PremiumFeature() {
  const { hasAccess, loading } = useSubscription();

  if (loading) return <div>Loading...</div>;

  if (!hasAccess) {
    return (
      <div>
        <p>This feature requires a premium subscription</p>
        <BillingButton productId="prod_xyz" label="Upgrade Now" />
      </div>
    );
  }

  return <div>Premium content here</div>;
}
```

## Advanced Patterns

### Cancel Subscription with Confirmation

```typescript
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

export function CancelSubscriptionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { data, error } = await authClient.creem.cancelSubscription();

      if (error) {
        console.error("Cancel error:", error);
        return;
      }

      if (data?.success) {
        alert("Subscription canceled successfully");
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Failed to cancel:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button color="danger" variant="light" onPress={() => setIsOpen(true)}>
        Cancel Subscription
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalContent>
          <ModalHeader>Cancel Subscription</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to cancel your subscription?</p>
            <p className="text-sm text-muted-foreground mt-2">
              You'll lose access to premium features at the end of your billing period.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              color="danger"
              onPress={handleCancel}
              isLoading={loading}
            >
              Cancel Subscription
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
```

### Transaction History Component

```typescript
"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card, CardBody } from "@heroui/card";

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await authClient.creem.searchTransactions({
          pageNumber: 1,
          pageSize: 10,
        });

        setTransactions(data?.transactions || []);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <div>Loading transactions...</div>;

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <Card key={tx.id}>
          <CardBody>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-semibold">${tx.amount}</p>
                <p className="text-sm text-muted-foreground">{tx.status}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
```

### Subscription Upgrade Flow

```typescript
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { BillingButton } from "@/components/billing-button";

const plans = [
  { id: "starter", name: "Starter", price: 29, productId: "prod_starter" },
  { id: "pro", name: "Pro", price: 99, productId: "prod_pro" },
  { id: "enterprise", name: "Enterprise", price: 299, productId: "prod_enterprise" },
];

export function UpgradeFlow() {
  const [currentPlan, setCurrentPlan] = useState("starter");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <div key={plan.id} className="border rounded-lg p-6">
          <h3 className="font-semibold text-lg">{plan.name}</h3>
          <p className="text-2xl font-bold mt-2">
            ${plan.price}
            <span className="text-sm text-muted-foreground">/month</span>
          </p>
          
          {currentPlan === plan.id ? (
            <div className="mt-4 text-sm text-green-600">Current Plan</div>
          ) : (
            <BillingButton
              productId={plan.productId}
              label={currentPlan < plan.id ? "Upgrade" : "Downgrade"}
              color="primary"
              metadata={{ previousPlan: currentPlan }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

## Server Actions (Next.js 14+)

### Create Checkout Server Action

```typescript
// app/actions/billing.ts
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function createCheckoutAction(productId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  // Use Creem API directly or through client
  // Implementation depends on your needs
  
  return { success: true };
}
```

## Middleware Protection

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const protectedPaths = ["/dashboard/premium", "/dashboard/advanced"];
  
  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    // Check subscription status
    // Redirect to billing if no access
    
    const hasAccess = true; // Implement your check
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/dashboard/billing", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

## Testing

### Mock Creem Client for Tests

```typescript
// __mocks__/auth-client.ts
export const authClient = {
  creem: {
    hasAccessGranted: jest.fn().mockResolvedValue({
      data: { hasAccess: true },
    }),
    createCheckout: jest.fn().mockResolvedValue({
      data: { url: "https://checkout.creem.io/test" },
    }),
    createPortal: jest.fn().mockResolvedValue({
      data: { url: "https://portal.creem.io/test" },
    }),
    cancelSubscription: jest.fn().mockResolvedValue({
      data: { success: true },
    }),
  },
};
```

## Environment Variables

Complete `.env` example:

```env
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Creem Billing
CREEM_API_KEY="creem_test_..."
CREEM_WEBHOOK_SECRET="whsec_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
