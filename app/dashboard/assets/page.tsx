export default function AssetsPage() {
  const assets = [
    { id: 1, name: "Server Cluster A", type: "Infrastructure", value: "$45,000", status: "Operational" },
    { id: 2, name: "Database Primary", type: "Database", value: "$28,000", status: "Operational" },
    { id: 3, name: "CDN Network", type: "Network", value: "$15,000", status: "Operational" },
    { id: 4, name: "Backup Storage", type: "Storage", value: "$12,000", status: "Maintenance" },
    { id: 5, name: "Load Balancer", type: "Infrastructure", value: "$8,500", status: "Operational" },
    { id: 6, name: "API Gateway", type: "Software", value: "$6,200", status: "Operational" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Assets</h1>
        <p className="text-muted-foreground mt-2">Track and manage your digital assets</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-mono text-sm">Asset Name</th>
              <th className="text-left p-4 font-mono text-sm">Type</th>
              <th className="text-left p-4 font-mono text-sm">Value</th>
              <th className="text-left p-4 font-mono text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t hover:bg-muted/50">
                <td className="p-4 font-medium">{asset.name}</td>
                <td className="p-4 text-muted-foreground">{asset.type}</td>
                <td className="p-4 font-mono">{asset.value}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded ${asset.status === "Operational" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {asset.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
