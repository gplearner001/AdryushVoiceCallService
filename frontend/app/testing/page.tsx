'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Settings } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  messageCount: number;
  createdAt: string;
  lastActivity: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
}

export default function TestingPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('You are a helpful voice assistant. Keep responses conversational and concise.');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  const API_KEY = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

  useEffect(() => {
    loadSessions();
    loadKnowledgeBases();
  }, []);

  // Auto-select first knowledge base when available
  useEffect(() => {
    if (knowledgeBases.length > 0 && !selectedKnowledgeBase) {
      setSelectedKnowledgeBase(knowledgeBases[0].id);
      console.log('Auto-selected knowledge base:', knowledgeBases[0].name);
    }
  }, [knowledgeBases, selectedKnowledgeBase]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/testing/sessions`, {
        headers: { 'X-API-Key': API_KEY }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadKnowledgeBases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/knowledge/bases`, {
        headers: { 'X-API-Key': API_KEY }
      });
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data.knowledgeBases || []);
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/testing/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId,
          customPrompt,
          knowledgeBaseId: selectedKnowledgeBase || undefined,
          voiceConfig: {
            model: 'neural',
            speed: 1,
            pitch: 0
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update session ID if this was a new session
        if (!sessionId) {
          setSessionId(data.sessionId);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        loadSessions(); // Refresh sessions list
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${error.details || error.message || 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Failed to connect to the API. Please check if the server is running.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = async () => {
    if (!sessionId) return;

    try {
      await fetch(`${API_URL}/api/testing/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': API_KEY }
      });
      
      setMessages([]);
      setSessionId(null);
      loadSessions();
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/testing/sessions/${id}`, {
        headers: { 'X-API-Key': API_KEY }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(id);
        setMessages(data.session.conversationHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date()
        })));
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Assistant Testing
          </h1>
          <p className="text-gray-600">
            Test your voice assistant with different prompts and knowledge bases
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sessions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Sessions</h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {showSettings && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Knowledge Base
                    </label>
                    <select
                      value={selectedKnowledgeBase}
                      onChange={(e) => setSelectedKnowledgeBase(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">No Knowledge Base</option>
                      {knowledgeBases.map((kb) => (
                        <option key={kb.id} value={kb.id}>
                          {kb.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Prompt
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No active sessions</p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        sessionId === session.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        Session {session.id.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.messageCount} messages
                      </div>
                    </div>
                  ))
                )}
              </div>

              {sessionId && (
                <button
                  onClick={clearSession}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Session
                </button>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {sessionId ? `Session: ${sessionId.substring(0, 8)}...` : 'New Session'}
                  </span>
                  {selectedKnowledgeBase && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      KB: {knowledgeBases.find(kb => kb.id === selectedKnowledgeBase)?.name || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Start a conversation with your voice assistant</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}