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
  const [showCallForm, setShowCallForm] = useState(false);
  const [callFormData, setCallFormData] = useState({
    phoneNumber: '+916360154904',
    knowledgeBaseId: '',
    customPrompt: 'You are a helpful customer service representative. Be professional, friendly, and keep responses conversational and concise since this is a phone conversation.',
    voiceConfig: {
      model: 'neural',
      speed: 1.0,
      pitch: 0
    }
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  const API_KEY = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'; // In production, use environment variable

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
          phoneNumber: callFormData.phoneNumber,
          knowledgeBaseId: callFormData.knowledgeBaseId || undefined,
          customPrompt: callFormData.customPrompt,
          voiceConfig: callFormData.voiceConfig,
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
        setShowCallForm(false);
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
                  onClick={() => setShowCallForm(true)}
                  disabled={isLoading || apiStatus !== 'online'}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Configure & Start Call
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

        {/* Call Configuration Modal */}
        {showCallForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Configure Call</h2>
                  <button
                    onClick={() => setShowCallForm(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={callFormData.phoneNumber}
                      onChange={(e) => setCallFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1234567890"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter phone number in E.164 format (e.g., +1234567890)</p>
                  </div>

                  {/* Knowledge Base Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Knowledge Base (Optional)
                    </label>
                    <select
                      value={callFormData.knowledgeBaseId}
                      onChange={(e) => setCallFormData(prev => ({ ...prev, knowledgeBaseId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Knowledge Base</option>
                      {knowledgeBases.map((kb) => (
                        <option key={kb.id} value={kb.id}>
                          {kb.name} ({kb.documentCount} documents)
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select a knowledge base to provide context-aware responses</p>
                  </div>

                  {/* Custom Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Prompt *
                    </label>
                    <textarea
                      value={callFormData.customPrompt}
                      onChange={(e) => setCallFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Define how the AI should behave during the call..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This prompt defines the AI's personality and behavior during the call. Keep it conversational for phone interactions.
                    </p>
                  </div>

                  {/* Voice Configuration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voice Configuration
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                        <select
                          value={callFormData.voiceConfig.model}
                          onChange={(e) => setCallFormData(prev => ({
                            ...prev,
                            voiceConfig: { ...prev.voiceConfig, model: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="neural">Neural (High Quality)</option>
                          <option value="standard">Standard</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Speed</label>
                        <select
                          value={callFormData.voiceConfig.speed}
                          onChange={(e) => setCallFormData(prev => ({
                            ...prev,
                            voiceConfig: { ...prev.voiceConfig, speed: parseFloat(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0.8}>Slow (0.8x)</option>
                          <option value={0.9}>Slightly Slow (0.9x)</option>
                          <option value={1.0}>Normal (1.0x)</option>
                          <option value={1.1}>Slightly Fast (1.1x)</option>
                          <option value={1.2}>Fast (1.2x)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Pitch</label>
                        <select
                          value={callFormData.voiceConfig.pitch}
                          onChange={(e) => setCallFormData(prev => ({
                            ...prev,
                            voiceConfig: { ...prev.voiceConfig, pitch: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={-5}>Lower (-5)</option>
                          <option value={-2}>Slightly Lower (-2)</option>
                          <option value={0}>Normal (0)</option>
                          <option value={2}>Slightly Higher (+2)</option>
                          <option value={5}>Higher (+5)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Preset Prompts */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Prompt Presets
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCallFormData(prev => ({
                          ...prev,
                          customPrompt: 'You are a friendly customer service representative. Be helpful, professional, and empathetic. Keep responses conversational and concise since this is a phone conversation. Always try to resolve customer issues quickly and efficiently.'
                        }))}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-900">Customer Service</div>
                        <div className="text-xs text-gray-600">Professional, helpful, problem-solving</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallFormData(prev => ({
                          ...prev,
                          customPrompt: 'You are an enthusiastic sales representative. Be friendly, engaging, and focus on understanding customer needs before presenting solutions. Keep the conversation natural and avoid being pushy. Ask questions to better understand what the customer is looking for.'
                        }))}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-900">Sales Representative</div>
                        <div className="text-xs text-gray-600">Engaging, needs-focused, consultative</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallFormData(prev => ({
                          ...prev,
                          customPrompt: 'You are conducting a brief customer satisfaction survey. Be polite, clear, and efficient. Ask questions one at a time and wait for responses. Thank the customer for their time and keep the survey concise. Record their feedback accurately.'
                        }))}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-900">Survey Conductor</div>
                        <div className="text-xs text-gray-600">Polite, efficient, question-focused</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCallFormData(prev => ({
                          ...prev,
                          customPrompt: 'You are a technical support specialist. Be patient, methodical, and clear in your explanations. Break down complex technical issues into simple steps. Always confirm understanding before moving to the next step. Be encouraging and supportive throughout the troubleshooting process.'
                        }))}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm text-gray-900">Technical Support</div>
                        <div className="text-xs text-gray-600">Patient, methodical, step-by-step</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCallForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={initiateCall}
                    disabled={isLoading || !callFormData.phoneNumber.trim() || !callFormData.customPrompt.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {isLoading ? 'Initiating Call...' : 'Start Call'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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