'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Card } from './card';
import { X, Upload, Link as LinkIcon, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStart: (jobId: string) => void;
  deckId?: string;
}

export function ImportModal({ isOpen, onClose, onImportStart, deckId }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await api.get(`/import/jobs/${jobId}`);
      const job = response.data;
      
      if (job.status === 'processing') {
        setProgress(50);
        setProgressMessage('AI is generating flashcards from content...');
      } else if (job.status === 'completed') {
        setProgress(100);
        setProgressMessage('Import complete!');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setTimeout(() => {
          onImportStart(jobId);
          setUrl('');
          setTopic('');
          setLoading(false);
          setProgress(0);
          setProgressMessage('');
          onClose();
        }, 1000);
      } else if (job.status === 'failed') {
        setProgressMessage('Import failed: ' + (job.error || 'Unknown error'));
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
          setProgressMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('[Import Modal] Failed to poll job status:', error);
    }
  };

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setProgress(10);
    setProgressMessage('Fetching content from URL...');
    
    try {
      console.log('[Import Modal] Starting URL import with:', { url: url.trim(), topic, deckId });
      const response = await api.post('/import/url', {
        url: url.trim(),
        topic: topic.trim() || undefined,
        deckId: deckId || undefined,
      });
      console.log('[Import Modal] URL import job created:', response.data);
      
      const newJobId = response.data.id;
      setProgress(30);
      setProgressMessage('Content extracted, preparing AI generation...');
      
      // Start polling for job status
      pollIntervalRef.current = setInterval(() => pollJobStatus(newJobId), 2000);
      
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      const message = err?.response?.data?.message || 'Failed to import URL';
      console.error('[Import Modal] URL import failed:', {
        status: err?.response?.status,
        message,
        error,
      });
      setProgressMessage('Failed: ' + message);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressMessage('');
      }, 3000);
    }
  };

  const handleFileImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setProgress(10);
    setProgressMessage('Uploading file...');
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      if (topic.trim()) formData.append('topic', topic.trim());
      if (deckId) formData.append('deckId', deckId);

      const response = await api.post('/import/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const newJobId = response.data.id;
      setProgress(30);
      setProgressMessage('File uploaded, extracting content...');
      
      // Start polling for job status
      pollIntervalRef.current = setInterval(() => pollJobStatus(newJobId), 2000);
      
      setTopic('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Failed to import file';
      setProgressMessage('Failed: ' + message);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setProgressMessage('');
      }, 3000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileImport(e.dataTransfer.files);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <div className="p-6 border-b border-slate-200/70 flex justify-between items-center">
          <h2 className="text-xl font-bold">Import content</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200/70 -mx-6 px-6 pb-4">
            <button
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-2 pb-2 px-3 font-medium transition-colors ${
                activeTab === 'url'
                  ? 'border-b-2 border-cyan-600 text-cyan-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-4 h-4" /> URL
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-2 pb-2 px-3 font-medium transition-colors ${
                activeTab === 'file'
                  ? 'border-b-2 border-cyan-600 text-cyan-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" /> Files
            </button>
          </div>

          {/* URL Tab */}
          {activeTab === 'url' && (
            <form onSubmit={handleImportUrl} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL or Web Link
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Biology, Machine Learning"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              {loading && progress > 0 && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-cyan-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 text-center flex items-center justify-center gap-2">
                    {progress === 100 ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : progressMessage.includes('Failed') ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                    {progressMessage}
                  </p>
                </div>
              )}
              
              <Button
                type="submit"
                disabled={!url.trim() || loading}
                className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  'Import from URL'
                )}
              </Button>
            </form>
          )}

          {/* File Tab */}
          {activeTab === 'file' && (
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Biology, Machine Learning"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Drag and drop area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileImport(e.target.files)}
                  accept=".pdf,.txt,.doc,.docx,.md,image/*"
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  {dragActive ? 'Drop file here' : 'Drag & drop your file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  or click to browse (PDF, TXT, DOC, MD, images)
                </p>
              </div>

              {loading && progress > 0 && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-linear-to-r from-cyan-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 text-center flex items-center justify-center gap-2">
                    {progress === 100 ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : progressMessage.includes('Failed') ? (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                    {progressMessage}
                  </p>
                </div>
              )}
              
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  'Choose File'
                )}
              </Button>
            </form>
          )}

          <p className="text-xs text-slate-500 text-center">
            Your content will be processed by AI to generate flashcards automatically.
          </p>
        </div>
      </Card>
    </div>
  );
}
