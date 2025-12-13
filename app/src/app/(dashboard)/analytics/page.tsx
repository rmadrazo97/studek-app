import { redirect } from "next/navigation";

/**
 * Analytics page - Redirects to unified Profile page
 * Analytics functionality has been merged into the Profile page
 */
export default function AnalyticsPage() {
  redirect("/profile");
}
