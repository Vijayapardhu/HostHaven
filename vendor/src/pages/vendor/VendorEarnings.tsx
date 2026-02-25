import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Payout {
  id: string;
  amount: number;
  status: string;
  bookingIds: string[];
  periodStart: string;
  periodEnd: string;
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
}

const VendorEarnings = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, [dateRange]);

  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      setPayouts([]);
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    toast({ title: "Export started", description: "Your earnings report will be ready shortly" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle className="w-3 h-3" />Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 gap-1"><RefreshCw className="w-3 h-3" />Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const stats = {
    totalEarnings: 125000,
    thisMonth: 45000,
    pendingPayouts: 15000,
    commission: 12500,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Earnings & Payouts</h1>
          <p className="text-muted-foreground mt-1">Track your revenue and payouts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/vendor/earnings/payout-history")}>Payout History</Button>
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
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />+15%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">₹{stats.totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />+8%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">₹{stats.thisMonth.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">₹{stats.pendingPayouts.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Pending Payouts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">₹{stats.commission.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Commission (10%)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="h-20 bg-muted rounded animate-pulse"></div>))}</div>
              ) : payouts.length > 0 ? (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Banknote className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">₹{payout.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payout.periodStart).toLocaleDateString()} - {new Date(payout.periodEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {payout.transactionId && (
                          <p className="text-sm text-muted-foreground font-mono">{payout.transactionId}</p>
                        )}
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted-foreground">No payouts yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Payouts will appear here after bookings are completed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Bank Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium"> State Bank of India</p>
                <p className="text-sm text-muted-foreground mt-1">Account: ****4567</p>
                <p className="text-sm text-muted-foreground">IFSC: SBIN0001234</p>
              </div>
              <Button variant="outline" className="w-full">Update Bank Details</Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Payout Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium">Weekly</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Minimum Payout</span>
                <span className="font-medium">₹1,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission Rate</span>
                <span className="font-medium">10%</span>
              </div>
              <Button variant="outline" className="w-full mt-4">Request Payout</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorEarnings;
