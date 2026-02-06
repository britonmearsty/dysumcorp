"use client";

import { SubscriptionStatus } from "@/components/subscription-status";
import { BillingButton } from "@/components/billing-button";
import { CustomerPortalButton } from "@/components/customer-portal-button";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Billing</h1>
        <p className="text-muted-foreground mt-2">Manage your billing and payments</p>
      </div>

      {/* Subscription Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <SubscriptionStatus />
        <div className="flex items-center gap-3">
          <CustomerPortalButton />
          <BillingButton
            productId="your_product_id_here"
            label="Upgrade Plan"
            color="primary"
          />
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-mono font-semibold text-lg">Starter</h3>
              <p className="text-2xl font-bold font-mono mt-2">$29<span className="text-sm text-muted-foreground">/month</span></p>
            </div>
            <ul className="space-y-2 text-sm">
              <li>✓ 10 GB Storage</li>
              <li>✓ 5 Team Members</li>
              <li>✓ Basic Support</li>
            </ul>
            <BillingButton
              productId="starter_product_id"
              label="Subscribe"
              variant="bordered"
            />
          </div>

          <div className="border-2 border-[#FF6B2C] rounded-lg p-6 space-y-4 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B2C] text-white text-xs px-3 py-1 rounded-full">
              Popular
            </span>
            <div>
              <h3 className="font-mono font-semibold text-lg">Pro</h3>
              <p className="text-2xl font-bold font-mono mt-2">$99<span className="text-sm text-muted-foreground">/month</span></p>
            </div>
            <ul className="space-y-2 text-sm">
              <li>✓ 100 GB Storage</li>
              <li>✓ 20 Team Members</li>
              <li>✓ Priority Support</li>
              <li>✓ Advanced Analytics</li>
            </ul>
            <BillingButton
              productId="pro_product_id"
              label="Subscribe"
              color="primary"
            />
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-mono font-semibold text-lg">Enterprise</h3>
              <p className="text-2xl font-bold font-mono mt-2">$299<span className="text-sm text-muted-foreground">/month</span></p>
            </div>
            <ul className="space-y-2 text-sm">
              <li>✓ Unlimited Storage</li>
              <li>✓ Unlimited Team Members</li>
              <li>✓ 24/7 Support</li>
              <li>✓ Custom Integrations</li>
            </ul>
            <BillingButton
              productId="enterprise_product_id"
              label="Subscribe"
              variant="bordered"
            />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-2">Need Help?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Use the Customer Portal to manage your subscription, update payment methods, and view invoice history.
        </p>
        <CustomerPortalButton label="Open Customer Portal" variant="flat" />
      </div>
    </div>
  );
}
