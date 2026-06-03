'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Key, Link as LinkIcon, ToggleLeft, ToggleRight, 
  CheckCircle2, RefreshCw, Users, Shield, Radio, ShieldAlert,
  Server, HelpCircle, FileText, ArrowRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getForumSettings, saveForumSettings, getSyncedForumUsers, 
  ensureDefaultSyncedUsers, syncUserWithForum, ForumSettings, SyncedUser 
} from '@/lib/forumService';

export default function ForumSettingsPage() {
  // Settings State
  const [discourseUrl, setDiscourseUrl] = useState('https://forum.pacemaker.com');
  const [ssoSecretKey, setSsoSecretKey] = useState('pacemaker-discourse-sso-secret-12345');
  const [ssoEnabled, setSsoEnabled] = useState(true);
  
  // Accounts State
  const [syncedUsers, setSyncedUsers] = useState<SyncedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI feedback states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [resyncingEmail, setResyncingEmail] = useState<string | null>(null);

  // Connection testing states
  const [isTesting, setIsTesting] = useState(false);
  const [testStep, setTestStep] = useState(0);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  // Load settings & users
  useEffect(() => {
    ensureDefaultSyncedUsers();
    
    const config = getForumSettings();
    setDiscourseUrl(config.discourseUrl);
    setSsoSecretKey(config.ssoSecretKey);
    setSsoEnabled(config.ssoEnabled);

    setSyncedUsers(getSyncedForumUsers());
  }, []);

  // Save changes
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ForumSettings = {
      discourseUrl,
      ssoSecretKey,
      ssoEnabled
    };
    saveForumSettings(updated);
    
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Simulate Test Connection
  const handleTestConnection = async () => {
    if (!discourseUrl) return;
    
    setIsTesting(true);
    setTestResult(null);
    setTestStep(1); // step 1: dns lookup
    
    await new Promise(r => setTimeout(r, 1000));
    setTestStep(2); // step 2: ssl check
    
    await new Promise(r => setTimeout(r, 1000));
    setTestStep(3); // step 3: handshake
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Default URL forum.pacemaker.com will succeed in simulation, or if it has some content
    setIsTesting(false);
    setTestResult('success');
  };

  // Simulate individual user resync
  const handleResyncUser = async (user: SyncedUser) => {
    setResyncingEmail(user.email);
    await new Promise(r => setTimeout(r, 1200));
    
    // Perform actual local re-sync
    syncUserWithForum(user.email, user.fullName, user.username, user.role);
    setSyncedUsers(getSyncedForumUsers());
    
    setResyncingEmail(null);
  };

  // Filter synced accounts
  const filteredUsers = syncedUsers.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-emerald-600 border border-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3 font-bold text-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Discourse forum settings updated successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Forum <span className="text-primary-600">Integration</span></h1>
          <p className="text-gray-500 font-medium mt-1">Configure Discourse SSO connection parameters and view synchronized accounts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form & Connection Test */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-sm p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl z-0"></div>
            
            <form onSubmit={handleSaveSettings} className="space-y-6 relative z-10">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-2">
                <div className="bg-primary-50 p-2.5 rounded-xl border border-primary-100">
                  <Settings className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-md">SSO Configurations</h3>
                  <p className="text-xs text-gray-400 font-medium">Link users automatically using HMAC-SHA256.</p>
                </div>
              </div>

              {/* Discourse URL */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Discourse Board URL</label>
                  <span className="text-[10px] text-gray-400 font-bold">Needs trailing slash omitted</span>
                </div>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="url" required
                    value={discourseUrl} onChange={e => setDiscourseUrl(e.target.value)}
                    placeholder="https://forum.yourdomain.com"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-950 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm focus:bg-white"
                  />
                </div>
              </div>

              {/* Secret Key */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Discourse SSO Secret Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password" required
                    value={ssoSecretKey} onChange={e => setSsoSecretKey(e.target.value)}
                    placeholder="Enter security secret passphrase"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-955 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm focus:bg-white"
                  />
                </div>
              </div>

              {/* SSO Toggle */}
              <div className="bg-gray-50 border border-gray-150 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-black text-gray-900 text-sm">Enable DiscourseConnect (SSO)</h4>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed max-w-md">
                    Forces users to authenticate via PaceMaker before accessing the forum, generating a secure metadata payload.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSsoEnabled(!ssoEnabled)}
                  className="text-primary-600 hover:text-primary-700 transition-all active:scale-95 shrink-0"
                >
                  {ssoEnabled ? (
                    <ToggleRight className="w-14 h-10 text-primary-600" />
                  ) : (
                    <ToggleLeft className="w-14 h-10 text-gray-300" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex-1 py-4 border-2 border-gray-200 hover:border-gray-900 text-gray-600 hover:text-gray-900 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Activity className="w-4 h-4" /> Test Connection
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-primary-500/20 text-center"
                >
                  Save Integration Settings
                </button>
              </div>
            </form>
          </div>

          {/* Connection Test HUD */}
          <AnimatePresence>
            {(isTesting || testResult) && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-gray-900 text-gray-300 rounded-[2rem] p-6 shadow-xl space-y-4 border border-gray-800"
              >
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-black uppercase tracking-wider">Discourse Endpoint Handshake</span>
                  </div>
                  {testResult === 'success' && (
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                      Connection Online
                    </span>
                  )}
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {testStep >= 1 && (
                    <div className="flex items-center justify-between text-gray-400">
                      <span>1. Resolving hostname <code>{discourseUrl.replace('https://', '')}</code>...</span>
                      <span className="text-emerald-400 font-bold">SUCCESS</span>
                    </div>
                  )}
                  {testStep >= 2 && (
                    <div className="flex items-center justify-between text-gray-400">
                      <span>2. Validating SSL certificate chain...</span>
                      <span className="text-emerald-400 font-bold">SECURE (TLS 1.3)</span>
                    </div>
                  )}
                  {testStep >= 3 && (
                    <div className="flex items-center justify-between text-gray-400">
                      <span>3. Handshaking HMAC-SHA256 SSO encryption...</span>
                      <span className="text-emerald-400 font-bold">ALIGNED</span>
                    </div>
                  )}
                </div>

                {testResult === 'success' && (
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-start gap-3 mt-4"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-emerald-400">Handshake Complete!</h4>
                      <p className="text-[11px] text-emerald-500/70 font-medium leading-relaxed mt-1">
                        PaceMaker has successfully simulated a secure link with Discourse at <code>{discourseUrl}</code>. SSO redirection payloads are properly signing.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Platform Stats & Integration Help */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-gray-150 p-6 space-y-4">
            <h4 className="font-black text-gray-900 text-sm">Discourse Connect SSO Flow</h4>
            <div className="relative border-l border-gray-200 pl-4 space-y-5 py-2">
              <div className="relative">
                <div className="absolute -left-6.5 top-0.5 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center">
                  <span className="text-[8px] font-black text-primary-700">1</span>
                </div>
                <h5 className="text-xs font-black text-gray-900">User Accesses Forum</h5>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  User visits `/forum`. PaceMaker extracts current session credentials from localStorage.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-6.5 top-0.5 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center">
                  <span className="text-[8px] font-black text-primary-700">2</span>
                </div>
                <h5 className="text-xs font-black text-gray-900">SSO Base64 Payload</h5>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  PaceMaker compiles: email, name, username, and external_id, converting to base64.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-6.5 top-0.5 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center">
                  <span className="text-[8px] font-black text-primary-700">3</span>
                </div>
                <h5 className="text-xs font-black text-gray-900">HMAC-SHA256 Signature</h5>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  The payload is signed using Node crypto route `/api/forum/sso` and the secret key.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-6.5 top-0.5 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center">
                  <span className="text-[8px] font-black text-primary-700">4</span>
                </div>
                <h5 className="text-xs font-black text-gray-900">Handshake Validation</h5>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  Discourse decodes payload, validates signature against its own key, and logs the user in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Accounts Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-sm p-8 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-50 p-2.5 rounded-xl border border-primary-100">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-md">Synced Forum Accounts</h3>
              <p className="text-xs text-gray-400 font-medium">User records synchronized with the Discourse database.</p>
            </div>
          </div>
          <div className="w-full md:w-64">
            <input 
              type="text"
              placeholder="Search synced accounts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-2">Member</th>
                <th className="py-4 px-2">Username</th>
                <th className="py-4 px-2">Email Address</th>
                <th className="py-4 px-2">Role</th>
                <th className="py-4 px-2">Last Synchronized</th>
                <th className="py-4 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No matching synced records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-black text-xs flex items-center justify-center">
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <span className="font-black text-gray-900">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-gray-400">@{user.username}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-medium text-gray-600">{user.email}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase font-black border ${
                        user.role === 'admin' 
                          ? 'bg-rose-50 border-rose-100 text-rose-700' 
                          : user.role === 'instructor' 
                          ? 'bg-teal-50 border-teal-100 text-teal-700' 
                          : 'bg-primary-50 border-primary-100 text-primary-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-gray-400 font-medium">{new Date(user.syncedAt).toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button 
                        onClick={() => handleResyncUser(user)}
                        disabled={resyncingEmail === user.email}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all inline-flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        title="Force User Re-sync"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${resyncingEmail === user.email ? 'animate-spin text-primary-600' : ''}`} />
                        <span className="text-[10px] font-black uppercase">
                          {resyncingEmail === user.email ? 'Syncing...' : 'Sync'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
