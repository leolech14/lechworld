import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  User, 
  FileText, 
  Settings, 
  Shield, 
  Download,
  Upload,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'download' | 'upload' | 'permission' | 'settings' | 'error';
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  action: string;
  target?: string;
  timestamp: string;
  metadata?: {
    ip?: string;
    device?: string;
    location?: string;
    changes?: string[];
  };
  status: 'success' | 'warning' | 'error';
}

export function ActivityFeed() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [showFilters, setShowFilters] = useState(false);

  const { data: activities = [], isLoading, error } = useQuery<ActivityItem[]>({
    queryKey: ['activities', selectedType, selectedTimeRange],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: '1',
          type: 'login',
          user: { id: '1', name: 'John Doe' },
          action: 'Logged in',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          metadata: { ip: '192.168.1.1', device: 'Chrome on MacOS', location: 'San Francisco, CA' },
          status: 'success',
        },
        {
          id: '2',
          type: 'create',
          user: { id: '2', name: 'Jane Smith' },
          action: 'Created new document',
          target: 'Q4 Report.pdf',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'success',
        },
        {
          id: '3',
          type: 'update',
          user: { id: '3', name: 'Bob Johnson' },
          action: 'Updated user profile',
          target: 'Alice Williams',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          metadata: { changes: ['Email changed', 'Role updated to Moderator'] },
          status: 'success',
        },
        {
          id: '4',
          type: 'delete',
          user: { id: '1', name: 'John Doe' },
          action: 'Deleted file',
          target: 'old-backup.zip',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          status: 'warning',
        },
        {
          id: '5',
          type: 'permission',
          user: { id: '2', name: 'Jane Smith' },
          action: 'Changed permissions',
          target: 'Marketing Team',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          metadata: { changes: ['Added write access', 'Added delete access'] },
          status: 'success',
        },
        {
          id: '6',
          type: 'error',
          user: { id: '4', name: 'Charlie Brown' },
          action: 'Failed login attempt',
          timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
          metadata: { ip: '192.168.1.50', device: 'Firefox on Windows' },
          status: 'error',
        },
        {
          id: '7',
          type: 'download',
          user: { id: '3', name: 'Bob Johnson' },
          action: 'Downloaded report',
          target: 'Annual Summary 2024.xlsx',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          status: 'success',
        },
        {
          id: '8',
          type: 'settings',
          user: { id: '1', name: 'John Doe' },
          action: 'Changed system settings',
          timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          metadata: { changes: ['Two-factor authentication enabled', 'Email notifications updated'] },
          status: 'success',
        },
      ];
    },
  });

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'create': return FileText;
      case 'update': return Edit;
      case 'delete': return Trash2;
      case 'download': return Download;
      case 'upload': return Upload;
      case 'permission': return Shield;
      case 'settings': return Settings;
      case 'error': return AlertCircle;
      default: return Activity;
    }
  };

  const getActivityColor = (type: ActivityItem['type'], status: ActivityItem['status']) => {
    if (status === 'error') return 'text-red-500 bg-red-50';
    if (status === 'warning') return 'text-yellow-500 bg-yellow-50';
    
    switch (type) {
      case 'login':
      case 'logout':
        return 'text-blue-500 bg-blue-50';
      case 'create':
        return 'text-green-500 bg-green-50';
      case 'update':
        return 'text-purple-500 bg-purple-50';
      case 'delete':
        return 'text-red-500 bg-red-50';
      case 'permission':
        return 'text-indigo-500 bg-indigo-50';
      case 'settings':
        return 'text-gray-500 bg-gray-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const filteredActivities = activities.filter(activity => {
    if (selectedType === 'all') return true;
    return activity.type === selectedType;
  });

  // Stats calculation
  const stats = {
    total: activities.length,
    success: activities.filter(a => a.status === 'success').length,
    warnings: activities.filter(a => a.status === 'warning').length,
    errors: activities.filter(a => a.status === 'error').length,
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading activity feed. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
            <span>12% increase</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>{Math.round((stats.success / stats.total) * 100)}% of total</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>{Math.round((stats.warnings / stats.total) * 100)}% of total</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Errors</p>
              <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
            <span>3% decrease</span>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow">
        {/* Header with filters */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <div className="flex items-center gap-3">
              {/* Time range selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="1h">Last hour</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>

              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Activities</option>
                <option value="login">Logins</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
                <option value="permission">Permissions</option>
                <option value="error">Errors</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Advanced filters (hidden by default) */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search by user..."
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <input
                  type="text"
                  placeholder="Search by action..."
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Apply Filters
                  </button>
                  <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity List */}
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading activities...</span>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No activities found for the selected filters
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type, activity.status);
              
              return (
                <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{activity.user.name}</span>
                        <span className="text-gray-600">{activity.action}</span>
                        {activity.target && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="font-medium text-gray-700">{activity.target}</span>
                          </>
                        )}
                      </div>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="mt-1 space-y-1">
                          {activity.metadata.changes && (
                            <div className="text-sm text-gray-500">
                              {activity.metadata.changes.map((change, index) => (
                                <span key={index} className="inline-block mr-3">
                                  • {change}
                                </span>
                              ))}
                            </div>
                          )}
                          {(activity.metadata.ip || activity.metadata.device || activity.metadata.location) && (
                            <div className="text-xs text-gray-400 flex items-center gap-3">
                              {activity.metadata.ip && <span>IP: {activity.metadata.ip}</span>}
                              {activity.metadata.device && <span>{activity.metadata.device}</span>}
                              {activity.metadata.location && <span>{activity.metadata.location}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getRelativeTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load more */}
        {filteredActivities.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Load more activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}