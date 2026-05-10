function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
  } catch {
    return String(obj);
  }
}

export function logError(error: unknown, context?: string) {
  const contextStr = `[${context ?? 'App'}]`;

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(contextStr, error);
  } else {
    console.error(contextStr);
  }

  // Structured Sentry integration (stub)
  if (
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SENTRY_DSN &&
    typeof window !== 'undefined'
  ) {
    // Placeholder for real Sentry integration:
    // Sentry.captureException(error, { extra: { context, ...safeParse(error) } });
    console.debug('[Sentry] Would capture:', contextStr, safeStringify(error));
  }
}
