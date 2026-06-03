import { useState, useEffect } from "react";
import { 
  Wallet, Save, Loader2, 
  ShieldCheck, CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVendor } from "@/contexts/VendorContext";
import { vendorService } from "@/lib/vendor";
import { useToast } from "@/hooks/use-toast";

const looksMasked = (value?: string) => Boolean(value && /\*/.test(value));

const VendorSettingsBank = () => {
  const { vendor, refreshVendor } = useVendor();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    upiId: "",
  });

  useEffect(() => {
    if (vendor?.bankAccount) {
      setFormData({
        bankName: vendor.bankAccount.bankName || "",
        accountNumber: vendor.bankAccount.accountNumber || "",
        ifscCode: vendor.bankAccount.ifscCode || "",
        accountHolderName: vendor.bankAccount.accountHolderName || "",
        upiId: vendor.bankAccount.upiId || "",
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const bankAccount: Record<string, unknown> = {
        bankName: formData.bankName || undefined,
        accountHolderName: formData.accountHolderName || undefined,
      };

      if (!looksMasked(formData.accountNumber)) {
        bankAccount.accountNumber = formData.accountNumber || undefined;
      }

      if (!looksMasked(formData.ifscCode)) {
        bankAccount.ifscCode = formData.ifscCode || undefined;
      }

      if (!looksMasked(formData.upiId)) {
        bankAccount.upiId = formData.upiId || undefined;
      }

      await vendorService.updateProfile({ bankAccount });
      await refreshVendor();
      setIsSuccess(true);
      toast({ title: "Bank details updated successfully" });
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error: any) {
      toast({ title: "Failed to update bank details", description: error?.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>Manage your payout bank account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Current Status */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Secure Bank Transfer</p>
                <p className="text-sm text-muted-foreground">
                  {vendor?.bankAccount?.bankName 
                    ? `•••• ${vendor.bankAccount.accountNumber?.slice(-4)}` 
                    : "No bank account added"}
                </p>
              </div>
              {vendor?.bankAccount?.bankName && (
                <Badge className="ml-auto bg-green-100 text-green-700">Active</Badge>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., State Bank of India"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="As per bank records"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="password"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                  placeholder="Enter account number"
                  maxLength={18}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) })}
                  placeholder="e.g., SBIN0001234"
                  className="uppercase"
                  maxLength={11}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="vendor@upi"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="gap-2 min-w-[160px]">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isLoading ? "Saving..." : isSuccess ? "Saved!" : "Save Bank Details"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSettingsBank;
