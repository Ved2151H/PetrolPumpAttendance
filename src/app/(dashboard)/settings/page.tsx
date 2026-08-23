"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
  Trash2,
  User,
  UsersRound,
  X,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  
  const [profile, setProfile] = useState({ name: "", email: "", role: "", adminNumber: 0, currentFirmId: "", companyAddress: "", companyEmail: "", supportContact: "" });
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'company'>('profile');
  
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setProfile({
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          adminNumber: data.data.adminNumber,
          currentFirmId: data.data.currentFirmId,
          companyAddress: data.data.companyAddress || "",
          companyEmail: data.data.companyEmail || "",
          supportContact: data.data.supportContact || ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProfileLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, email: profile.email })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update profile");
      }
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
      if (data.data) {
        setProfile(prev => ({ 
          ...prev, 
          name: data.data.name, 
          email: data.data.email
        }));
      }
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyAddress: profile.companyAddress, 
          companyEmail: profile.companyEmail, 
          supportContact: profile.supportContact 
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update company details");
      }
      setProfileMessage({ type: 'success', text: 'Company details updated successfully' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setIsProfileSaving(false);
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

  const adminLabel = profile.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrator';

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 pb-4 sm:space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-indigo-50/70 px-5 py-6 shadow-[0_18px_45px_-35px_rgba(30,48,93,0.55)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-16 top-0 h-full w-px bg-gradient-to-b from-transparent via-indigo-100 to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-amber-600">Workspace controls</p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-[2rem]">Settings</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Manage your profile, workspace access, reports, and account security from one place.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            Account active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="card relative overflow-hidden space-y-6 lg:col-span-7 lg:p-7">
          <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-[5rem] bg-indigo-50/80" />
          <div className="relative flex flex-col gap-4 border-b border-slate-100 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Admin Profile Settings</p>
                  <h2 className="mt-0.5 text-lg font-bold text-slate-900">Admin {profile.adminNumber || ''}</h2>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" /> {adminLabel}
              </span>
            </div>

            {/* Tab switch control */}
            <div className="flex gap-2 mt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Profile Settings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Security & Protection
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('company')}
                className={`py-1.5 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'company'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Company Details
              </button>
            </div>
          </div>

          {profileMessage && (
            <div className={`p-3 rounded-lg text-sm font-medium ${profileMessage.type === 'success' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}>
              {profileMessage.text}
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name</label>
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
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                <input 
                  type="email" 
                  required
                  value={profile.email}
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  disabled={isProfileLoading}
                  className="input-field" 
                />
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">Your profile details are used across the workspace.</p>
                <button
                  type="submit"
                  disabled={isProfileSaving || isProfileLoading}
                  className="btn-primary w-full shrink-0 gap-2 sm:w-auto disabled:opacity-70"
                >
                  {isProfileSaving ? 'Saving...' : 'Save Profile'} {!isProfileSaving && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          ) : activeTab === 'company' ? (
            <form onSubmit={handleCompanySave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Company Email Address</label>
                <input 
                  type="email" 
                  value={profile.companyEmail}
                  onChange={e => setProfile({...profile, companyEmail: e.target.value})}
                  disabled={isProfileLoading}
                  className="input-field" 
                  placeholder="e.g. contact@namrataconstruction.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Company Address</label>
                <input 
                  type="text" 
                  value={profile.companyAddress}
                  onChange={e => setProfile({...profile, companyAddress: e.target.value})}
                  disabled={isProfileLoading}
                  className="input-field" 
                  placeholder="e.g. Aurangabad, Maharashtra, India"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Support Contact</label>
                <input 
                  type="text" 
                  value={profile.supportContact}
                  onChange={e => setProfile({...profile, supportContact: e.target.value})}
                  disabled={isProfileLoading}
                  className="input-field" 
                  placeholder="e.g. support@namrataconstruction.com"
                />
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">Company details are printed dynamically on all invoices.</p>
                <button
                  type="submit"
                  disabled={isProfileSaving || isProfileLoading}
                  className="btn-primary w-full shrink-0 gap-2 sm:w-auto disabled:opacity-70"
                >
                  {isProfileSaving ? 'Saving...' : 'Save Company Details'} {!isProfileSaving && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"><Lock className="h-5 w-5" /></div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Account protection</p>
                  <h2 className="mt-0.5 text-lg font-bold text-slate-900">Security Actions</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Keep your account protected and end this session securely.</p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="group flex min-h-24 flex-col items-start justify-between rounded-xl border border-slate-200 bg-white/80 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm cursor-pointer"
                >
                  <KeyRound className="h-4.5 w-4.5 text-indigo-600" />
                  <span className="flex w-full items-center justify-between gap-2"><span><span className="block text-sm font-bold text-slate-800">Change password</span><span className="mt-0.5 block text-xs font-medium text-slate-500">Update your sign-in</span></span><ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" /></span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="group flex min-h-24 flex-col items-start justify-between rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:shadow-sm cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5 text-red-600" />
                  <span className="flex w-full items-center justify-between gap-2"><span><span className="block text-sm font-bold text-red-700">Logout</span><span className="mt-0.5 block text-xs font-medium text-red-500">End this session</span></span><ChevronRight className="h-4 w-4 shrink-0 text-red-400 transition-transform group-hover:translate-x-0.5" /></span>
                </button>
              </div>
            </div>
          )}
        </div>

        {profile.role === 'SUPER_ADMIN' && (
          <section className="card space-y-5 lg:col-span-5 lg:p-7">
            <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-700"><UsersRound className="h-5 w-5" /></div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">Workspace access</p>
                <h2 className="mt-0.5 text-lg font-bold text-slate-900">Admin Management</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">Control administrator access and review workspace activity.</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => router.push('/settings/admins')}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-all hover:border-violet-200 hover:bg-violet-50/60 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 group-hover:text-violet-700"><UsersRound className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">Manage admins</span><span className="mt-0.5 block text-xs text-slate-500">Add and manage access</span></span>
                <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600" />
              </button>
              <button
                onClick={() => router.push('/settings/audit')}
                className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-all hover:border-violet-200 hover:bg-violet-50/60 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 group-hover:text-violet-700"><Activity className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">Activity log</span><span className="mt-0.5 block text-xs text-slate-500">Review recent changes</span></span>
                <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600" />
              </button>
            </div>
          </section>
        )}

        {/* Reports Section for Admin */}
        <section className="card relative overflow-hidden border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/80 lg:col-span-6 lg:p-7">
          <div className="pointer-events-none absolute -right-10 -bottom-12 h-40 w-40 rounded-full bg-teal-100/70" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-teal-700/70">Export centre</p>
              <h2 className="text-lg font-bold text-slate-900">Reports</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">Download Excel attendance reports for any date range.</p>
            </div>
          </div>
            <button
              onClick={() => router.push('/reports')}
              className="group relative mt-6 flex w-full items-center justify-between rounded-xl border border-teal-200 bg-white/90 px-4 py-3.5 text-left text-sm font-bold text-teal-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50"
            >
              Generate reports
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Notes Section - only for Narmata Construction since it is moved from bottom nav */}
        {profile.currentFirmId === 'narmata' && (
          <section className="card relative overflow-hidden border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/80 lg:col-span-6 lg:p-7">
            <div className="pointer-events-none absolute -right-10 -bottom-12 h-40 w-40 rounded-full bg-violet-100/70" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]"><FileText className="h-5 w-5" /></div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.14em] text-violet-700/70">Workspace notebook</p>
                  <h2 className="text-lg font-bold text-slate-900">Notes</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Manage, create and search daily workspace notes.</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/settings/notes')}
                className="group relative mt-6 flex w-full items-center justify-between rounded-xl border border-violet-200 bg-white/90 px-4 py-3.5 text-left text-sm font-bold text-violet-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50"
              >
                Go to Notes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>
        )}

        <section className="card space-y-5 md:hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Trash2 className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-bold text-slate-900">Trash</h2><p className="text-sm text-slate-500">View removed workers</p></div>
          </div>
          <button onClick={() => router.push('/trash')} className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-white"><span>View removed workers</span><ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" /></button>
        </section>

      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><KeyRound className="h-5 w-5" /></span><div><h2 className="text-xl font-bold text-slate-900">Change Password</h2><p className="mt-0.5 text-sm text-slate-500">Use a strong, unique password.</p></div></div>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordMessage(null);
                }}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
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
