import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { getPlanByCreemProductId } from "@/config/pricing";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.type;

    console.log("Creem webhook received:", event, body);

    switch (event) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.renewed":
        await handleSubscriptionActive(body.data);
        break;

      case "subscription.cancelled":
      case "subscription.expired":
        await handleSubscriptionInactive(body.data);
        break;

      case "payment.succeeded":
        await handlePaymentSucceeded(body.data);
        break;

      case "payment.failed":
        await handlePaymentFailed(body.data);
        break;

      default:
        console.log("Unhandled webhook event:", event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleSubscriptionActive(data: any) {
  const { customer, product, subscription } = data;
  
  // Find the plan based on product ID
  const plan = getPlanByCreemProductId(product.id);
  
  if (!plan) {
    console.error("Unknown product ID:", product.id);
    return;
  }

  // Update user's subscription plan
  await prisma.user.updateMany({
    where: { email: customer.email },
    data: {
      subscriptionPlan: plan.id,
      subscriptionStatus: "active",
      creemCustomerId: customer.id,
    },
  });

  console.log(`✅ Updated user ${customer.email} to ${plan.name} plan`);
}

async function handleSubscriptionInactive(data: any) {
  const { customer } = data;

  // Downgrade to free plan
  await prisma.user.updateMany({
    where: { email: customer.email },
    data: {
      subscriptionPlan: "free",
      subscriptionStatus: "cancelled",
    },
  });

  console.log(`⬇️ Downgraded user ${customer.email} to free plan`);
}

async function handlePaymentSucceeded(data: any) {
  const { customer } = data;
  
  await prisma.user.updateMany({
    where: { email: customer.email },
    data: {
      subscriptionStatus: "active",
    },
  });

  console.log(`💰 Payment succeeded for ${customer.email}`);
}

async function handlePaymentFailed(data: any) {
  const { customer } = data;
  
  await prisma.user.updateMany({
    where: { email: customer.email },
    data: {
      subscriptionStatus: "past_due",
    },
  });

  console.log(`❌ Payment failed for ${customer.email}`);
}
