'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface TriggerApplicationRunModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onRunTriggered: () => void;
}

interface SlideData {
  id: string;
  name: string;
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
  const [slides, setSlides] = useState<SlideData[]>([]);
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

  // Create a new slide with default values
  const createNewSlide = (): SlideData => ({
    id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `Slide ${slides.length + 1}`,
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

  // Add a new slide
  const addSlide = () => {
    setSlides(prev => [...prev, createNewSlide()]);
  };

  // Remove a slide
  const removeSlide = (slideId: string) => {
    setSlides(prev => prev.filter(slide => slide.id !== slideId));
  };

  // Update a specific slide
  const updateSlide = (slideId: string, field: keyof SlideData, value: string) => {
    setSlides(prev =>
      prev.map(slide => {
        if (slide.id !== slideId) return slide;

        const updatedSlide = { ...slide, [field]: value };

        // If disease changes, reset tissue to first available option
        if (field === 'disease' && tissueOptions[value] && tissueOptions[value].length > 0) {
          updatedSlide.tissue = tissueOptions[value][0]!;
        }

        return updatedSlide;
      })
    );
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setIsSubmitting(false);
    } else if (slides.length === 0) {
      // Add first slide when modal opens
      const newSlide: SlideData = {
        id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Slide 1',
        downloadUrl: '',
        width_px: '1024',
        height_px: '1024',
        resolution_mpp: '0.25',
        checksum_base64_crc32c: '',
        media_type: 'image/tiff',
        staining_method: 'H&E',
        disease: 'LUNG_CANCER',
        tissue: 'LUNG',
      };
      setSlides([newSlide]);
    }
  }, [isOpen, slides.length]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!session?.accessToken) {
      setError('No authentication token available');
      return;
    }

    if (slides.length === 0) {
      setError('Please add at least one slide');
      return;
    }

    // Validate all slides have required fields
    const missingFields = slides.filter(
      slide => !slide.downloadUrl || !slide.checksum_base64_crc32c || !slide.name
    );

    if (missingFields.length > 0) {
      setError('Please fill in all required fields for all slides');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare the input artifacts from all slides
      const inputArtifacts = slides.map(slide => ({
        name: slide.name.toLowerCase().replace(/\s+/g, '_'),
        mime_type: slide.media_type,
        download_url: slide.downloadUrl,
        metadata: {
          media_type: slide.media_type,
          checksum_base64_crc32c: slide.checksum_base64_crc32c,
          specimen: {
            disease: slide.disease,
            tissue: slide.tissue,
          },
          resolution_mpp: parseFloat(slide.resolution_mpp),
          width_px: parseInt(slide.width_px, 10),
          height_px: parseInt(slide.height_px, 10),
          staining_method: slide.staining_method,
        },
      }));

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
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
          className="p-6 space-y-6"
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
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Input Slides</h4>
              <button
                type="button"
                onClick={addSlide}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add Slide</span>
              </button>
            </div>

            {slides.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No slides added yet. Click "Add Slide" to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Slide Name *
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Download URL *
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Dimensions (W×H) *
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Resolution MPP *
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Cancer Type *
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Tissue *
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Checksum *
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {slides.map((slide, index) => (
                      <tr key={slide.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 border-b">
                          <input
                            type="text"
                            value={slide.name}
                            onChange={e => updateSlide(slide.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Slide name"
                            disabled={isSubmitting}
                            required
                          />
                        </td>
                        <td className="px-4 py-3 border-b">
                          <input
                            type="url"
                            value={slide.downloadUrl}
                            onChange={e => updateSlide(slide.id, 'downloadUrl', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://..."
                            disabled={isSubmitting}
                            required
                          />
                        </td>
                        <td className="px-4 py-3 border-b">
                          <div className="flex space-x-1">
                            <input
                              type="number"
                              value={slide.width_px}
                              onChange={e => updateSlide(slide.id, 'width_px', e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Width"
                              min="1"
                              disabled={isSubmitting}
                              required
                            />
                            <span className="text-gray-400 self-center">×</span>
                            <input
                              type="number"
                              value={slide.height_px}
                              onChange={e => updateSlide(slide.id, 'height_px', e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Height"
                              min="1"
                              disabled={isSubmitting}
                              required
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 border-b">
                          <input
                            type="number"
                            value={slide.resolution_mpp}
                            onChange={e => updateSlide(slide.id, 'resolution_mpp', e.target.value)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.25"
                            min="0.125"
                            max="0.5"
                            step="0.00000001"
                            disabled={isSubmitting}
                            required
                          />
                        </td>
                        <td className="px-4 py-3 border-b">
                          <select
                            value={slide.disease}
                            onChange={e => updateSlide(slide.id, 'disease', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                            required
                          >
                            <option value="LUNG_CANCER">Lung Cancer</option>
                            <option value="LIVER_CANCER">Liver Cancer</option>
                            <option value="BREAST_CANCER">Breast Cancer</option>
                            <option value="BLADDER_CANCER">Bladder Cancer</option>
                            <option value="COLORECTAL_CANCER">Colorectal Cancer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 border-b">
                          <select
                            value={slide.tissue}
                            onChange={e => updateSlide(slide.id, 'tissue', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                            required
                          >
                            {tissueOptions[slide.disease]?.map(tissue => (
                              <option key={tissue} value={tissue}>
                                {tissue.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 border-b">
                          <input
                            type="text"
                            value={slide.checksum_base64_crc32c}
                            onChange={e =>
                              updateSlide(slide.id, 'checksum_base64_crc32c', e.target.value)
                            }
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="wHJ0IA=="
                            disabled={isSubmitting}
                            required
                          />
                        </td>
                        <td className="px-4 py-3 border-b">
                          <button
                            type="button"
                            onClick={() => removeSlide(slide.id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            disabled={isSubmitting || slides.length === 1}
                            title="Remove slide"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>* Required fields</p>
              <p>• Media Type: All slides will use image/tiff format</p>
              <p>• Staining Method: All slides will use H&E staining</p>
              <p>• Resolution MPP: Valid range is 0.125 to 0.5</p>
              <p>• Checksum: Base64 encoded big-endian CRC32C checksum of your input image file</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
              disabled={isSubmitting || slides.length === 0}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Triggering...</span>
                </div>
              ) : (
                `Trigger Run (${slides.length} slide${slides.length !== 1 ? 's' : ''})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
