export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Settings</h1>
        <p className="text-ink/60">Configure your organization and compliance settings</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-xl bg-ocean/10 text-ocean font-medium">
            Organization
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream text-ink/60">
            Compliance Rules
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream text-ink/60">
            Notifications
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream text-ink/60">
            Integrations
          </button>
          <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-cream text-ink/60">
            Billing
          </button>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
            <h2 className="font-display text-xl mb-6">Organization Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Organization Name</label>
                <input
                  type="text"
                  defaultValue="Example AS"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Organization Number</label>
                <input
                  type="text"
                  defaultValue="123456789"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact Email</label>
                <input
                  type="email"
                  defaultValue="contact@example.no"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  defaultValue="Oslo, Norway"
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
            <h2 className="font-display text-xl mb-6">Labor Law Compliance Settings</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Daily Hours</label>
                <input
                  type="number"
                  defaultValue={9}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Weekly Hours</label>
                <input
                  type="number"
                  defaultValue={40}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Min Daily Rest (hours)</label>
                <input
                  type="number"
                  defaultValue={11}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Min Weekly Rest (hours)</label>
                <input
                  type="number"
                  defaultValue={35}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Publish Deadline (days)</label>
                <input
                  type="number"
                  defaultValue={14}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Overtime Premium (%)</label>
                <input
                  type="number"
                  defaultValue={40}
                  className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors">
              Cancel
            </button>
            <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
