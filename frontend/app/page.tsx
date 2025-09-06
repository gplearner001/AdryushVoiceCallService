'use client';

import { useState, useEffect } from 'react';
import { Phone, Database, MessageSquare, Activity } from 'lucide-react';

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

interface CallStatus {
  callId: string;
  status: string;
  duration: number | null;
  startTime: string;
  endTime: string | null;
}

export default function Dashboard() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [activeCall, setActiveCall] = useState<CallStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  const API_KEY = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'; // In production, use environment variable

  useEffect(() => {
    checkApiStatus();
    loadKnowledgeBases();
  }, []);

  // Auto-select first knowledge base when available
  useEffect(() => {
    if (knowledgeBases.length > 0 && !selectedKnowledgeBase) {
      setSelectedKnowledgeBase(knowledgeBases[0].id);
      console.log('Auto-selected knowledge base for calls:', knowledgeBases[0].name);
    }
  }, [knowledgeBases, selectedKnowledgeBase]);

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

  const initiateCall = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({
          phoneNumber: '+916360154904',
          knowledgeBaseId: selectedKnowledgeBase || knowledgeBases[0]?.id,
          customPrompt: 'You are a helpful customer service representative.',
          voiceConfig: {
            model: 'neural',
            speed: 1.0,
            pitch: 0,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveCall({
          callId: data.callId,
          status: data.status,
          duration: null,
          startTime: new Date().toISOString(),
          endTime: null,
        });
      }
    } catch (error) {
      console.error('Failed to initiate call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    if (!activeCall) return;

    try {
      const response = await fetch(`${API_URL}/api/calls/${activeCall.callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      });

      if (response.ok) {
        setActiveCall(null);
      }
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Voice Agent Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your AI-powered voice calls and knowledge bases
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Activity className={`w-8 h-8 ${apiStatus === 'online' ? 'text-green-500' : 'text-red-500'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">API Status</p>
                <p className={`text-lg font-semibold ${apiStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {apiStatus === 'checking' ? 'Checking...' : apiStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Database className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Knowledge Bases</p>
                <p className="text-lg font-semibold text-gray-900">{knowledgeBases.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Phone className={`w-8 h-8 ${activeCall ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Calls</p>
                <p className="text-lg font-semibold text-gray-900">{activeCall ? '1' : '0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-lg font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Call Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Call Management</h2>
            
            {/* Knowledge Base Selection for Calls */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Knowledge Base for Calls
              </label>
              <select
                value={selectedKnowledgeBase}
                onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Knowledge Base</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name}
                  </option>
                ))}
              </select>
              {selectedKnowledgeBase && (
                <p className="text-xs text-green-600 mt-1">
                  Selected: {knowledgeBases.find(kb => kb.id === selectedKnowledgeBase)?.name}
                </p>
              )}
            </div>

            {activeCall ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800">Active Call</h3>
                  <p className="text-sm text-green-600">Call ID: {activeCall.callId}</p>
                  <p className="text-sm text-green-600">Status: {activeCall.status}</p>
                  <p className="text-sm text-green-600">
                    Started: {new Date(activeCall.startTime).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={endCall}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  End Call
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">No active calls</p>
                <button
                  onClick={initiateCall}
                  disabled={isLoading || apiStatus !== 'online'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Initiating...' : 'Start Test Call'}
                </button>
                {apiStatus !== 'online' && (
                  <p className="text-sm text-red-600">API must be online to initiate calls</p>
                )}
              </div>
            )}
          </div>

          {/* Knowledge Bases */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Knowledge Bases</h2>
            
            {knowledgeBases.length > 0 ? (
              <div className="space-y-3">
                {knowledgeBases.map((kb) => (
                  <div key={kb.id} className="p-3 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900">{kb.name}</h3>
                    <p className="text-sm text-gray-600">{kb.description}</p>
                    <p className="text-xs text-gray-500">{kb.documentCount} documents</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No knowledge bases found</p>
                <p className="text-sm text-gray-500">Create one using the API</p>
              </div>
            )}
          </div>
        </div>

        {/* API Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">API URL</p>
              <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">{API_URL}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Health Check</p>
              <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">{API_URL}/health</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}