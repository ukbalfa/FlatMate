export function logError(error: unknown, context?: string) {
  // TODO: replace with Sentry or other monitoring
  const contextStr = `[${context ?? 'App'}]`;

  // Only log full error details in development
  // In production client-side, only log generic context message
  if (process.env.NODE_ENV === 'development') {
    console.error(contextStr, error);
  } else {
    console.error(contextStr);
  }
}
