import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote } from "lucide-react";

const PayoutHistory = () => {
  const navigate = useNavigate();

  const rows = useMemo(
    () => [
      { id: "PH-001", period: "Jan 2026", amount: 18000, status: "Processed" },
      { id: "PH-002", period: "Feb 2026", amount: 21500, status: "Pending" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/earnings")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Payout History</h1>
          <p className="text-muted-foreground mt-1">Track settled and pending payouts</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No payouts yet</div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{row.period}</p>
                      <p className="text-xs text-muted-foreground">{row.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{row.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{row.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutHistory;
