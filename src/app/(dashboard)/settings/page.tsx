"use client";

import { useState, useEffect } from "react";
import { User, MapPin, Lock, LogOut, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [pumpInfo, setPumpInfo] = useState({ name: "", address: "" });
  
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isPumpLoading, setIsPumpLoading] = useState(true);
  const [isPumpSaving, setIsPumpSaving] = useState(false);
  const [pumpMessage, setPumpMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchPumpInfo();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProfile({ name: data.data.name, email: data.data.email });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  async function fetchPumpInfo() {
    try {
      const res = await fetch('/api/settings/pump');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setPumpInfo({ name: data.data.name, address: data.data.address });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPumpLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update profile");
      }
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
      setProfile({ name: data.data.name, email: data.data.email });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePumpSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPumpSaving(true);
    setPumpMessage(null);
    try {
      const res = await fetch('/api/settings/pump', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pumpInfo)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update pump info");
      }
      setPumpMessage({ type: 'success', text: 'Pump info updated successfully' });
      setPumpInfo({ name: data.data.name, address: data.data.address });
      setTimeout(() => setPumpMessage(null), 3000);
    } catch (err: any) {
      setPumpMessage({ type: 'error', text: err.message });
    } finally {
      setIsPumpSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setIsPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to change password");
      }

      setPasswordMessage({ type: 'success', text: 'Password changed successfully. Redirecting...' });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message });
      setIsPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error("Failed to logout", err);
    }
  };

  return (
    <div className="space-y-7 relative">
      <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-amber-600 mb-2">Workspace controls</p><h1 className="text-3xl font-bold text-gray-900">Settings</h1></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleProfileSave} className="card space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <User className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Admin Profile</h2>
          </div>
          
          {profileMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${profileMessage.type === 'success' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}>
              {profileMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input 
                type="text" 
                required
                value={profile.name}
                onChange={e => setProfile({...profile, name: e.target.value})}
                disabled={isProfileLoading}
                className="input-field" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                required
                value={profile.email}
                onChange={e => setProfile({...profile, email: e.target.value})}
                disabled={isProfileLoading}
                className="input-field" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isProfileSaving || isProfileLoading} 
              className="btn-primary w-full md:w-auto disabled:opacity-70"
            >
              {isProfileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        <form onSubmit={handlePumpSave} className="card space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <MapPin className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Petrol Pump Info</h2>
          </div>
          
          {pumpMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${pumpMessage.type === 'success' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}>
              {pumpMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pump Name</label>
              <input 
                type="text" 
                required
                value={pumpInfo.name}
                onChange={e => setPumpInfo({...pumpInfo, name: e.target.value})}
                disabled={isPumpLoading}
                className="input-field" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea 
                required
                value={pumpInfo.address}
                onChange={e => setPumpInfo({...pumpInfo, address: e.target.value})}
                disabled={isPumpLoading}
                className="input-field resize-none" 
                rows={3}
              />
            </div>
            <button 
              type="submit"
              disabled={isPumpSaving || isPumpLoading} 
              className="btn-secondary w-full md:w-auto disabled:opacity-70"
            >
              {isPumpSaving ? 'Updating...' : 'Update Info'}
            </button>
          </div>
        </form>

        {/* Reports Section for Admin */}
        <div className="card space-y-6 md:col-span-2 bg-teal-50/30 border-teal-100">
          <div className="flex items-center gap-3 border-b border-teal-100 pb-4">
            <div className="bg-teal-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Reports</h2>
              <p className="text-sm text-slate-500">Download Excel attendance reports for any date range.</p>
            </div>
          </div>
          <div className="space-y-4 max-w-md">
            <button 
              onClick={() => router.push('/reports')}
              className="w-full btn-secondary border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 text-left flex justify-between items-center group"
            >
              Generate Reports
              <span className="text-teal-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>
        </div>

        <div className="card space-y-6 md:col-span-2 md:hidden">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <Trash2 className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Trash</h2>
          </div>
          <div className="space-y-4 max-w-md">
            <button 
              onClick={() => router.push('/trash')}
              className="w-full btn-secondary text-left flex justify-between items-center group"
            >
              View Removed Workers
              <span className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>
        </div>

        <div className="card space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <Lock className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Security</h2>
          </div>
          <div className="space-y-4 max-w-md">
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full btn-secondary text-left flex justify-between items-center group"
            >
              Change Password
              <span className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full btn-secondary text-left flex justify-between items-center text-red-600 hover:bg-red-50 hover:border-red-200 group"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button 
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {passwordMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
                <input 
                  type="password" 
                  required
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="input-field w-full"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setPasswordMessage(null);
                  }}
                  className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isPasswordSaving}
                  className="flex-1 btn-primary disabled:opacity-70"
                >
                  {isPasswordSaving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
