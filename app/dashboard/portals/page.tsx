export default function PortalsPage() {
  const portals = [
    { id: 1, name: "Customer Portal", status: "Active", users: 1250, lastUpdated: "2 hours ago" },
    { id: 2, name: "Partner Portal", status: "Active", users: 340, lastUpdated: "1 day ago" },
    { id: 3, name: "Vendor Portal", status: "Maintenance", users: 89, lastUpdated: "3 days ago" },
    { id: 4, name: "Admin Portal", status: "Active", users: 45, lastUpdated: "5 hours ago" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Portals</h1>
        <p className="text-muted-foreground mt-2">Manage your portal instances</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portals.map((portal) => (
          <div key={portal.id} className="border rounded-lg p-6 hover:border-[#FF6B2C] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-mono font-semibold text-lg">{portal.name}</h3>
              <span className={`text-xs px-2 py-1 rounded ${portal.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {portal.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-mono font-medium">{portal.users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-mono">{portal.lastUpdated}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
