export default function SupportPage() {
  const tickets = [
    { id: "TICK-1234", subject: "Login issues on mobile app", status: "Open", priority: "High", created: "2 hours ago" },
    { id: "TICK-1233", subject: "Feature request: Dark mode", status: "In Progress", priority: "Medium", created: "1 day ago" },
    { id: "TICK-1232", subject: "Billing question", status: "Resolved", priority: "Low", created: "3 days ago" },
    { id: "TICK-1231", subject: "API integration help", status: "Resolved", priority: "Medium", created: "5 days ago" },
  ];

  const resources = [
    { title: "Getting Started Guide", description: "Learn the basics of using the platform", link: "#" },
    { title: "API Documentation", description: "Complete API reference and examples", link: "#" },
    { title: "Video Tutorials", description: "Step-by-step video guides", link: "#" },
    { title: "Community Forum", description: "Connect with other users", link: "#" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Support</h1>
        <p className="text-muted-foreground mt-2">Get help and manage support tickets</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="border rounded-lg p-6 text-center">
          <p className="text-3xl font-bold font-mono text-[#FF6B2C]">2</p>
          <p className="text-sm text-muted-foreground mt-2">Open Tickets</p>
        </div>
        <div className="border rounded-lg p-6 text-center">
          <p className="text-3xl font-bold font-mono">4.5h</p>
          <p className="text-sm text-muted-foreground mt-2">Avg Response Time</p>
        </div>
        <div className="border rounded-lg p-6 text-center">
          <p className="text-3xl font-bold font-mono">98%</p>
          <p className="text-sm text-muted-foreground mt-2">Satisfaction Rate</p>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Your Tickets</h2>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="border rounded-lg p-4 hover:border-[#FF6B2C] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono font-medium">{ticket.id}</p>
                  <p className="text-sm mt-1">{ticket.subject}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  ticket.status === "Open" ? "bg-blue-100 text-blue-700" :
                  ticket.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {ticket.status}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Priority: <span className={ticket.priority === "High" ? "text-red-600" : ""}>{ticket.priority}</span></span>
                <span>Created {ticket.created}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Help Resources</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((resource, index) => (
            <div key={index} className="border rounded-lg p-4 hover:border-[#FF6B2C] transition-colors cursor-pointer">
              <h3 className="font-mono font-medium mb-2">{resource.title}</h3>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
