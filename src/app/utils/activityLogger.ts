class ActivityLogger {
  private static instance: ActivityLogger;
  private logs: Array<{
    timestamp: string;
    type: 'API_HIT' | 'CACHE_HIT' | 'CACHE_MISS' | 'CACHE_SET' | 'CACHE_DEL' | 'CACHE_EXPIRE';
    message: string;
  }> = [];

  private constructor() {}

  public static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  public log(
    type: 'API_HIT' | 'CACHE_HIT' | 'CACHE_MISS' | 'CACHE_SET' | 'CACHE_DEL' | 'CACHE_EXPIRE',
    message: string
  ): void {
    const time = new Date().toLocaleTimeString();
    this.logs.unshift({ timestamp: time, type, message });
    if (this.logs.length > 50) {
      this.logs.pop(); // Keep only the last 50 activities
    }
  }

  public getLogs() {
    return this.logs;
  }
}

export const activityLogger = ActivityLogger.getInstance();
