import { Link } from "react-router-dom";
import { Star, MessageSquare } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const ReviewsPage = () => {
  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-6">My Reviews</h1>
          
          <div className="bg-card rounded-2xl shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Reviews Yet</h2>
            <p className="text-muted-foreground mb-6">
              Reviews you write for temples and properties will appear here.
            </p>
            <Link to="/bookings">
              <Button variant="gold">View Your Bookings</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReviewsPage;
