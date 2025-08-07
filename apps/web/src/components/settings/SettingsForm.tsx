import React, { useState } from 'react';
import { 
  Save, 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Key,
  Smartphone,
  Monitor,
  Database,
  AlertCircle,
  Check,
  X,
  Eye,
  EyeOff,
  Upload,
  HelpCircle
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

export function SettingsForm() {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [formData, setFormData] = useState({
    // Profile
    name: 'John Doe',
    email: 'john.doe@example.com',
    bio: 'Software developer passionate about building great products.',
    avatar: '',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    marketingEmails: false,
    securityAlerts: true,
    
    // Security
    twoFactor: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    
    // Preferences
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    
    // Privacy
    profileVisibility: 'public',
    showEmail: false,
    activityStatus: true,
    dataSharing: false,
  });

  const sections: SettingsSection[] = [
    { id: 'profile', title: 'Profile', description: 'Manage your profile information', icon: User },
    { id: 'notifications', title: 'Notifications', description: 'Configure notification preferences', icon: Bell },
    { id: 'security', title: 'Security', description: 'Manage security settings', icon: Shield },
    { id: 'preferences', title: 'Preferences', description: 'Customize your experience', icon: Monitor },
    { id: 'privacy', title: 'Privacy', description: 'Control your privacy settings', icon: Eye },
    { id: 'data', title: 'Data & Storage', description: 'Manage data and storage', icon: Database },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const renderSaveButton = () => {
    const buttonClasses = {
      idle: 'bg-blue-600 hover:bg-blue-700 text-white',
      saving: 'bg-gray-400 text-white cursor-not-allowed',
      saved: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
    };

    const buttonContent = {
      idle: (
        <>
          <Save className="w-4 h-4" />
          Save Changes
        </>
      ),
      saving: (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Saving...
        </>
      ),
      saved: (
        <>
          <Check className="w-4 h-4" />
          Saved Successfully
        </>
      ),
      error: (
        <>
          <X className="w-4 h-4" />
          Error Saving
        </>
      ),
    };

    return (
      <button
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${buttonClasses[saveStatus]}`}
      >
        {buttonContent[saveStatus]}
      </button>
    );
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow">
          <nav className="p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-start gap-3 ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm">{section.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{section.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {sections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
              {renderSaveButton()}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </button>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Brief description for your profile.</p>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Email Notifications</h3>
                  
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                        <p className="text-xs text-gray-500">Receive email updates about your account</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                        <p className="text-xs text-gray-500">Receive push notifications on your devices</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.pushNotifications}
                      onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Weekly Digest</p>
                        <p className="text-xs text-gray-500">Get a weekly summary of your activity</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.weeklyDigest}
                      onChange={(e) => handleInputChange('weeklyDigest', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Security Alerts</p>
                        <p className="text-xs text-gray-500">Get notified about security events</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.securityAlerts}
                      onChange={(e) => handleInputChange('securityAlerts', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                {/* Password Change */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Two-Factor Authentication</h3>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Enable 2FA</p>
                          <p className="text-xs text-gray-500">Add an extra layer of security</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.twoFactor}
                        onChange={(e) => handleInputChange('twoFactor', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    {formData.twoFactor && (
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Configure 2FA
                      </button>
                    )}
                  </div>
                </div>

                {/* Session Management */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Session Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                      <select
                        value={formData.sessionTimeout}
                        onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="space-y-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'auto'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => handleInputChange('theme', theme)}
                        className={`p-3 border rounded-lg capitalize transition-colors ${
                          formData.theme === theme
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {theme === 'auto' ? (
                          <Monitor className="w-5 h-5 mx-auto mb-1" />
                        ) : theme === 'dark' ? (
                          <Moon className="w-5 h-5 mx-auto mb-1" />
                        ) : (
                          <Globe className="w-5 h-5 mx-auto mb-1" />
                        )}
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Profile Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                    <select
                      value={formData.profileVisibility}
                      onChange={(e) => handleInputChange('profileVisibility', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  {/* Privacy Options */}
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Show Email Address</p>
                      <p className="text-xs text-gray-500">Allow others to see your email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showEmail}
                      onChange={(e) => handleInputChange('showEmail', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Activity Status</p>
                      <p className="text-xs text-gray-500">Show when you're online</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.activityStatus}
                      onChange={(e) => handleInputChange('activityStatus', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Data Sharing</p>
                      <p className="text-xs text-gray-500">Share usage data for improvements</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.dataSharing}
                      onChange={(e) => handleInputChange('dataSharing', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-6">
                {/* Storage Usage */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Storage Usage</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Used Storage</span>
                      <span className="text-sm font-medium text-gray-900">2.4 GB of 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">1.2 GB</p>
                        <p className="text-xs text-gray-500">Documents</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">800 MB</p>
                        <p className="text-xs text-gray-500">Images</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">400 MB</p>
                        <p className="text-xs text-gray-500">Other</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Management */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Data Management</h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Export Your Data</p>
                          <p className="text-xs text-gray-500">Download all your data in a ZIP file</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                    <button className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Clear Cache</p>
                          <p className="text-xs text-gray-500">Remove temporary files to free up space</p>
                        </div>
                        <Trash2 className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                    <button className="w-full px-4 py-3 border border-red-300 rounded-lg text-left hover:bg-red-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600">Delete Account</p>
                          <p className="text-xs text-gray-500">Permanently delete your account and data</p>
                        </div>
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Need help?</p>
              <p className="text-sm text-blue-700 mt-1">
                Check out our <a href="#" className="underline">documentation</a> or{' '}
                <a href="#" className="underline">contact support</a> for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}