'use client';

import { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Search, FileText, Save, X } from 'lucide-react';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  title: string;
  content: string;
  metadata?: {
    category?: string;
    version?: string;
    [key: string]: any;
  };
}

export default function KnowledgeBasePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documents: [{ title: '', content: '', metadata: { category: '', version: '1.0' } }] as Document[]
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  const API_KEY = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

  useEffect(() => {
    checkApiStatus();
    loadKnowledgeBases();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const loadKnowledgeBases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/bases`, {
        headers: {
          'X-API-Key': API_KEY,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data.knowledgeBases || []);
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  };

  const handleCreateKnowledgeBase = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a knowledge base name');
      return;
    }

    if (formData.documents.some(doc => !doc.title.trim() || !doc.content.trim())) {
      alert('Please fill in all document titles and content');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/knowledge/bases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          documents: formData.documents.map(doc => ({
            title: doc.title,
            content: doc.content,
            metadata: {
              category: doc.metadata?.category || '',
              version: doc.metadata?.version || '1.0'
            }
          }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Knowledge base created:', data);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          documents: [{ title: '', content: '', metadata: { category: '', version: '1.0' } }]
        });
        setShowCreateForm(false);
        
        // Reload knowledge bases
        await loadKnowledgeBases();
        
        alert('Knowledge base created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create knowledge base: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      alert('Failed to create knowledge base. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, { title: '', content: '', metadata: { category: '', version: '1.0' } }]
    }));
  };

  const removeDocument = (index: number) => {
    if (formData.documents.length > 1) {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
      }));
    }
  };

  const updateDocument = (index: number, field: keyof Document, value: any) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => 
        i === index 
          ? field === 'metadata' 
            ? { ...doc, metadata: { ...doc.metadata, ...value } }
            : { ...doc, [field]: value }
          : doc
      )
    }));
  };

  const deleteKnowledgeBase = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/knowledge/bases/${id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': API_KEY,
        },
      });

      if (response.ok) {
        await loadKnowledgeBases();
        alert('Knowledge base deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete knowledge base: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      alert('Failed to delete knowledge base. Please check if the server is running.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Knowledge Bases
              </h1>
              <p className="text-gray-600">
                Manage your AI knowledge bases and documents
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={apiStatus !== 'online'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Knowledge Base
            </button>
          </div>
        </div>

        {/* API Status */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${apiStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                API Status: {apiStatus === 'checking' ? 'Checking...' : apiStatus}
              </span>
              {apiStatus !== 'online' && (
                <span className="text-sm text-red-600">
                  API must be online to create knowledge bases
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Knowledge Base</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Basic Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Customer Support KB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of this knowledge base"
                      />
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    <button
                      onClick={addDocument}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Document
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.documents.map((document, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Document {index + 1}</h4>
                          {formData.documents.length > 1 && (
                            <button
                              onClick={() => removeDocument(index)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title *
                            </label>
                            <input
                              type="text"
                              value={document.title}
                              onChange={(e) => updateDocument(index, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Document title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category
                            </label>
                            <input
                              type="text"
                              value={document.metadata?.category || ''}
                              onChange={(e) => updateDocument(index, 'metadata', { category: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., pricing, support"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Version
                            </label>
                            <input
                              type="text"
                              value={document.metadata?.version || '1.0'}
                              onChange={(e) => updateDocument(index, 'metadata', { version: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="1.0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content *
                          </label>
                          <textarea
                            value={document.content}
                            onChange={(e) => updateDocument(index, 'content', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter the document content that will be used to answer questions..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKnowledgeBase}
                    disabled={isLoading || !formData.name.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? 'Creating...' : 'Create Knowledge Base'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Bases List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Existing Knowledge Bases ({knowledgeBases.length})
            </h2>
            
            {knowledgeBases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {knowledgeBases.map((kb) => (
                  <div key={kb.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">{kb.name}</h3>
                      </div>
                      <button
                        onClick={() => deleteKnowledgeBase(kb.id, kb.name)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete knowledge base"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {kb.description && (
                      <p className="text-sm text-gray-600 mb-3">{kb.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{kb.documentCount} documents</span>
                      </div>
                      <div>
                        Created: {new Date(kb.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        ID: {kb.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Bases</h3>
                <p className="text-gray-600 mb-4">
                  Create your first knowledge base to get started with AI-powered conversations.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  disabled={apiStatus !== 'online'}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Knowledge Base
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}