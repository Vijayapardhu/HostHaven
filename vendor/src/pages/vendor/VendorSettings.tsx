import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, CreditCard, Bell, Shield, 
  Save, Loader2, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useVendor } from "@/contexts/VendorContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { vendorService } from "@/lib/vendor";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "bank", label: "Bank", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const VendorSettings = () => {
  const { vendor, refreshVendor } = useVendor();
  const { subscription, subscribe, unsubscribe, requestPermission, isSupported } = usePushNotifications();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [profileData, setProfileData] = useState({
    businessName: "",
    businessAddress: "",
    gstNumber: "",
    panNumber: "",
    aadhaarNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (vendor) {
      setProfileData({
        businessName: vendor.businessName || "",
        businessAddress: vendor.businessAddress || "",
        gstNumber: vendor.gstNumber || "",
        panNumber: vendor.panNumber || "",
        aadhaarNumber: vendor.aadhaarNumber || "",
        bankName: vendor.bankAccount?.bankName || "",
        accountNumber: vendor.bankAccount?.accountNumber || "",
        ifscCode: vendor.bankAccount?.ifscCode || "",
        accountHolderName: vendor.bankAccount?.accountHolderName || "",
      });
    }
  }, [vendor]);

  useEffect(() => {
    if (isSupported) {
      checkPushStatus();
    }
  }, [isSupported, subscription]);

  const checkPushStatus = async () => {
    const permission = await requestPermission();
    if (permission === 'granted' && subscription) {
      setPushEnabled(true);
    }
  };

  const handlePushToggle = async () => {
    if (pushEnabled) {
      await unsubscribe();
      setPushEnabled(false);
      toast({ title: "Push notifications disabled" });
    } else {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        toast({ title: "Permission denied", variant: "destructive" });
        return;
      }
      const success = await subscribe();
      if (success) {
        setPushEnabled(true);
        toast({ title: "Push notifications enabled" });
      } else {
        toast({ title: "Failed to enable push notifications", variant: "destructive" });
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const hasBankDetails = [
        profileData.bankName,
        profileData.accountNumber,
        profileData.ifscCode,
        profileData.accountHolderName,
      ].some((value) => value.trim().length > 0);

      const payload = {
        businessName: profileData.businessName.trim(),
        businessAddress: profileData.businessAddress.trim(),
        gstNumber: profileData.gstNumber.trim() || undefined,
        panNumber: profileData.panNumber.trim() || undefined,
        aadhaarNumber: profileData.aadhaarNumber.trim() || undefined,
        bankAccount: hasBankDetails
          ? {
              bankName: profileData.bankName.trim(),
              accountNumber: profileData.accountNumber.trim(),
              ifscCode: profileData.ifscCode.trim(),
              accountHolderName: profileData.accountHolderName.trim(),
            }
          : undefined,
      };

      await vendorService.updateProfile(payload);
      await refreshVendor();
      toast({ title: "Saved successfully" });
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.message || "Failed to save settings";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast({ title: "Password updated" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background -mx-8 -mt-8 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold mb-10"> Settings</h1>
        
        <div className="flex gap-12">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <nav className="flex flex-col gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center gap-4 px-6 py-4 rounded-2xl text-left text-lg transition-all
                    ${activeSection === section.id 
                      ? "bg-primary text-primary-foreground font-semibold shadow-lg" 
                      : "hover:bg-muted"
                    }
                  `}
                >
                  <section.icon className="w-6 h-6" />
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeSection === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Profile Header */}
                  <div className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold">{vendor?.user?.name}</p>
                      <p className="text-lg text-muted-foreground">{vendor?.user?.email}</p>
                      <p className="text-base text-muted-foreground">{vendor?.user?.phone}</p>
                    </div>
                    <Badge variant={vendor?.isApproved ? "default" : "secondary"} className="text-base px-4 py-1">
                      {vendor?.isApproved ? "Verified" : "Pending"}
                    </Badge>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">Business Name</Label>
                        <Input 
                          value={profileData.businessName}
                          onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                          className="h-14 text-lg"
                        />
                      </div>
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">GST Number</Label>
                        <Input 
                          value={profileData.gstNumber}
                          onChange={(e) => setProfileData({ ...profileData, gstNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15) })}
                          className="h-14 text-lg uppercase"
                          maxLength={15}
                          placeholder="22AAAAA0000A1Z5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-lg text-muted-foreground mb-3 block">Business Address</Label>
                      <Input 
                        value={profileData.businessAddress}
                        onChange={(e) => setProfileData({ ...profileData, businessAddress: e.target.value })}
                        className="h-14 text-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">PAN Number</Label>
                        <Input 
                          value={profileData.panNumber}
                          onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                          className="h-14 text-lg uppercase"
                          maxLength={10}
                          placeholder="AAAAA0000A"
                        />
                      </div>
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">Aadhaar Number</Label>
                        <Input 
                          value={profileData.aadhaarNumber}
                          onChange={(e) => setProfileData({ ...profileData, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                          className="h-14 text-lg"
                          maxLength={12}
                          inputMode="numeric"
                          placeholder="123456789012"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={isLoading} className="h-14 text-lg gap-3 px-8">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    Save Changes
                  </Button>
                </motion.div>
              )}

              {activeSection === "bank" && (
                <motion.div
                  key="bank"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h2 className="text-2xl font-bold">Bank Details</h2>
                  
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50 to-blue-50 border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">Payout Account</p>
                        <p className="text-muted-foreground">
                          {profileData.bankName ? `${profileData.bankName} •••• ${profileData.accountNumber?.slice(-4)}` : "No bank added"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">Bank Name</Label>
                        <Input 
                          value={profileData.bankName}
                          onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                          className="h-14 text-lg"
                          placeholder="State Bank of India"
                        />
                      </div>
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">Account Holder Name</Label>
                        <Input 
                          value={profileData.accountHolderName}
                          onChange={(e) => setProfileData({ ...profileData, accountHolderName: e.target.value })}
                          className="h-14 text-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">Account Number</Label>
                        <Input 
                          type="password"
                          value={profileData.accountNumber}
                          onChange={(e) => setProfileData({ ...profileData, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                          className="h-14 text-lg"
                          maxLength={18}
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">IFSC Code</Label>
                        <Input 
                          value={profileData.ifscCode}
                          onChange={(e) => setProfileData({ ...profileData, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
                          className="h-14 text-lg uppercase"
                          maxLength={11}
                          placeholder="SBIN0001234"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={isLoading} className="h-14 text-lg gap-3 px-8">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    Save Bank Details
                  </Button>
                </motion.div>
              )}

              {activeSection === "notifications" && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold">Notifications</h2>
                  
                  <div className="space-y-4">
                    {[
                      { id: "push", label: "Push Notifications", sub: "Receive browser notifications", checked: pushEnabled, onChange: handlePushToggle, disabled: !isSupported },
                      { id: "booking", label: "New Bookings", sub: "When a guest books a room", checked: true, onChange: () => {} },
                      { id: "checkin", label: "Check-ins", sub: "Guest arrival alerts", checked: true, onChange: () => {} },
                      { id: "payment", label: "Payments", sub: "Payment received notifications", checked: true, onChange: () => {} },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-6 rounded-2xl border bg-card">
                        <div>
                          <p className="text-xl font-medium">{item.label}</p>
                          <p className="text-lg text-muted-foreground">{item.sub}</p>
                        </div>
                        <Switch 
                          checked={item.checked}
                          onCheckedChange={item.onChange}
                          disabled={item.disabled}
                          className="w-14 h-8"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSection === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h2 className="text-2xl font-bold">Security</h2>
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-xl">
                    <div>
                      <Label className="text-lg text-muted-foreground mb-3 block">Current Password</Label>
                      <div className="relative">
                        <Input 
                          type={showPasswords ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="h-14 text-lg pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          {showPasswords ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">New Password</Label>
                        <Input 
                          type={showPasswords ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="h-14 text-lg"
                        />
                      </div>
                      <div>
                        <Label className="text-lg text-muted-foreground mb-3 block">Confirm Password</Label>
                        <Input 
                          type={showPasswords ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="h-14 text-lg"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="h-14 text-lg gap-3 px-8">
                      {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                      Update Password
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSettings;
