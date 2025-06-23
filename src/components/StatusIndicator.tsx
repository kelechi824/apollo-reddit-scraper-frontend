import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  apiUrl: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ apiUrl }) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/health`);
        if (response.ok) {
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      } catch (error) {
        setStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [apiUrl]);
  const getStatusStyles = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 shadow-lg shadow-green-500/50';
      case 'disconnected':
        return 'bg-red-500 shadow-lg shadow-red-500/50';
      case 'connecting':
        return 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse';
      default:
        return 'bg-apollo-gray-600 shadow-lg';
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

  const getStatusIcon = (status: ConnectionStatus): React.ReactElement => {
    switch (status) {
      case 'connected':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'disconnected':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'connecting':
        return (
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return (
          <svg className="w-4 h-4 text-apollo-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="status-container">
      <div className={`status-dot ${status}`}></div>
      <span className="status-text">
        {status === 'connected' ? 'Backend Connected' :
         status === 'connecting' ? 'Connecting...' :
         'Backend Offline'}
      </span>
    </div>
  );
};

export default StatusIndicator; 