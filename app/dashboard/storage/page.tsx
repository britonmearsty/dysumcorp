export default function StoragePage() {
  const storageData = [
    { id: 1, name: "Documents", used: "45.2 GB", total: "100 GB", percentage: 45, files: 1250 },
    { id: 2, name: "Media Files", used: "128.5 GB", total: "200 GB", percentage: 64, files: 3420 },
    { id: 3, name: "Backups", used: "89.3 GB", total: "150 GB", percentage: 60, files: 89 },
    { id: 4, name: "Database", used: "234.7 GB", total: "500 GB", percentage: 47, files: 1 },
  ];

  const totalUsed = storageData.reduce((acc, item) => acc + parseFloat(item.used), 0);
  const totalCapacity = storageData.reduce((acc, item) => acc + parseFloat(item.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Storage</h1>
        <p className="text-muted-foreground mt-2">Monitor your storage usage</p>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Total Storage</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-mono font-medium">{totalUsed.toFixed(1)} GB / {totalCapacity} GB</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-[#FF6B2C] h-3 rounded-full transition-all"
              style={{ width: `${(totalUsed / totalCapacity) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {storageData.map((storage) => (
          <div key={storage.id} className="border rounded-lg p-6">
            <h3 className="font-mono font-semibold text-lg mb-4">{storage.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-mono">{storage.used} / {storage.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-[#FF6B2C] h-2 rounded-full transition-all"
                  style={{ width: `${storage.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Files</span>
                <span className="font-mono">{storage.files.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
