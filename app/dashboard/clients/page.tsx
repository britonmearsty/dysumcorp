export default function ClientsPage() {
  const clients = [
    {
      id: 1,
      name: "Acme Corporation",
      email: "contact@acme.com",
      plan: "Enterprise",
      revenue: "$12,500",
      status: "Active",
    },
    {
      id: 2,
      name: "TechStart Inc",
      email: "hello@techstart.io",
      plan: "Professional",
      revenue: "$5,200",
      status: "Active",
    },
    {
      id: 3,
      name: "Global Solutions",
      email: "info@globalsol.com",
      plan: "Enterprise",
      revenue: "$18,900",
      status: "Active",
    },
    {
      id: 4,
      name: "Digital Ventures",
      email: "team@digitalv.com",
      plan: "Starter",
      revenue: "$1,800",
      status: "Trial",
    },
    {
      id: 5,
      name: "Innovation Labs",
      email: "contact@innolabs.com",
      plan: "Professional",
      revenue: "$7,400",
      status: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Clients</h1>
        <p className="text-muted-foreground mt-2">
          Manage your client relationships
        </p>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="border rounded-lg p-6 hover:border-[#FF6B2C] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-mono font-semibold text-lg">
                  {client.name}
                </h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${client.status === "Active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
              >
                {client.status}
              </span>
            </div>
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Plan: </span>
                <span className="font-mono font-medium">{client.plan}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Revenue: </span>
                <span className="font-mono font-medium text-[#FF6B2C]">
                  {client.revenue}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
