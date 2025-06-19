import React from 'react';
import { StatusIndicatorProps, ConnectionStatus } from '../types';

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusStyles = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <div className={`w-2 h-2 rounded-full ${getStatusStyles(status)}`} />
      <span className="text-sm text-gray-600">
        {getStatusText(status)}
      </span>
    </>
  );
};

export default StatusIndicator; 