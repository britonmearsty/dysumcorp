import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardBody } from "@heroui/card";

import { auth } from "@/lib/auth";
import { checkUserSubscription } from "@/lib/auth-server";

export default async function PremiumPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth");
  }

  const status = await checkUserSubscription(session.user.id);

  if (!status.hasAccess) {
    redirect("/dashboard/billing?error=subscription_required");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Premium Content</h1>
        <p className="text-muted-foreground mt-2">
          This page is only accessible to users with an active subscription
        </p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold font-mono mb-2">
              🎉 Welcome Premium User!
            </h2>
            <p className="text-sm text-muted-foreground">
              You have access to all premium features.
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Your Subscription Details:</h3>
            <ul className="space-y-2 text-sm">
              <li>
                Status:{" "}
                <span className="font-mono text-green-600">
                  {status.status}
                </span>
              </li>
              {status.expiresAt && (
                <li>
                  Expires:{" "}
                  <span className="font-mono">
                    {new Date(status.expiresAt).toLocaleDateString()}
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Premium Features:</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Unlimited storage</li>
              <li>✓ Priority support</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Custom integrations</li>
              <li>✓ API access</li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
