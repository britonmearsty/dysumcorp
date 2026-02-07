import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth-server";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Profile</h1>
      <div className="rounded-lg border p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-lg">{session.user.name || "Not provided"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg">{session.user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">User ID</label>
            <p className="text-lg font-mono text-sm">{session.user.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Email Verified
            </label>
            <p className="text-lg">
              {session.user.emailVerified ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Account Created
            </label>
            <p className="text-lg">
              {new Date(session.user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
