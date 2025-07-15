import React, { useState } from 'react';
import PlaybooksInterface from '../components/PlaybooksInterface';
import PlaybookGenerationModal from '../components/PlaybookGenerationModal';


const PlaybooksPage: React.FC = () => {
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  const [markdownData, setMarkdownData] = useState<string>('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003';

  /**
   * Handle playbook generation trigger
   * Why this matters: Opens the modal with the processed job title and markdown data.
   */
  const handlePlaybookGenerate = (jobTitle: string, markdown: string) => {
    setSelectedJobTitle(jobTitle);
    setMarkdownData(markdown);
    setShowPlaybookModal(true);
  };

  /**
   * Handle modal close
   * Why this matters: Closes the modal and resets the data.
   */
  const handleModalClose = () => {
    setShowPlaybookModal(false);
    setSelectedJobTitle('');
    setMarkdownData('');
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

      {/* Playbook Generation Modal */}
      {showPlaybookModal && (
        <PlaybookGenerationModal
          isOpen={showPlaybookModal}
          onClose={handleModalClose}
          jobTitle={selectedJobTitle}
          markdownData={markdownData}
        />
      )}
    </div>
  );
};

export default PlaybooksPage; 