"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  PieChart,
  Search,
  ChevronRight,
  X,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  Mail,
  Copy,
  Check,
} from "lucide-react";

interface Client {
  name: string;
  email: string;
  totalFiles: number;
  totalSize: string;
  lastUpload: string;
  portals: string[];
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  storageUrl: string;
  uploadedAt: string;
  downloads: number;
  passwordHash?: string | null;
  expiresAt?: string | null;
  portal: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFiles, setClientFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const tabs = [
    {
      id: "directory",
      name: "Directory",
      icon: Users,
      description: "All clients and their history",
    },
    {
      id: "activity",
      name: "Recent Activity",
      icon: Activity,
      description: "Latest uploads across all clients",
    },
    {
      id: "stats",
      name: "Insights",
      icon: PieChart,
      description: "Client growth and portal usage",
    },
  ];

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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
      return "📽️";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("archive")
    )
      return "📦";
    return "📎";
  };

  const handleClientClick = async (client: Client) => {
    setSelectedClient(client);
    setLoadingFiles(true);
    setClientFiles([]);

    // Fetch files for this client
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        // Filter files by client email
        const filtered = data.files.filter(
          (f: FileItem) =>
            f.portal &&
            client.email &&
            f.portal.name.toLowerCase().includes(client.email.toLowerCase()),
        );
        setClientFiles(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch client files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleContactClient = (client: Client) => {
    if (!client.email) return;

    const subject = encodeURIComponent(`Message regarding your uploads`);
    const body = encodeURIComponent(
      `Hi ${client.name || "there"},\n\nI wanted to follow up regarding your recent uploads.\n\nBest regards`,
    );
    const mailtoLink = `mailto:${client.email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPortals = new Set(clients.flatMap((c) => c.portals)).size;

  if (loading) {
    return (
      <div>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Client Directory
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Loading clients...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Client Directory
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Manage your client relationships, track recent file transfers, and
          monitor activity across all your portals.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-card shadow-sm border border-border text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                  <span className="font-medium text-sm">{tab.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="clients-active-indicator"
                      className="ml-auto"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Stats Widget */}
          <div className="mt-8 p-4 bg-muted border border-border rounded-2xl">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Stats
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs text-muted-foreground">
                  Total Clients
                </span>
                <span className="text-sm font-bold text-foreground">
                  {clients.length}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-muted-foreground">
                  Active Portals
                </span>
                <span className="text-sm font-bold text-foreground">
                  {totalPortals}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {tabs.find((t) => t.id === activeTab)?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tabs.find((t) => t.id === activeTab)?.description}
                    </p>
                  </div>

                  {activeTab === "directory" && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Filter clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring transition-all outline-none text-sm text-foreground"
                      />
                    </div>
                  )}
                </div>

                <div className="p-0">
                  {activeTab === "directory" && (
                    <div className="divide-y divide-border">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleClientClick(client)}
                            className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold group-hover:bg-card transition-colors">
                              {client.name?.charAt(0) ||
                                client.email?.charAt(0).toUpperCase() ||
                                "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground truncate">
                                  {client.name || "Unknown Client"}
                                </span>
                                {client.totalFiles > 5 && (
                                  <span className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    Frequent
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {client.email || "No email provided"}
                              </p>
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-1 px-4">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Layers className="w-3.5 h-3.5" />
                                {client.portals.length} Portals
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {client.totalFiles} uploads
                              </div>
                            </div>
                            <div className="p-2 text-muted-foreground group-hover:text-foreground transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-20 px-6">
                          <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                            <Users className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <h4 className="text-foreground font-semibold mb-1">
                            No clients found
                          </h4>
                          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                            We couldn't find any clients matching your search.
                            Try a different term or invite new clients to
                            upload.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div className="divide-y divide-border">
                      {clients
                        .sort(
                          (a, b) =>
                            new Date(b.lastUpload).getTime() -
                            new Date(a.lastUpload).getTime(),
                        )
                        .map((client, idx) => (
                          <div
                            key={idx}
                            className="p-5 flex gap-4 transition-colors hover:bg-muted/30"
                          >
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-xl">
                              📄
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">
                                <span className="font-bold">
                                  {client.name || client.email}
                                </span>{" "}
                                uploaded files
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                {formatDate(client.lastUpload)} ·{" "}
                                {client.totalFiles} files
                              </p>
                            </div>
                            <button
                              onClick={() => handleClientClick(client)}
                              className="text-xs font-bold text-muted-foreground hover:text-foreground underline underline-offset-4"
                            >
                              View
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {activeTab === "stats" && (
                    <div className="p-12 text-center">
                      <div className="p-6 bg-muted rounded-2xl border border-border inline-block mb-6">
                        <PieChart className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Detailed Insights
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                        We are building advanced analytics to help you
                        understand your client engagement better. Check back
                        soon for growth charts and portal performance.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <div className="bg-muted px-6 py-4 rounded-2xl border border-border min-w-[140px]">
                          <p className="text-3xl font-extrabold text-foreground">
                            {clients.length}
                          </p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Total Reach
                          </p>
                        </div>
                        <div className="bg-muted px-6 py-4 rounded-2xl border border-border min-w-[140px]">
                          <p className="text-3xl font-extrabold text-foreground">
                            {clients.reduce((acc, c) => acc + c.totalFiles, 0)}
                          </p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Files Handled
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Client Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="absolute inset-0 bg-background/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-border bg-muted/50 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center text-xl font-bold text-foreground">
                    {selectedClient.name?.charAt(0) ||
                      selectedClient.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground leading-tight">
                      {selectedClient.name || "Unknown Client"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedClient.email || "No email available"}
                      </p>
                      {selectedClient.email && (
                        <button
                          onClick={() => copyToClipboard(selectedClient.email!)}
                          className={`p-1.5 rounded-lg transition-all border ${
                            copiedEmail
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30"
                              : "bg-card text-muted-foreground hover:text-foreground hover:border-border border-border"
                          }`}
                          title="Copy email address"
                        >
                          {copiedEmail ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-muted p-4 rounded-2xl border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Total Files
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {selectedClient.totalFiles}
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-2xl border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Total Data
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formatFileSize(selectedClient.totalSize)}
                    </p>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Shared Documents
                </h4>

                <div className="space-y-2">
                  {loadingFiles ? (
                    <div className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm italic">
                        Retrieving file history...
                      </p>
                    </div>
                  ) : clientFiles.length > 0 ? (
                    clientFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border hover:bg-card transition-colors"
                      >
                        <span className="text-2xl">
                          {getFileIcon(file.mimeType)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(file.uploadedAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
                        No documents found
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        This client hasn't uploaded any files yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-muted border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-6 py-2.5 bg-card border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
                >
                  Close
                </button>
                {selectedClient.email && (
                  <button
                    onClick={() => handleContactClient(selectedClient)}
                    className="px-6 py-2.5 bg-foreground text-background rounded-2xl text-sm font-bold hover:opacity-90 shadow-sm transition-all flex items-center gap-2"
                  >
                    Contact Client <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
