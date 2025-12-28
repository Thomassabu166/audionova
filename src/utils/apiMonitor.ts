/**
 * API Health Monitoring
 * Tracks API performance and provides health status
 */

interface ApiCall {
  endpoint: string;
  timestamp: number;
  duration: number;
  success: boolean;
  statusCode?: number;
  error?: string;
}

interface ApiHealth {
  endpoint: string;
  successRate: number;
  averageResponseTime: number;
  lastSuccess: number;
  lastFailure: number;
  totalCalls: number;
  recentErrors: string[];
}

class ApiMonitor {
  private calls: ApiCall[] = [];
  private readonly MAX_CALLS_HISTORY = 1000;
  private readonly HEALTH_WINDOW = 5 * 60 * 1000; // 5 minutes

  /**
   * Record an API call
   */
  recordCall(
    endpoint: string,
    duration: number,
    success: boolean,
    statusCode?: number,
    error?: string
  ): void {
    const call: ApiCall = {
      endpoint,
      timestamp: Date.now(),
      duration,
      success,
      statusCode,
      error
    };

    this.calls.push(call);

    // Keep only recent calls
    if (this.calls.length > this.MAX_CALLS_HISTORY) {
      this.calls = this.calls.slice(-this.MAX_CALLS_HISTORY);
    }

    // Log significant issues
    if (!success) {
      console.warn(`[ApiMonitor] ${endpoint} failed:`, { statusCode, error, duration });
    }
  }

  /**
   * Get health status for an endpoint
   */
  getHealth(endpoint: string): ApiHealth {
    const now = Date.now();
    const windowStart = now - this.HEALTH_WINDOW;
    
    const recentCalls = this.calls.filter(
      call => call.endpoint === endpoint && call.timestamp > windowStart
    );

    const successfulCalls = recentCalls.filter(call => call.success);
    const failedCalls = recentCalls.filter(call => !call.success);

    const successRate = recentCalls.length > 0 
      ? (successfulCalls.length / recentCalls.length) * 100 
      : 0;

    const averageResponseTime = recentCalls.length > 0
      ? recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length
      : 0;

    const lastSuccess = successfulCalls.length > 0
      ? Math.max(...successfulCalls.map(call => call.timestamp))
      : 0;

    const lastFailure = failedCalls.length > 0
      ? Math.max(...failedCalls.map(call => call.timestamp))
      : 0;

    const recentErrors = failedCalls
      .slice(-5) // Last 5 errors
      .map(call => call.error || `HTTP ${call.statusCode}`)
      .filter(Boolean);

    return {
      endpoint,
      successRate,
      averageResponseTime,
      lastSuccess,
      lastFailure,
      totalCalls: recentCalls.length,
      recentErrors
    };
  }

  /**
   * Get overall API health summary
   */
  getOverallHealth(): {
    totalCalls: number;
    overallSuccessRate: number;
    averageResponseTime: number;
    endpointHealth: ApiHealth[];
    isHealthy: boolean;
  } {
    const now = Date.now();
    const windowStart = now - this.HEALTH_WINDOW;
    const recentCalls = this.calls.filter(call => call.timestamp > windowStart);

    const endpoints = [...new Set(recentCalls.map(call => call.endpoint))];
    const endpointHealth = endpoints.map(endpoint => this.getHealth(endpoint));

    const successfulCalls = recentCalls.filter(call => call.success);
    const overallSuccessRate = recentCalls.length > 0
      ? (successfulCalls.length / recentCalls.length) * 100
      : 0;

    const averageResponseTime = recentCalls.length > 0
      ? recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length
      : 0;

    // Consider API healthy if success rate > 80% and avg response time < 5s
    const isHealthy = overallSuccessRate > 80 && averageResponseTime < 5000;

    return {
      totalCalls: recentCalls.length,
      overallSuccessRate,
      averageResponseTime,
      endpointHealth,
      isHealthy
    };
  }

  /**
   * Check if an endpoint is currently having issues
   */
  isEndpointHealthy(endpoint: string): boolean {
    const health = this.getHealth(endpoint);
    
    // Consider unhealthy if:
    // - Success rate < 70% in recent calls
    // - No successful calls in last 2 minutes
    // - Average response time > 10 seconds
    const now = Date.now();
    const twoMinutesAgo = now - (2 * 60 * 1000);
    
    return health.successRate >= 70 && 
           health.lastSuccess > twoMinutesAgo && 
           health.averageResponseTime < 10000;
  }

  /**
   * Get recommendations based on current health
   */
  getRecommendations(): string[] {
    const health = this.getOverallHealth();
    const recommendations: string[] = [];

    if (health.overallSuccessRate < 50) {
      recommendations.push('API is experiencing significant issues. Consider using cached data.');
    } else if (health.overallSuccessRate < 80) {
      recommendations.push('API reliability is degraded. Implement retry logic.');
    }

    if (health.averageResponseTime > 5000) {
      recommendations.push('API response times are slow. Consider reducing request frequency.');
    }

    const unhealthyEndpoints = health.endpointHealth.filter(
      ep => ep.successRate < 70
    );

    if (unhealthyEndpoints.length > 0) {
      recommendations.push(
        `Endpoints with issues: ${unhealthyEndpoints.map(ep => ep.endpoint).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Clear all monitoring data
   */
  clear(): void {
    this.calls = [];
  }

  /**
   * Export monitoring data for debugging
   */
  exportData() {
    return {
      calls: this.calls,
      health: this.getOverallHealth(),
      recommendations: this.getRecommendations()
    };
  }
}

// Export singleton instance
export const apiMonitor = new ApiMonitor();

/**
 * Wrapper function to monitor API calls
 */
export async function monitoredApiCall<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;
    
    apiMonitor.recordCall(endpoint, duration, true);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const statusCode = error?.response?.status;
    const errorMessage = error?.message || 'Unknown error';
    
    apiMonitor.recordCall(endpoint, duration, false, statusCode, errorMessage);
    throw error;
  }
}