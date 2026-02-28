import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote } from "lucide-react";
import { earningsService } from "@/lib/earnings";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";

interface PayoutRecord {
  id: string;
  period?: string;
  amount: number;
  status: string;
  createdAt?: string;
  processedAt?: string;
}

const PayoutHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayouts = async () => {
    setIsLoading(true);
    try {
      const response = await earningsService.getPayouts();
      const payoutList = Array.isArray(response)
        ? response
        : response?.payouts || [];
      setPayouts(payoutList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to load payouts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPayouts();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PROCESSED: {
        label: "Processed",
        className: "bg-green-100 text-green-700",
      },
      PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700" },
      FAILED: { label: "Failed", className: "bg-red-100 text-red-700" },
      COMPLETED: {
        label: "Completed",
        className: "bg-green-100 text-green-700",
      },
    };
    const config = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-700",
    };
    return config;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vendor/earnings")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Payout History
          </h1>
          <p className="text-muted-foreground mt-1">
            Track settled and pending payouts
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading payouts..." />
      ) : payouts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Banknote className="w-12 h-12 text-muted mb-4" />
            <p className="text-muted-foreground">No payouts yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payouts.map((payout) => {
                const statusConfig = getStatusBadge(payout.status);
                return (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {payout.period || `Payout ${payout.id.slice(-6)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.createdAt
                            ? new Date(payout.createdAt).toLocaleDateString()
                            : payout.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₹{payout.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayoutHistory;
