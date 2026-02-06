"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, UserPlus, X } from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  members: TeamMember[];
  _count: {
    members: number;
  };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      alert("Please enter a team name");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgrade) {
          alert(`${data.error}\n\nPlease upgrade your plan to add more team members.`);
        } else {
          alert(data.error || "Failed to create team");
        }
        return;
      }

      setTeams([...teams, data.team]);
      setNewTeamName("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create team:", error);
      alert("Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTeams(teams.filter((t) => t.id !== id));
      } else {
        alert("Failed to delete team");
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
      alert("Failed to delete team");
    } finally {
      setDeleting(null);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !selectedTeam) {
      alert("Please enter a member email");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgrade) {
          alert(`${data.error}\n\nPlease upgrade your plan to add more team members.`);
        } else {
          alert(data.error || "Failed to add member");
        }
        return;
      }

      // Refresh teams
      await fetchTeams();
      setNewMemberEmail("");
      setShowAddMemberModal(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to add member:", error);
      alert("Failed to add member");
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (response.ok) {
        await fetchTeams();
      } else {
        alert("Failed to remove member");
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-mono">Teams</h1>
          <p className="text-muted-foreground mt-2">Loading your teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Teams</h1>
          <p className="text-muted-foreground mt-2">Manage your teams and members</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
        >
          <Plus className="w-4 h-4 mr-2" />
          CREATE TEAM
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <h3 className="font-mono font-semibold text-lg mb-2">No teams yet</h3>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Create your first team to start collaborating
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
          >
            <Plus className="w-4 h-4 mr-2" />
            CREATE YOUR FIRST TEAM
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="border rounded-lg p-6 hover:border-[#FF6B2C] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-mono font-semibold text-lg">{team.name}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none font-mono text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    disabled={deleting === team.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-mono font-medium">{team._count.members + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-mono">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-none font-mono"
                  onClick={() => {
                    setSelectedTeam(team);
                    setShowAddMemberModal(true);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  ADD MEMBER
                </Button>
              </div>
            ))}
          </div>

          {/* All Team Members */}
          <div className="border rounded-lg p-6">
            <h2 className="font-mono font-semibold text-xl mb-4">All Team Members</h2>
            <div className="space-y-3">
              {teams.flatMap((team) =>
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-[#FF6B2C] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center">
                        <span className="text-[#FF6B2C] font-mono font-bold">
                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-mono font-medium">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-muted-foreground hidden md:block">
                        {member.user.email}
                      </p>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {team.name}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-none font-mono text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveMember(team.id, member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {teams.every((t) => t.members.length === 0) && (
                <p className="text-center text-muted-foreground font-mono text-sm py-8">
                  No team members yet. Add members to your teams to start collaborating.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-semibold text-xl">Create New Team</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName" className="font-mono">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="e.g., Engineering Team"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="rounded-none font-mono mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-none font-mono"
                  onClick={() => setShowCreateModal(false)}
                >
                  CANCEL
                </Button>
                <Button
                  className="flex-1 rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
                  onClick={handleCreateTeam}
                  disabled={creating}
                >
                  {creating ? "CREATING..." : "CREATE"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-semibold text-xl">
                Add Member to {selectedTeam.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedTeam(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="memberEmail" className="font-mono">Member Email</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  placeholder="e.g., john@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="rounded-none font-mono mt-2"
                />
                <p className="text-xs text-muted-foreground font-mono mt-2">
                  The user must have an account to be added to the team
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-none font-mono"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedTeam(null);
                  }}
                >
                  CANCEL
                </Button>
                <Button
                  className="flex-1 rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
                  onClick={handleAddMember}
                  disabled={creating}
                >
                  {creating ? "ADDING..." : "ADD MEMBER"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
