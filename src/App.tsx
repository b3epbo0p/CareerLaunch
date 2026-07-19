import React, { useState, useEffect } from 'react';
import { UserProfile, MockInterviewSession } from './types';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import StoriesTips from './components/StoriesTips';
import QuestionGenerator from './components/QuestionGenerator';
import MockInterviewCoach from './components/MockInterviewCoach';

import { 
  Briefcase, 
  BookOpen, 
  Sparkles, 
  Camera, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Settings,
  X,
  Check
} from 'lucide-react';

export default function App() {
  // Authentication & Profile states
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  
  // Tab states: 'dashboard' | 'stories' | 'generator' | 'coach'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stories' | 'generator' | 'coach'>('dashboard');
  const [initialShowBookmarked, setInitialShowBookmarked] = useState(false);

  const handleSetTab = (tab: 'dashboard' | 'stories' | 'generator' | 'coach', showBookmarked = false) => {
    setActiveTab(tab);
    setInitialShowBookmarked(showBookmarked);
  };
  
  // Past mock sessions
  const [pastSessions, setPastSessions] = useState<MockInterviewSession[]>([]);
  
  // Profile editor modal/drawer toggle
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Editing values
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editCompanyType, setEditCompanyType] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Hydrate user and session logs on load
  useEffect(() => {
    const cachedUser = localStorage.getItem('interview_current_user');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as UserProfile;
        setCurrentProfile(parsed);
        
        // Initialize editor values
        setEditName(parsed.name);
        setEditRole(parsed.targetRole);
        setEditIndustry(parsed.targetIndustry);
        setEditCompanyType(parsed.targetCompanyType || 'Startup');
      } catch (err) {
        console.error("Failed to parse cached user", err);
      }
    }
  }, []);

  // Fetch session history once a profile exists
  useEffect(() => {
    if (currentProfile) {
      const cachedMocks = localStorage.getItem(`interview_mock_history_${currentProfile.email}`);
      if (cachedMocks) {
        try {
          setPastSessions(JSON.parse(cachedMocks));
        } catch (err) {
          console.error("Failed to load historical mocks", err);
        }
      } else {
        setPastSessions([]);
      }
    }
  }, [currentProfile]);

  // Handle successful logins/registrations
  const handleAuthSuccess = (profile: UserProfile) => {
    setCurrentProfile(profile);
    setEditName(profile.name);
    setEditRole(profile.targetRole);
    setEditIndustry(profile.targetIndustry);
    setEditCompanyType(profile.targetCompanyType || 'Startup');
  };

  // Handle updates to profiles (adding bookmarks, setting items)
  const handleUpdateProfile = (updated: UserProfile) => {
    setCurrentProfile(updated);
    localStorage.setItem('interview_current_user', JSON.stringify(updated));
    
    // Sync to user record list as well
    const savedUsers = JSON.parse(localStorage.getItem('interview_saved_users') || '[]');
    const idx = savedUsers.findIndex((u: any) => u.email.toLowerCase() === updated.email.toLowerCase());
    if (idx !== -1) {
      savedUsers[idx] = { ...savedUsers[idx], ...updated };
      localStorage.setItem('interview_saved_users', JSON.stringify(savedUsers));
    }
  };

  // Save changes from editing profile (FR-4.3)
  const saveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    const updated: UserProfile = {
      ...currentProfile,
      name: editName,
      targetRole: editRole,
      targetIndustry: editIndustry,
      targetCompanyType: editCompanyType
    };

    handleUpdateProfile(updated);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setIsProfileOpen(false);
    }, 1500);
  };

  // Archive a completed mock session
  const handleSaveCompletedSession = (session: MockInterviewSession) => {
    if (!currentProfile) return;
    const updatedHistory = [session, ...pastSessions];
    setPastSessions(updatedHistory);
    localStorage.setItem(`interview_mock_history_${currentProfile.email}`, JSON.stringify(updatedHistory));
  };

  // Delete a mock session from history
  const handleDeleteSession = (sessionId: string) => {
    if (!currentProfile) return;
    if (confirm("Are you sure you want to delete this session from your scorecard logs?")) {
      const updated = pastSessions.filter(s => s.id !== sessionId);
      setPastSessions(updated);
      localStorage.setItem(`interview_mock_history_${currentProfile.email}`, JSON.stringify(updated));
    }
  };

  // Logout clean up
  const handleLogOut = () => {
    localStorage.removeItem('interview_current_user');
    setCurrentProfile(null);
    setActiveTab('dashboard');
  };

  if (!currentProfile) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 flex items-center justify-between px-8 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow-sm">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-md font-extrabold text-slate-800 tracking-tight leading-none uppercase">
              Career Launch
            </h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
              Graduate Placement Platform
            </span>
          </div>
        </div>

        {/* User control buttons */}
        <div className="flex items-center gap-4">
          <button
            id="header-btn-profile"
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Profile Onboarding</span>
          </button>
          
          <button
            id="header-btn-logout"
            onClick={handleLogOut}
            className="flex items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
            title="Log Out Safely"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Navigation Rails Row */}
        <nav className="md:col-span-3 space-y-2.5">
          
          <button
            id="nav-btn-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Success Dashboard</span>
          </button>

          <button
            id="nav-btn-stories"
            onClick={() => setActiveTab('stories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${
              activeTab === 'stories' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Real Stories & Tips</span>
          </button>

          <button
            id="nav-btn-generator"
            onClick={() => setActiveTab('generator')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${
              activeTab === 'generator' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Question Generator</span>
          </button>

          <button
            id="nav-btn-coach"
            onClick={() => setActiveTab('coach')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${
              activeTab === 'coach' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>AI Mock Coach</span>
          </button>

          {/* Quick guide card (Bento themed bg-slate-900) */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm hidden md:block border border-slate-800">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Expert Advice</h4>
            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
              Practicing simulated interview sequences consistently raises average competency levels from 65% to over 90%. Create custom sheets, read placement wins, and launch the coach daily.
            </p>
          </div>
        </nav>

        {/* Right Active View Pane */}
        <main className="md:col-span-9 min-h-[500px]">
          {activeTab === 'dashboard' && (
            <Dashboard 
              profile={currentProfile} 
              pastSessions={pastSessions} 
              onSetTab={handleSetTab} 
            />
          )}

          {activeTab === 'stories' && (
            <StoriesTips 
              profile={currentProfile} 
              onUpdateProfile={handleUpdateProfile} 
              initialShowBookmarked={initialShowBookmarked}
              onClearInitialShowBookmarked={() => setInitialShowBookmarked(false)}
            />
          )}

          {activeTab === 'generator' && (
            <QuestionGenerator 
              profile={currentProfile} 
              onUpdateProfile={handleUpdateProfile} 
            />
          )}

          {activeTab === 'coach' && (
            <MockInterviewCoach 
              profile={currentProfile} 
              onUpdateSessionHistory={handleSaveCompletedSession} 
              pastSessions={pastSessions}
              onDeleteSession={handleDeleteSession}
            />
          )}
        </main>
      </div>

      {/* Profile Onboarding Editor Modal Drawer (FR-4.3) */}
      {isProfileOpen && (
        <div id="modal-backdrop-profile" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-1.5 font-sans">
                    <Settings className="w-5 h-5 text-blue-600" /> Career Profile Setup
                  </h3>
                  <p className="text-xs text-slate-500">Fine-tune target criteria anytime to modify recommender systems.</p>
                </div>
                <button
                  id="btn-close-profile-modal"
                  onClick={() => setIsProfileOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {saveSuccessMsg && (
                <div id="profile-success-alert" className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs border border-emerald-100 flex items-center gap-1.5 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" /> Career targets successfully updated!
                </div>
              )}

              {/* Form inputs */}
              <form id="profile-edit-form" onSubmit={saveProfileEdits} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Full Name
                  </label>
                  <input
                    id="edit-profile-name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-850 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentProfile.email}
                    className="mt-1 block w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-slate-400 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Target Job Title
                  </label>
                  <input
                    id="edit-profile-role"
                    type="text"
                    required
                    value={editRole || ''}
                    onChange={(e) => setEditRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-850 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Target Industry / Sector
                  </label>
                  <input
                    id="edit-profile-industry"
                    type="text"
                    required
                    value={editIndustry || ''}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    placeholder="e.g. Technology"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-850 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Target Organization Type / Company Type
                  </label>
                  <input
                    id="edit-profile-company"
                    type="text"
                    required
                    value={editCompanyType || ''}
                    onChange={(e) => setEditCompanyType(e.target.value)}
                    placeholder="e.g. Startup, Tech Giant"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-850 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="pt-4">
                  <button
                    id="btn-save-profile-edits"
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm transition-colors cursor-pointer text-sm"
                  >
                    Save Career Settings
                  </button>
                </div>
              </form>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-50">
              Interviews completed under previous settings remain in records.
            </div>
          </div>
        </div>
      )}
      
      {/* Dynamic humble styled footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p>Graduate Interview Success Platform • Secure Your Placement Futures • {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
}
