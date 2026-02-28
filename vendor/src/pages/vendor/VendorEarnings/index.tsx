import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  Banknote,
  Download,
  MinusCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { earningsService } from "@/lib/earnings";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";

const VendorEarningsIndex = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [earnings, setEarnings] = useState<any>(null);
  const [dateRange, setDateRange] = useState("30");
  const [isLoading, setIsLoading] = useState(true);

  const loadEarnings = async () => {
    setIsLoading(true);
    try {
      const data = await earningsService.getEarnings();
      setEarnings(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load earnings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEarnings();
  }, [dateRange]);

  const stats = {
    totalEarnings: earnings?.totalEarnings || earnings?.grossEarnings || 0,
    commission: earnings?.commission || earnings?.commissionDeducted || 0,
    netEarnings:
      earnings?.netEarnings ||
      earnings?.totalEarnings - (earnings?.commission || 0) ||
      0,
    pendingPayout: earnings?.pendingPayout || earnings?.pendingPayouts || 0,
    thisMonth: earnings?.thisMonth || earnings?.currentMonthEarnings || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Earnings & Payouts
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your revenue and payouts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/vendor/earnings/payout-history")}
          >
            Payout History
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading earnings..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  ₹{stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <MinusCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  ₹{stats.commission.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Commission Deducted
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  ₹{stats.netEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Net Earnings</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  ₹{stats.pendingPayout.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Pending Payout</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  ₹{stats.thisMonth.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VendorEarningsIndex;
