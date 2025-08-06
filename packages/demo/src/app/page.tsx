'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import TriggerApplicationRunModal from './components/TriggerApplicationRunModal';

// Type definition for a Run based on the SDK's RunReadResponse
interface Run {
  application_run_id: string;
  application_version_id: string;
  organization_id: string;
  status: string;
  triggered_at: string;
  triggered_by: string;
}

interface RunsResponse {
  runs: Run[];
  success: boolean;
  error?: string;
}

// Helper function to format the run status with appropriate styling
function getStatusBadge(status: string) {
  const statusConfig = {
    COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
    COMPLETED_WITH_ERROR: {
      label: 'Completed with Errors',
      className: 'bg-yellow-100 text-yellow-800',
    },
    RUNNING: { label: 'Running', className: 'bg-blue-100 text-blue-800' },
    RECEIVED: { label: 'Received', className: 'bg-gray-100 text-gray-800' },
    SCHEDULED: { label: 'Scheduled', className: 'bg-purple-100 text-purple-800' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
    CANCELLED_USER: { label: 'Cancelled (User)', className: 'bg-orange-100 text-orange-800' },
    CANCELLED_SYSTEM: { label: 'Cancelled (System)', className: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// Helper function to format timestamp
function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRuns = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch runs from our server-side API route
      const response = await fetch('/api/runs');
      const data = (await response.json()) as RunsResponse;

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to fetch runs');
      }

      setRuns(data.runs ?? []);
    } catch (err) {
      console.error('Error fetching runs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch runs');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTriggered = () => {
    // Refresh the runs list when a new run is triggered
    void fetchRuns();
  };

  useEffect(() => {
    if (session) {
      void fetchRuns();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-gray-600">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome to Aignostics Platform Demo
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          This demo showcases the Aignostics TypeScript SDK integration with OAuth2.0
          authentication. Sign in to view your application runs and explore the platform
          capabilities.
        </p>
        <button
          onClick={() => void signIn('aignostics')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Sign In with Aignostics
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {session.user?.email}</h2>
          <p className="text-gray-600 mt-1">View your application runs and their results</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            New Application Run
          </button>
          <button
            onClick={() => void signOut()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading application runs:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Application Runs</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select a run to view its results and processing details
          </p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading runs...</span>
              </div>
            </div>
          )}

          {!loading && runs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Application Runs Found</h4>
              <p className="text-gray-600">
                You don't have any application runs yet, or there was an issue loading them.
              </p>
              <button
                onClick={() => void fetchRuns()}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Retry Loading
              </button>
            </div>
          )}

          {!loading && runs.length > 0 && (
            <div className="space-y-4">
              {runs.map(run => (
                <button
                  key={run.application_run_id}
                  className={`w-full border rounded-lg p-4 text-left cursor-pointer transition-colors duration-200 ${
                    selectedRun?.application_run_id === run.application_run_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() =>
                    setSelectedRun(
                      selectedRun?.application_run_id === run.application_run_id ? null : run
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          Run ID: {run.application_run_id}
                        </h4>
                        {getStatusBadge(run.status)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Application Version:</span>{' '}
                          {run.application_version_id}
                        </div>
                        <div>
                          <span className="font-medium">Triggered:</span>{' '}
                          {formatTimestamp(run.triggered_at)}
                        </div>
                        <div>
                          <span className="font-medium">Triggered By:</span> {run.triggered_by}
                        </div>
                        <div>
                          <span className="font-medium">Organization:</span> {run.organization_id}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2">
                      {selectedRun?.application_run_id === run.application_run_id ? (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRun && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Results for Run {selectedRun.application_run_id}
            </h3>
            <div className="flex items-center space-x-4 mt-2">
              {getStatusBadge(selectedRun.status)}
              <span className="text-sm text-gray-500">
                Application Version: {selectedRun.application_version_id}
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Results Visualization</h4>
              <p className="text-gray-600 mb-4">
                Processing results and analysis data for this application run would appear here.
                <br />
                This could include charts, tables, processed images, or other result data.
              </p>
              <div className="mt-4 space-y-1 text-sm text-gray-500">
                <div>Run ID: {selectedRun.application_run_id}</div>
                <div>Status: {selectedRun.status}</div>
                <div>Triggered: {formatTimestamp(selectedRun.triggered_at)}</div>
                <div>Application Version: {selectedRun.application_version_id}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TriggerApplicationRunModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRunTriggered={handleRunTriggered}
      />
    </div>
  );
}
