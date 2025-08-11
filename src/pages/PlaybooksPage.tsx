import React, { useState } from 'react';
import PlaybooksInterface from '../components/PlaybooksInterface';
import PlaybookGenerationModal from '../components/PlaybookGenerationModal';
import { API_BASE_URL } from '../config/api';

const PlaybooksPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [markdownData, setMarkdownData] = useState('');

  // Use centralized API configuration
  // Why this matters: Ensures all deployments (Netlify, Vercel, local) use the correct backend URL
  const apiUrl = API_BASE_URL;

  /**
   * Handle playbook generation trigger
   * Why this matters: Opens the PlaybookGenerationModal with the processed data to complete the playbook creation workflow.
   */
  const handlePlaybookGenerate = (jobTitle: string, markdown: string) => {
    setSelectedJobTitle(jobTitle);
    setMarkdownData(markdown);
    setIsModalOpen(true);
  };

  /**
   * Handle closing the playbook generation modal
   * Why this matters: Resets modal state when user closes the modal.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlaybooksInterface
          apiUrl={apiUrl}
          onPlaybookGenerate={handlePlaybookGenerate}
        />
      </div>

      {/* Playbook Generation Modal */}
      <PlaybookGenerationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        jobTitle={selectedJobTitle}
        markdownData={markdownData}
      />
    </div>
  );
};

export default PlaybooksPage; 