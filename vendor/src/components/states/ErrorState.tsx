import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState = ({
  title = "Something went wrong",
  description = "Please try again.",
  onRetry,
  className = "py-12",
}: ErrorStateProps) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="mb-4 flex justify-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
