import React from 'react';
import PlaybooksInterface from '../components/PlaybooksInterface';


const PlaybooksPage: React.FC = () => {

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';

  /**
   * Handle playbook generation trigger - Temporarily disabled
   * Why this matters: Placeholder for future modal integration.
   */
  const handlePlaybookGenerate = (jobTitle: string, markdown: string) => {
    // TODO: Re-enable when PlaybookGenerationModal is available
    console.log('Playbook generation requested for:', jobTitle);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Playbooks Creator
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Playbook Interface */}
          <PlaybooksInterface
            apiUrl={apiUrl}
            onPlaybookGenerate={handlePlaybookGenerate}
          />
        </div>
      </div>

      {/* Playbook Generation Modal - Temporarily removed */}
    </div>
  );
};

export default PlaybooksPage; 