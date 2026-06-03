if (import.meta.env.DEV) {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('[Hosthaven]')) {
      originalError(...args);
    } else {
      originalWarn('[Hosthaven] Avoid using console.error directly. Use handleError from errorHandler instead:', ...args);
    }
  };
  
  console.warn = (...args: unknown[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('[Hosthaven]')) {
      originalWarn(...args);
    } else {
      originalWarn('[Hosthaven] Consider using handleError for warnings:', ...args);
    }
  };
}
