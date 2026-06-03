import { useState, useEffect } from "react";
import { 
  User, Save, Loader2, 
  Camera, CheckCircle, Edit3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useVendor } from "@/contexts/VendorContext";
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";

const VendorSettingsProfile = () => {
  const { vendor, refreshVendor } = useVendor();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    gstNumber: "",
    panNumber: "",
    aadhaarNumber: "",
    phone: "",
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        businessName: vendor.businessName || "",
        businessAddress: vendor.businessAddress || "",
        gstNumber: vendor.gstNumber || "",
        panNumber: vendor.panNumber || "",
        aadhaarNumber: vendor.aadhaarNumber || "",
        phone: vendor.user?.phone || "",
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await vendorService.updateProfile(formData);
      await refreshVendor();
      setIsSuccess(true);
      toast({ title: "Profile updated successfully" });
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your business profile details</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={vendor?.isApproved ? "default" : "secondary"}>
                {vendor?.isApproved ? "Verified" : "Pending"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="md:w-1/3">
              <div className="text-center p-6 rounded-2xl bg-muted/30">
                <div className="relative inline-block">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
                    {vendor?.user?.avatar ? (
                      <img src={vendor.user.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mt-4">{vendor?.user?.name}</h3>
                <p className="text-sm text-muted-foreground">{vendor?.user?.email}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Edit3 className="w-3 h-3" />Edit
                  </Button>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="md:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Your hotel name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="9876543210"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="Complete address"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-4">Tax Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST Number</Label>
                      <Input
                        id="gstNumber"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15) })}
                        placeholder="22AAAAA0000A1Z5"
                        className="uppercase"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="panNumber">PAN Number</Label>
                      <Input
                        id="panNumber"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })}
                        placeholder="AAAAA0000A"
                        className="uppercase"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} className="gap-2 min-w-[140px]">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {isLoading ? "Saving..." : isSuccess ? "Saved!" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSettingsProfile;
