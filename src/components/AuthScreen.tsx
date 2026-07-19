import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Shield, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Software Engineer');
  const [regIndustry, setRegIndustry] = useState('Technology');
  const [regComp, setRegComp] = useState('Tech Giant');
  
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please specify both email and password.');
      return;
    }

    // Try to find users registry in localStorage
    const savedUsers = JSON.parse(localStorage.getItem('interview_saved_users') || '[]');
    const matchedUser = savedUsers.find((u: any) => u.email.toLowerCase() === loginEmail.toLowerCase());

    if (matchedUser) {
      if (matchedUser.password === loginPassword) {
        // Logged in!
        const curProfile: UserProfile = {
          name: matchedUser.name,
          email: matchedUser.email,
          targetRole: matchedUser.targetRole,
          targetIndustry: matchedUser.targetIndustry,
          targetCompanyType: matchedUser.targetCompanyType,
          savedStories: matchedUser.savedStories || [],
          savedTips: matchedUser.savedTips || [],
          savedQuestionSets: matchedUser.savedQuestionSets || []
        };
        localStorage.setItem('interview_current_user', JSON.stringify(curProfile));
        onAuthSuccess(curProfile);
      } else {
        setErrorMsg('Invalid password credentials.');
      }
    } else {
      // Create a default account if details are standard (to make testing frictionless!)
      const defaultProfile: UserProfile = {
        name: loginEmail.split('@')[0],
        email: loginEmail,
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
        targetCompanyType: 'Tech Giant',
        savedStories: [],
        savedTips: [],
        savedQuestionSets: []
      };
      
      // Save user record
      const newUserRecord = {
        name: defaultProfile.name,
        email: loginEmail,
        password: loginPassword,
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
        targetCompanyType: 'Tech Giant',
        savedStories: [],
        savedTips: [],
        savedQuestionSets: []
      };
      savedUsers.push(newUserRecord);
      localStorage.setItem('interview_saved_users', JSON.stringify(savedUsers));
      localStorage.setItem('interview_current_user', JSON.stringify(defaultProfile));
      onAuthSuccess(defaultProfile);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regName || !regEmail || !regPassword || !regRole || !regIndustry) {
      setErrorMsg('Please fill out all onboarding fields.');
      return;
    }

    const savedUsers = JSON.parse(localStorage.getItem('interview_saved_users') || '[]');
    const exists = savedUsers.some((u: any) => u.email.toLowerCase() === regEmail.toLowerCase());

    if (exists) {
      setErrorMsg('This email is already registered. Please sign in instead.');
      return;
    }

    const newProfile: UserProfile = {
      name: regName,
      email: regEmail,
      targetRole: regRole,
      targetIndustry: regIndustry,
      targetCompanyType: regComp,
      savedStories: [],
      savedTips: [],
      savedQuestionSets: []
    };

    const newUserRecord = {
      ...newProfile,
      password: regPassword
    };

    savedUsers.push(newUserRecord);
    localStorage.setItem('interview_saved_users', JSON.stringify(savedUsers));
    localStorage.setItem('interview_current_user', JSON.stringify(newProfile));
    
    onAuthSuccess(newProfile);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-100">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <h2 id="platform-title" className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-800 font-sans">
          Career Launch
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Crack professional placements with AI practice, mock questions, and expert advice
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 rounded-2xl border border-slate-200 shadow-sm sm:px-10">
          
          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-slate-100 pb-3 justify-center">
            <button
              id="tab-toggle-login"
              onClick={() => { setIsLogin(true); setErrorMsg(''); }}
              className={`flex items-center gap-2 pb-2 text-sm font-bold transition-colors cursor-pointer ${
                isLogin ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              id="tab-toggle-reg"
              onClick={() => { setIsLogin(false); setErrorMsg(''); }}
              className={`flex items-center gap-2 pb-2 text-sm font-bold transition-colors cursor-pointer ${
                !isLogin ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Register
            </button>
          </div>

          {errorMsg && (
            <div id="auth-error" className="mb-4 bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-100">
              {errorMsg}
            </div>
          )}

          {isLogin ? (
            <form id="login-form" className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Password
                  </label>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm transition-colors cursor-pointer text-sm"
              >
                Sign In
              </button>
              
              <div className="text-center text-xs text-slate-400 mt-2">
                Tip: If signing up for the first time, typing credentials here auto-creates a graduate account.
              </div>
            </form>
          ) : (
            <form id="reg-form" className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Your Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex.m@college.com"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Select a Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Onboarding Preferences */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Target Job Title
                  </label>
                  <input
                    id="reg-role"
                    type="text"
                    required
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Target Sector
                  </label>
                  <input
                    id="reg-industry"
                    type="text"
                    required
                    value={regIndustry}
                    onChange={(e) => setRegIndustry(e.target.value)}
                    placeholder="e.g. Technology"
                    className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  />
                  <p className="mt-1.5 text-[10px] leading-normal text-slate-500">
                    ⚠️ <span className="font-semibold text-slate-600">Be specific:</span> Entering generic terms like <em className="italic">"Marketing"</em> is too broad. Specify the exact sector or sub-industry (e.g. <em className="italic">"Digital B2B Marketing"</em>) so the AI generator produces accurate questions.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Target Company Type
                </label>
                <input
                  id="reg-comp"
                  type="text"
                  required
                  value={regComp}
                  onChange={(e) => setRegComp(e.target.value)}
                  placeholder="e.g. Tech Giant, Startup"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-1.5 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                />
              </div>

              <button
                id="btn-reg-submit"
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 mt-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm transition-colors cursor-pointer text-sm"
              >
                Create Account & Go
              </button>
            </form>
          )}

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Grad-auth state keeps session local to browser.
          </div>
        </div>
      </div>
    </div>
  );
}
