import { initializeUsageTrackingCron } from "@/lib/usage-tracking";

// Initialize the usage tracking cron job when this module is imported
// This will run when the Next.js server starts
initializeUsageTrackingCron();

export default function Startup() {
  // This component doesn't render anything
  // It's just used to ensure the module is imported and executed
  return null;
}
