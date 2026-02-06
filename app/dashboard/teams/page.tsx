export default function TeamsPage() {
  const teams = [
    { id: 1, name: "Engineering", members: 24, lead: "Sarah Johnson", projects: 8 },
    { id: 2, name: "Design", members: 12, lead: "Mike Chen", projects: 5 },
    { id: 3, name: "Marketing", members: 8, lead: "Emily Davis", projects: 12 },
    { id: 4, name: "Sales", members: 15, lead: "John Smith", projects: 20 },
  ];

  const members = [
    { id: 1, name: "Sarah Johnson", role: "Engineering Lead", email: "sarah@dysumcorp.com", status: "Active" },
    { id: 2, name: "Mike Chen", role: "Design Lead", email: "mike@dysumcorp.com", status: "Active" },
    { id: 3, name: "Emily Davis", role: "Marketing Lead", email: "emily@dysumcorp.com", status: "Active" },
    { id: 4, name: "John Smith", role: "Sales Lead", email: "john@dysumcorp.com", status: "Active" },
    { id: 5, name: "Alex Turner", role: "Developer", email: "alex@dysumcorp.com", status: "Away" },
    { id: 6, name: "Lisa Wang", role: "Designer", email: "lisa@dysumcorp.com", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Teams</h1>
        <p className="text-muted-foreground mt-2">Manage your teams and members</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {teams.map((team) => (
          <div key={team.id} className="border rounded-lg p-6 hover:border-[#FF6B2C] transition-colors">
            <h3 className="font-mono font-semibold text-lg mb-4">{team.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-mono font-medium">{team.members}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projects</span>
                <span className="font-mono font-medium">{team.projects}</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-xs">Team Lead</p>
                <p className="font-mono font-medium">{team.lead}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Team Members</h2>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-[#FF6B2C] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center">
                  <span className="text-[#FF6B2C] font-mono font-bold">{member.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-mono font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground hidden md:block">{member.email}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  member.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
