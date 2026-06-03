export const getFriendlyError = (error: unknown): string => {
  if (!error) return "Something went wrong. Please try again.";
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errorMappings: Record<string, string> = {
    "Invalid credentials": "The email or password you entered is incorrect. Please check and try again.",
    "Invalid email or password": "The email or password you entered is incorrect. Please check and try again.",
    "User not found": "No account found with this email. Please create an account or check your email.",
    "User already exists": "An account with this email already exists. Please login or use a different email.",
    "Email already exists": "An account with this email already exists. Please login or use a different email.",
    "Email already in use": "This email is already registered. Please login or use a different email.",
    "Account already exists": "An account with this email already exists. Please login.",
    "Email not verified": "Please verify your email address first. Check your inbox for the verification link.",
    "Please verify your email": "Please verify your email address first. Check your inbox for the verification link.",
    "Too many requests": "Too many attempts. Please wait a few minutes before trying again.",
    "Network error": "Unable to connect. Please check your internet connection and try again.",
    "Network request failed": "Unable to connect. Please check your internet connection and try again.",
    "Failed to fetch": "Unable to connect. Please check your internet connection and try again.",
    "password must be": "Your password doesn't meet the requirements.",
    "Password too weak": "Your password is too weak. Please use a stronger password.",
    "Invalid token": "Your session has expired. Please login again.",
    "Token expired": "Your session has expired. Please login again.",
    "Unauthorized": "Please login to continue.",
    "Access denied": "You don't have permission to access this resource.",
    "Account is inactive": "Your account has been deactivated. Please contact support for help.",
    "Account is blocked": "Your account has been blocked. Please contact support for help.",
  };

  const lowerError = errorMessage.toLowerCase();
  
  for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
    if (lowerError.includes(key.toLowerCase())) {
      return friendlyMessage;
    }
  }
  
  if (errorMessage.includes("@")) {
    return "Please check your email address and try again.";
  }
  
  if (errorMessage.includes("password") && errorMessage.includes("match")) {
    return "The passwords you entered don't match. Please try again.";
  }
  
  if (errorMessage.includes("password") && errorMessage.length < 50) {
    return "There was an issue with your password. Please check the requirements and try again.";
  }
  
  return "Something went wrong. Please try again later.";
};

export const getFriendlyAuthError = (error: unknown): { title: string; description: string } => {
  if (!error) return { title: "Error", description: "Something went wrong. Please try again." };
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerError = errorMessage.toLowerCase();
  
  if (lowerError.includes("invalid") || lowerError.includes("credentials") || lowerError.includes("password")) {
    return {
      title: "Login failed",
      description: getFriendlyError(error)
    };
  }
  
  if (lowerError.includes("email") && (lowerError.includes("exist") || lowerError.includes("register"))) {
    return {
      title: "Registration failed",
      description: getFriendlyError(error)
    };
  }
  
  if (lowerError.includes("verify") || lowerError.includes("verified")) {
    return {
      title: "Email not verified",
      description: getFriendlyError(error)
    };
  }
  
  if (lowerError.includes("network") || lowerError.includes("fetch") || lowerError.includes("connection")) {
    return {
      title: "Connection error",
      description: getFriendlyError(error)
    };
  }
  
  if (lowerError.includes("timeout")) {
    return {
      title: "Request timed out",
      description: "The server took too long to respond. Please try again."
    };
  }
  
  return {
    title: "Something went wrong",
    description: getFriendlyError(error)
  };
};
