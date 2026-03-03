import { Link } from "react-router-dom";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const PaymentMethods = () => {
  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-6">Payment Methods</h1>
          
          <div className="bg-card rounded-2xl shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Saved Payment Methods</h2>
            <p className="text-muted-foreground mb-6">
              Your saved payment methods for faster checkout will appear here.
            </p>
            <p className="text-sm text-muted-foreground">
              We support UPI, Cards, and Net Banking during checkout.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentMethods;
