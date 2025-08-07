import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Home, User, Settings, Activity } from 'lucide-react';

// API client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

function App() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['api-status'],
    queryFn: () => api.get('/api/v1/status').then(res => res.data),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Monorepo 5</h1>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </a>
                <a href="/users" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Users
                </a>
                <a href="/activity" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Activity
                </a>
                <a href="/settings" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage status={status} isLoading={isLoading} />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

// Home Page Component
function HomePage({ status, isLoading }: { status: any; isLoading: boolean }) {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Monorepo 5
          </h2>
          <p className="text-gray-600 mb-6">
            Ultimate production-ready monorepo with complete feature set
          </p>
          
          {/* API Status */}
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3">API Status</h3>
            {isLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : status ? (
              <div className="text-green-600">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Connected
                </div>
                <div className="text-sm text-gray-600">
                  {status.message}
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Disconnected
                </div>
                <div className="text-sm text-gray-600">
                  Unable to connect to API
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder Pages
function UsersPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Users</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Users management coming soon...</p>
      </div>
    </div>
  );
}

function ActivityPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Activity</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Activity dashboard coming soon...</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Settings panel coming soon...</p>
      </div>
    </div>
  );
}

export default App;