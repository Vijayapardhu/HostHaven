export const getUserFriendlyError = (error: any): string => {
  if (!error) return "Something went wrong. Please try again.";
  
  const responseData = error?.response?.data?.error || error?.response?.data;
  
  const message = responseData?.message 
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

export const getFieldErrors = (error: any): Record<string, string> => {
  const responseData = error?.response?.data?.error;
  
  if (!responseData?.details) {
    return {};
  }
  
  const fieldErrors: Record<string, string> = {};
  
  for (const [field, messages] of Object.entries(responseData.details)) {
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field] = messages[0];
    }
  }
  
  return fieldErrors;
};
