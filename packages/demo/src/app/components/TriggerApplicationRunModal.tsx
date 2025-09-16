'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface TriggerApplicationRunModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onRunTriggered: () => void;
}

interface FormData {
  downloadUrl: string;
  width_px: string;
  height_px: string;
  resolution_mpp: string;
  checksum_base64_crc32c: string;
  media_type: string;
  staining_method: string;
  disease: string;
  tissue: string;
}

interface TriggerRunResponse {
  application_run_id?: string;
  success: boolean;
  error?: string;
}

export default function TriggerApplicationRunModal({
  isOpen,
  onClose,
  onRunTriggered,
}: TriggerApplicationRunModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormData>({
    downloadUrl: '',
    width_px: '1024',
    height_px: '1024',
    resolution_mpp: '0.25',
    checksum_base64_crc32c: '',
    media_type: 'image/tiff',
    staining_method: 'H&E',
    disease: 'LUNG_CANCER',
    tissue: 'LUNG',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Define tissue options for each cancer type
  const tissueOptions: Record<string, string[]> = {
    LUNG_CANCER: ['LUNG', 'LYMPH_NODE', 'LIVER', 'ADRENAL_GLAND', 'BONE', 'BRAIN'],
    LIVER_CANCER: ['LIVER', 'LYMPH_NODE', 'LUNG', 'BONE'],
    BREAST_CANCER: ['BREAST', 'LYMPH_NODE', 'BONE', 'LUNG', 'BRAIN', 'LIVER'],
    BLADDER_CANCER: ['BLADDER', 'LYMPH_NODE', 'BONE', 'LUNG', 'LIVER'],
    COLORECTAL_CANCER: ['COLON', 'LYMPH_NODE', 'LIVER', 'LUNG'],
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value,
      };

      // If disease changes, reset tissue to first available option
      if (name === 'disease' && tissueOptions[value] && tissueOptions[value].length > 0) {
        newFormData.tissue = tissueOptions[value][0]!;
      }

      return newFormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!session?.accessToken) {
      setError('No authentication token available');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare the input artifacts according to the new schema
      const inputArtifacts = [
        {
          name: 'user_slide',
          mime_type: 'image/tiff',
          download_url: formData.downloadUrl,
          metadata: {
            media_type: formData.media_type,
            checksum_base64_crc32c: formData.checksum_base64_crc32c,
            specimen: {
              disease: formData.disease,
              tissue: formData.tissue,
            },
            resolution_mpp: parseFloat(formData.resolution_mpp),
            width_px: parseInt(formData.width_px, 10),
            height_px: parseInt(formData.height_px, 10),
            staining_method: formData.staining_method,
          },
        },
      ];

      const response = await fetch('/api/application-runs/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: 'he-tme',
          version: '1.0.0-beta.5',
          input_artifacts: inputArtifacts,
        }),
      });

      const data = (await response.json()) as TriggerRunResponse;

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to trigger application run');
      }

      setSuccess(
        `Application run triggered successfully! Run ID: ${data.application_run_id || 'Unknown'}`
      );

      // Call the parent callback to refresh the runs list
      onRunTriggered();

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error triggering application run:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger application run');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Trigger Application Run</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Application: <span className="font-medium">he-tme</span> v1.0.0-beta.5
          </p>
        </div>

        <form
          onSubmit={e => {
            handleSubmit(e).catch(console.error);
          }}
          className="p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Success!</p>
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="download_url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Download URL
              </label>
              <input
                type="url"
                id="download_url"
                name="downloadUrl"
                value={formData.downloadUrl}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
            <h4 className="font-medium text-gray-900">Specimen Information</h4>

            <div>
              <label htmlFor="disease" className="block text-sm font-medium text-gray-700 mb-1">
                Cancer Type *
              </label>
              <select
                id="disease"
                name="disease"
                value={formData.disease}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="LUNG_CANCER">Lung Cancer</option>
                <option value="LIVER_CANCER">Liver Cancer</option>
                <option value="BREAST_CANCER">Breast Cancer</option>
                <option value="BLADDER_CANCER">Bladder Cancer</option>
                <option value="COLORECTAL_CANCER">Colorectal Cancer</option>
              </select>
            </div>

            <div>
              <label htmlFor="tissue" className="block text-sm font-medium text-gray-700 mb-1">
                Tissue Type *
              </label>
              <select
                id="tissue"
                name="tissue"
                value={formData.tissue}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                {tissueOptions[formData.disease]?.map(tissue => (
                  <option key={tissue} value={tissue}>
                    {tissue.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <h4 className="font-medium text-gray-900 pt-4">Image Properties</h4>

            <div>
              <label htmlFor="width_px" className="block text-sm font-medium text-gray-700 mb-1">
                Width (pixels) *
              </label>
              <input
                type="number"
                id="width_px"
                name="width_px"
                value={formData.width_px}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="height_px" className="block text-sm font-medium text-gray-700 mb-1">
                Height (pixels) *
              </label>
              <input
                type="number"
                id="height_px"
                name="height_px"
                value={formData.height_px}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="resolution_mpp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Resolution MPP (0.125 - 0.5) *
              </label>
              <input
                type="number"
                id="resolution_mpp"
                name="resolution_mpp"
                value={formData.resolution_mpp}
                onChange={handleInputChange}
                required
                min="0.125"
                max="0.5"
                step="0.00000001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="media_type" className="block text-sm font-medium text-gray-700 mb-1">
                Media Type *
              </label>
              <select
                id="media_type"
                name="media_type"
                value={formData.media_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="image/tiff">TIFF Image</option>
                <option value="application/dicom">DICOM</option>
                <option value="application/octet-stream">Binary Stream</option>
                <option value="application/zip">ZIP Archive</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="staining_method"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Staining Method *
              </label>
              <select
                id="staining_method"
                name="staining_method"
                value={formData.staining_method}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="H&E">H&E (Hematoxylin and Eosin)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="checksum_base64_crc32c"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Base64 CRC32C Checksum *
              </label>
              <input
                type="text"
                id="checksum_base64_crc32c"
                name="checksum_base64_crc32c"
                value={formData.checksum_base64_crc32c}
                onChange={handleInputChange}
                required
                placeholder="e.g., wHJ0IA=="
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Base64 encoded big-endian CRC32C checksum of your input image file
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Triggering...</span>
                </div>
              ) : (
                'Trigger Run'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
