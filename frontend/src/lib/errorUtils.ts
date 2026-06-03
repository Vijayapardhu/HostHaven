export const getUserFriendlyError = (error: any): string => {
  if (!error) return "Something went wrong. Please try again.";
  
  const message = error?.response?.data?.error?.message 
    || error?.response?.data?.message 
    || error?.message 
    || error?.error?.message
    || "";
  
  if (!message) return "Something went wrong. Please try again.";
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "Please check your internet connection and try again.";
  }
  
  if (lowerMessage.includes("timeout")) {
    return "The request took too long. Please try again.";
  }
  
  if (lowerMessage.includes("unauthorized") || lowerMessage.includes("invalid credentials")) {
    return "Your session has expired. Please login again.";
  }
  
  if (lowerMessage.includes("not found") || lowerMessage.includes("does not exist")) {
    return "The requested item could not be found.";
  }
  
  if (lowerMessage.includes("already exists") || lowerMessage.includes("duplicate")) {
    return "This item already exists. Please use a different one.";
  }
  
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return "Please check your input and try again.";
  }
  
  if (lowerMessage.includes("permission") || lowerMessage.includes("forbidden") || lowerMessage.includes("access")) {
    return "You don't have permission to perform this action.";
  }
  
  if (lowerMessage.includes("server") || lowerMessage.includes("internal")) {
    return "We're experiencing some technical difficulties. Please try again later.";
  }
  
  if (lowerMessage.length > 100) {
    return "Something went wrong. Please try again.";
  }
  
  return message;
};
