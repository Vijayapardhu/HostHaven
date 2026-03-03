import { Shield, Lock, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const Security = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Please fill all password fields", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.auth.changePassword(passwords.current, passwords.new);
      toast({ title: "Password updated successfully" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast({ title: error?.message || "Failed to change password", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-6">Privacy & Security</h1>
          
          <div className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Change Password
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Current password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              />
              <Button onClick={handleChangePassword} className="w-full" disabled={isChangingPassword}>
                {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data
            </p>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Security;
