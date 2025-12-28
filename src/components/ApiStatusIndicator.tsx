import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { apiMonitor } from '@/utils/apiMonitor';

interface ApiStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [health, setHealth] = useState(apiMonitor.getOverallHealth());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(apiMonitor.getOverallHealth());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (health.isHealthy) return 'text-green-500';
    if (health.overallSuccessRate > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (health.isHealthy) return <Wifi className="w-4 h-4" />;
    if (health.overallSuccessRate > 50) return <AlertTriangle className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (health.isHealthy) return 'API Healthy';
    if (health.overallSuccessRate > 50) return 'API Degraded';
    return 'API Issues';
  };

  if (health.totalCalls === 0) {
    return null; // Don't show if no API calls have been made
  }

  return (
    <div 
      className={`relative inline-flex items-center gap-2 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        {showDetails && (
          <span className="text-xs font-medium">
            {getStatusText()}
          </span>
        )}
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
          <div className="space-y-1">
            <div>Success Rate: {health.overallSuccessRate.toFixed(1)}%</div>
            <div>Avg Response: {health.averageResponseTime.toFixed(0)}ms</div>
            <div>Recent Calls: {health.totalCalls}</div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default ApiStatusIndicator;