import { Globe, Moon, Sun, Languages, DollarSign } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    darkMode: false,
    language: "en",
    currency: "INR",
  });

  const handleSave = () => {
    toast({ title: "Settings saved" });
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-6">Settings</h1>
          
          <div className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Moon className="w-4 h-4" /> Appearance
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dark Mode</span>
              <button
                onClick={() => setSettings({...settings, darkMode: !settings.darkMode})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.darkMode ? "bg-primary" : "bg-muted"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.darkMode ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Languages className="w-4 h-4" /> Language & Region
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background"
                >
                  <option value="en">English</option>
                  <option value="te">Telugu</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({...settings, currency: e.target.value})}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background"
                >
                  <option value="INR">₹ INR (India)</option>
                  <option value="USD">$ USD (US)</option>
                </select>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
