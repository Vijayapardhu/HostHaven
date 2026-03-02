import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt?: string;
}

interface EarningsSummary {
  totalRevenue: number;
  pendingCommissions: { amount: number; commissionAmount: number; count: number };
  paidCommissions: { amount: number; commissionAmount: number; count: number };
  completedPayouts: { amount: number; count: number };
  pendingPayouts: { amount: number; count: number };
  recentPayouts: Payout[];
}

const VendorEarnings = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const [summaryData, payoutsData] = await Promise.all([
        api.get<EarningsSummary>("/vendor/earnings/summary"),
        api.get<{ payouts: Payout[] }>("/vendor/earnings/payouts"),
      ]);
      setSummary(summaryData);
      const payoutsList = (payoutsData as any)?.payouts ?? payoutsData;
      setPayouts(Array.isArray(payoutsList) ? payoutsList : []);
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground mt-1">Track your revenue and payouts</p>
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
              <p className="text-3xl font-bold">₹{(summary?.totalRevenue ?? 0).toLocaleString()}</p>
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
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">₹{(summary?.paidCommissions?.amount ?? 0).toLocaleString()}</p>
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
              <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                <Calendar className="w-4 h-4" />Pending
              </span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">₹{(summary?.pendingPayouts?.amount ?? 0).toLocaleString()}</p>
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
              <p className="text-3xl font-bold">₹{(summary?.pendingCommissions?.commissionAmount ?? 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Commission ({summary?.pendingCommissions?.count ?? 0} bookings)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map((i) => (<div key={i} className="h-16 bg-muted rounded animate-pulse"></div>))}</div>
          ) : payouts.length > 0 ? (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">₹{payout.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{new Date(payout.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={payout.status === "COMPLETED" ? "default" : "secondary"}>{payout.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground">No payouts yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorEarnings;
