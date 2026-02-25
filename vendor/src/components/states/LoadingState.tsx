interface LoadingStateProps {
  message?: string;
  className?: string;
}

const LoadingState = ({ message = "Loading...", className = "py-12" }: LoadingStateProps) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-muted-foreground mt-3">{message}</p>
    </div>
  );
};

export default LoadingState;
