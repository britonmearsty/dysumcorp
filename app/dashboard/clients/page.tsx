"use client";

import { useEffect, useState } from "react";
import { Users, FileText, Upload, Mail, Calendar } from "lucide-react";

interface Client {
  name: string;
  email: string;
  totalFiles: number;
  totalSize: string;
  lastUpload: string;
  portals: string[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = Number(bytes);

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;

    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    if (hours < 48) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold font-mono">CLIENTS</h1>
          <p className="text-muted-foreground font-mono mt-2">
            Loading clients...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold font-mono">CLIENTS</h1>
        <p className="text-muted-foreground font-mono mt-2">
          People who have uploaded files to your portals
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                TOTAL CLIENTS
              </p>
              <p className="text-3xl font-mono font-bold mt-2">
                {clients.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-[#FF6B2C]" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                TOTAL FILES
              </p>
              <p className="text-3xl font-mono font-bold mt-2">
                {clients.reduce((acc, c) => acc + c.totalFiles, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#FF6B2C]" />
            </div>
          </div>
        </div>

        <div className="border border-border bg-background p-6 hover:border-[#FF6B2C]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono text-muted-foreground">
                TOTAL STORAGE
              </p>
              <p className="text-3xl font-mono font-bold mt-2">
                {formatFileSize(
                  clients
                    .reduce((acc, c) => acc + BigInt(c.totalSize), BigInt(0))
                    .toString(),
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#FF6B2C]/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-[#FF6B2C]" />
            </div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="border border-border bg-background p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-mono font-semibold text-lg mb-2">
            NO CLIENTS YET
          </h3>
          <p className="text-muted-foreground font-mono text-sm">
            Clients who upload files to your portals will appear here
          </p>
        </div>
      ) : (
        <div className="border border-border bg-background">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-mono font-bold">CLIENT LIST</h2>
          </div>
          <div className="divide-y divide-border">
            {clients.map((client, index) => (
              <div
                key={index}
                className="p-6 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#FF6B2C]/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#FF6B2C]" />
                      </div>
                      <div>
                        <h3 className="font-mono font-bold text-lg">
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 ml-13">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">
                          FILES UPLOADED
                        </p>
                        <p className="text-lg font-mono font-bold mt-1">
                          {client.totalFiles}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">
                          TOTAL SIZE
                        </p>
                        <p className="text-lg font-mono font-bold mt-1">
                          {formatFileSize(client.totalSize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">
                          PORTALS USED
                        </p>
                        <p className="text-lg font-mono font-bold mt-1">
                          {client.portals.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">
                          LAST UPLOAD
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-mono">
                            {formatDate(client.lastUpload)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {client.portals.length > 0 && (
                      <div className="mt-4 ml-13">
                        <p className="text-xs text-muted-foreground font-mono mb-2">
                          PORTALS:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {client.portals.map((portal, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-[#FF6B2C]/10 text-[#FF6B2C] text-xs font-mono border border-[#FF6B2C]/20"
                            >
                              {portal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
