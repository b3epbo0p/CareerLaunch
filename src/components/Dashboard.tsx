import React, { useMemo } from 'react';
import { UserProfile, MockInterviewSession, InterviewStory, InterviewTip } from '../types';
import { INITIAL_STORIES, INITIAL_TIPS } from '../data';
import { AreaChart, TrendingUp, Award, Bookmark, Calendar, ArrowRight, BookOpen, Star, RefreshCw, ChevronRight } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  pastSessions: MockInterviewSession[];
  onSetTab: (tab: 'dashboard' | 'stories' | 'generator' | 'coach', showBookmarked?: boolean) => void;
}

export default function Dashboard({ profile, pastSessions, onSetTab }: DashboardProps) {
  
  // Stats derivations
  const averageScore = useMemo(() => {
    if (pastSessions.length === 0) return 0;
    const total = pastSessions.reduce((sum, s) => sum + s.overallScore, 0);
    return Math.round(total / pastSessions.length);
  }, [pastSessions]);

  const savedStoriesList = useMemo(() => {
    return INITIAL_STORIES.filter(s => profile.savedStories.includes(s.id));
  }, [profile.savedStories]);

  const savedTipsList = useMemo(() => {
    return INITIAL_TIPS.filter(t => profile.savedTips.includes(t.id));
  }, [profile.savedTips]);

  // Sparkline data for SVG score trends (FR-5.2)
  const scoreTrendPoints = useMemo(() => {
    if (pastSessions.length === 0) return "";
    
    // Reverse historical points if sorted chronologically, lets assume they are sorted by date
    const scores = pastSessions.map(s => s.overallScore).reverse();
    const width = 300;
    const height = 120;
    if (scores.length === 1) {
      return `M 0,${height - scores[0]} L ${width},${height - scores[0]}`;
    }

    const stepX = width / (scores.length - 1);
    return scores.map((score, sIdx) => {
      const x = sIdx * stepX;
      // Map 0-100 score to 0-120px height with padding
      const y = height - (score / 100) * (height - 20) - 10;
      return `${sIdx === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(" ");
  }, [pastSessions]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Target Role & Welcome Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Professional Placement Track
          </div>
          <h2 id="welcome-header" className="text-3xl font-extrabold text-white leading-tight font-sans">
            Welcome back, {profile.name}!
          </h2>
          <p className="text-slate-300 text-sm max-w-xl font-sans">
            Your profile targets a <strong className="text-white">{profile.targetRole}</strong> role in the <strong className="text-white">{profile.targetIndustry}</strong> sector. Let's practice to secure top placements.
          </p>
        </div>

        {/* Action Call */}
        <div className="flex gap-3 relative z-10 shrink-0">
          <button
            id="dash-btn-launch-generator"
            onClick={() => onSetTab('generator')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold transition-all cursor-pointer text-xs uppercase tracking-wider border border-slate-700 select-none"
          >
            Create Questions
          </button>
          <button
            id="dash-btn-launch-coach"
            onClick={() => onSetTab('coach')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/40 select-none transition-all cursor-pointer text-xs uppercase tracking-wider"
          >
            Practice Mocks
          </button>
        </div>
        
        {/* Background ambient lighting blobs */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
      </div>

      {/* Metrics Row (FR-5.1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <button
          type="button"
          id="stat-card-total-mocks"
          onClick={() => onSetTab('coach')}
          className="w-full bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:border-blue-400 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-left select-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Total Mock Sessions</span>
            <h3 id="stat-total-mocks-val" className="text-3xl font-extrabold text-slate-800 mt-1">{pastSessions.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Evaluated corporate mock trials</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </button>

        {/* Metric 2 */}
        <button
          type="button"
          id="stat-card-average-score"
          onClick={() => onSetTab('coach')}
          className="w-full bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:border-blue-400 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-left select-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Average Score</span>
            <h3 id="stat-average-score-val" className="text-3xl font-extrabold text-blue-600 mt-1">{averageScore}%</h3>
            <p className="text-[10px] text-slate-400 mt-1">Based on answer structure metrics</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </button>

        {/* Metric 3 */}
        <button
          type="button"
          id="stat-card-bookmarks"
          onClick={() => onSetTab('stories', true)}
          className="w-full bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:border-blue-400 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-left select-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <div>
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Saved Resources</span>
            <h3 id="stat-bookmarks-val" className="text-3xl font-extrabold text-slate-800 mt-1">
              {profile.savedStories.length + profile.savedTips.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Stories and curated tips items</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Bookmark className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* Analytics & Progression Curve Block (FR-5.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Analytics Curve Line graph */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 id="analytics-header" className="font-bold text-slate-800 text-lg">Performance Improvements Over Time</h3>
            <p className="text-xs text-slate-500 mt-0.5">Track how your structure and technical parameters grow with practice sessions.</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between" style={{ height: '220px' }}>
            {pastSessions.length >= 2 ? (
              <div className="relative flex-1 flex items-center justify-center mt-3">
                <svg className="w-full h-full max-h-[140px]" viewBox="0 0 300 120" preserveAspectRatio="none">
                  {/* Grid paths */}
                  <line x1="0" y1="10" x2="300" y2="10" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="110" x2="300" y2="110" stroke="#e2e8f0" strokeWidth="1" />
                  
                  {/* Scoring progress trend line */}
                  <path
                    d={scoreTrendPoints}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Highlight dots */}
                  {pastSessions.map((s, idx) => {
                    const stepX = 300 / (pastSessions.length - 1);
                    const x = idx * stepX;
                    const y = 120 - (s.overallScore / 100) * 100 - 10;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="5.5"
                        className="fill-white stroke-blue-600 stroke-[3]"
                      />
                    );
                  })}
                </svg>
                {/* Visual axis scales */}
                <div className="absolute left-1 h-full flex flex-col justify-between text-[8px] text-slate-400 font-mono py-1">
                  <span>100% (High readiness)</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
              </div>
            ) : (
              <div id="blank-analytics-state" className="flex-grow flex flex-col items-center justify-center text-center p-4">
                <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
                <h4 className="text-slate-700 text-xs font-bold font-sans">Awaiting more data curves</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                  Conduct at least 2 complete mock interviews to plot progress analytics scores.
                </p>
              </div>
            )}

            {/* Bottom guide labels */}
            <div className="border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 pt-2.5">
              <span>Chronological history points (early → recent/current)</span>
              <span className="font-semibold text-blue-600">Metric factor: Answer Scoring</span>
            </div>
          </div>
        </div>

        {/* Saved Articles Shelf */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 id="bookmarks-shelf-title" className="font-bold text-slate-800 text-md">Saved Resources Shelf</h3>
            <p className="text-xs text-slate-500 mt-0.5">Bookmarked content sheets</p>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            
            {savedStoriesList.map(st => (
              <div 
                key={st.id} 
                onClick={() => onSetTab('stories')}
                className="bg-slate-50 hover:bg-slate-100/70 border border-slate-150 hover:border-slate-200 p-3 rounded-xl transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">{st.title}</div>
                  <div className="text-[10px] text-blue-600 font-semibold">{st.role} placement</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}

            {savedTipsList.map(tp => (
              <div 
                key={tp.id} 
                onClick={() => onSetTab('stories')}
                className="bg-slate-50 hover:bg-slate-100/70 border border-slate-150 hover:border-slate-200 p-3 rounded-xl transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">{tp.title}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">{tp.category} phase</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}

            {savedStoriesList.length === 0 && savedTipsList.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                No bookmarked items. Explore 'Real Stories & Tips' tab to add items.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
