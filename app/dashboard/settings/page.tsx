export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Profile Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Full Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg bg-background"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <input 
              type="email" 
              className="w-full p-2 border rounded-lg bg-background"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Company</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg bg-background"
              placeholder="Dysumcorp"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive push notifications on your devices</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Reports</p>
              <p className="text-sm text-muted-foreground">Get weekly summary of your activity</p>
            </div>
            <input type="checkbox" className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-mono font-semibold text-xl mb-4">Security</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Current Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded-lg bg-background"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">New Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded-lg bg-background"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
            <input 
              type="password" 
              className="w-full p-2 border rounded-lg bg-background"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 border-red-200">
        <h2 className="font-mono font-semibold text-xl mb-4 text-red-600">Danger Zone</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
