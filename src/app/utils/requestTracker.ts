
class RequestTracker {
  private static instance: RequestTracker;
  private requests: number[] = [];
  private latencies: number[] = [];
  private successCount: number = 0;
  private errorCount: number = 0;

  private constructor() {
    // Periodically clean up old data (older than 1 hour)
    setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      this.requests = this.requests.filter(timestamp => timestamp > oneHourAgo);
      // We don't really need to filter latencies unless we store timestamps with them
    }, 60000);
  }

  public static getInstance(): RequestTracker {
    if (!RequestTracker.instance) {
      RequestTracker.instance = new RequestTracker();
    }
    return RequestTracker.instance;
  }

  public recordRequest(): void {
    this.requests.push(Date.now());
  }

  public recordResponse(duration: number, success: boolean): void {
    this.latencies.push(duration);
    if (this.latencies.length > 100) this.latencies.shift(); // Keep last 100
    if (success) this.successCount++;
    else this.errorCount++;
  }

  public getHitsPerMinute(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    return this.requests.filter(timestamp => timestamp > oneMinuteAgo).length;
  }

  public getHitsPerHour(): number {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    return this.requests.filter(timestamp => timestamp > oneHourAgo).length;
  }

  public getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencies.length);
  }

  public getHealthStats(): { success: number; errors: number; rate: string } {
    const total = this.successCount + this.errorCount;
    const rate = total === 0 ? "100.00" : ((this.successCount / total) * 100).toFixed(2);
    return { success: this.successCount, errors: this.errorCount, rate };
  }
}

export const requestTracker = RequestTracker.getInstance();
