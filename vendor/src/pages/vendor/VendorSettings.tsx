import { useState, useEffect } from "react";

import {
  User,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Save,
  Loader2,
  Camera,
  MapPin,
  Phone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendor } from "@/contexts/VendorContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/lib/vendor";

const VendorSettings = () => {
  const { vendor, refreshVendor } = useVendor();
  const {
    subscription,
    subscribe,
    unsubscribe,
    requestPermission,
    isSupported,
  } = usePushNotifications();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const [profileData, setProfileData] = useState({
    businessName: "",
    businessAddress: "",
    phone: "",
    gstNumber: "",
    panNumber: "",
    aadhaarNumber: "",
    passportPhoto: "",
    companyLogo: "",
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
        phone: vendor.phone || "",
        gstNumber: vendor.gstNumber || "",
        panNumber: vendor.panNumber || "",
        aadhaarNumber: vendor.aadhaarNumber || "",
        passportPhoto: vendor.passportPhoto || "",
        companyLogo: vendor.companyLogo || "",
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
    if (permission === "granted" && subscription) {
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
      if (permission !== "granted") {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        return;
      }
      const success = await subscribe();
      if (success) {
        setPushEnabled(true);
        toast({ title: "Push notifications enabled" });
      } else {
        toast({
          title: "Failed to enable push notifications",
          variant: "destructive",
        });
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await vendorService.updateProfile(profileData);
      await refreshVendor();
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await vendorService.updateBankDetails({
        bankName: profileData.bankName,
        accountNumber: profileData.accountNumber,
        ifscCode: profileData.ifscCode,
        accountHolderName: profileData.accountHolderName,
      });
      await refreshVendor();
      toast({ title: "Bank details updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "passportPhoto" | "companyLogo",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const data = await vendorService.uploadImage(
        file,
        field === "passportPhoto"
          ? "hosthaven/vendors/passport"
          : "hosthaven/vendors/logo",
      );
      setProfileData((prev) => ({ ...prev, [field]: data.url }));
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await vendorService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({ title: "Password updated successfully" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Bank Details
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {vendor?.user?.avatar ? (
                      <img
                        src={vendor.user.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                    aria-label="Upload profile picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {vendor?.user?.name}
                  </h3>
                  <p className="text-muted-foreground">{vendor?.user?.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vendor ID: {vendor?.id}
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={vendor?.user?.name || ""}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={vendor?.user?.email || ""}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        className="pl-10"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={profileData.businessName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          businessName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={profileData.gstNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          gstNumber: e.target.value,
                        })
                      }
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={profileData.panNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          panNumber: e.target.value,
                        })
                      }
                      placeholder="AAAAA0000A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                    <Input
                      id="aadhaarNumber"
                      value={profileData.aadhaarNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          aadhaarNumber: e.target.value,
                        })
                      }
                      placeholder="1234 5678 9012"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportPhoto">Passport Photo</Label>
                    <div className="flex items-center gap-4">
                      {profileData.passportPhoto && (
                        <img
                          src={profileData.passportPhoto}
                          alt="Passport"
                          className="w-10 h-10 rounded-full object-cover shrink-0 border"
                        />
                      )}
                      <Input
                        id="passportPhoto"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "passportPhoto")}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyLogo">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {profileData.companyLogo && (
                        <img
                          src={profileData.companyLogo}
                          alt="Logo"
                          className="w-10 h-10 rounded-md object-cover shrink-0 border"
                        />
                      )}
                      <Input
                        id="companyLogo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "companyLogo")}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="businessAddress"
                      className="pl-10"
                      value={profileData.businessAddress}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          businessAddress: e.target.value,
                        })
                      }
                      placeholder="Enter your business address"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Details about your hotel business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="text-lg font-semibold mt-1">
                    {vendor?.businessName || "Not set"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-muted-foreground">GST Number</Label>
                  <p className="text-lg font-semibold mt-1">
                    {vendor?.gstNumber || "Not set"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-muted-foreground">PAN Number</Label>
                  <p className="text-lg font-semibold mt-1">
                    {vendor?.panNumber || "Not set"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-muted-foreground">
                    Commission Rate
                  </Label>
                  <p className="text-lg font-semibold mt-1">
                    {vendor?.commissionRate}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-muted-foreground">
                    Approval Status
                  </Label>
                  <p
                    className={`text-lg font-semibold mt-1 ${vendor?.isApproved ? "text-green-600" : "text-amber-600"}`}
                  >
                    {vendor?.isApproved ? "Approved" : "Pending Approval"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Label className="text-muted-foreground">Approved On</Label>
                  <p className="text-lg font-semibold mt-1">
                    {vendor?.approvedAt
                      ? new Date(vendor.approvedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>
                Your payout will be transferred to this account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankDetailsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={profileData.bankName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bankName: e.target.value,
                        })
                      }
                      placeholder="State Bank of India"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolderName">
                      Account Holder Name
                    </Label>
                    <Input
                      id="accountHolderName"
                      value={profileData.accountHolderName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          accountHolderName: e.target.value,
                        })
                      }
                      placeholder="As per bank records"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={profileData.accountNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          accountNumber: e.target.value,
                        })
                      }
                      placeholder="1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={profileData.ifscCode}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          ifscCode: e.target.value,
                        })
                      }
                      placeholder="SBIN0001234"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Bank Details
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Push Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      {isSupported
                        ? "Receive instant notifications in your browser"
                        : "Your browser does not support push notifications"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={handlePushToggle}
                  disabled={!isSupported}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">In-App Notifications</h3>
                <div className="space-y-3">
                  {[
                    {
                      id: "booking",
                      label: "New Bookings",
                      description: "Get notified when a guest books a room",
                    },
                    {
                      id: "checkin",
                      label: "Check-ins",
                      description: "Guest check-in notifications",
                    },
                    {
                      id: "checkout",
                      label: "Check-outs",
                      description: "Guest check-out notifications",
                    },
                    {
                      id: "payment",
                      label: "Payments",
                      description: "Payment received notifications",
                    },
                    {
                      id: "review",
                      label: "Reviews",
                      description: "New review notifications",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorSettings;
