import React, { useState, useMemo, useEffect } from 'react';
import { InterviewStory, InterviewTip, UserProfile } from '../types';
import { INITIAL_STORIES, INITIAL_TIPS } from '../data';
import { Search, Filter, Bookmark, BookOpen, Clock, Layers, Star, ExternalLink, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';

interface StoriesTipsProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  initialShowBookmarked?: boolean;
  onClearInitialShowBookmarked?: () => void;
}

export default function StoriesTips({ 
  profile, 
  onUpdateProfile,
  initialShowBookmarked,
  onClearInitialShowBookmarked
}: StoriesTipsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [activeTipTab, setActiveTipTab] = useState<'all' | 'before' | 'during' | 'after'>('all');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  useEffect(() => {
    if (initialShowBookmarked) {
      setShowBookmarkedOnly(true);
      if (onClearInitialShowBookmarked) {
        onClearInitialShowBookmarked();
      }
    }
  }, [initialShowBookmarked, onClearInitialShowBookmarked]);

  // Dynamic interview stories and tips
  const [stories, setStories] = useState<InterviewStory[]>(INITIAL_STORIES);
  const [tips, setTips] = useState<InterviewTip[]>(INITIAL_TIPS);
  const [loading, setLoading] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Dynamically load tailored job-specific stories and tips via backend Gemini endpoint
  useEffect(() => {
    let active = true;
    const fetchPersonalized = async () => {
      if (!profile.targetRole || !profile.targetIndustry) {
        setStories(INITIAL_STORIES);
        setTips(INITIAL_TIPS);
        setIsSimulated(false);
        setApiError(null);
        return;
      }
      setLoading(true);
      setApiError(null);
      try {
        const resp = await fetch('/api/personalized-stories-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRole: profile.targetRole,
            targetIndustry: profile.targetIndustry,
            targetCompanyType: profile.targetCompanyType
          })
        });
        if (resp.ok && active) {
          const data = await resp.json();
          setIsSimulated(false);
          setApiError(null);
          // If the user has a target role, use ONLY the customized tailored ones so they are 100% relevant.
          if (data.stories && data.stories.length > 0) {
            setStories(data.stories);
          } else {
            setStories(INITIAL_STORIES);
          }
          if (data.tips && data.tips.length > 0) {
            setTips(data.tips);
          } else {
            setTips(INITIAL_TIPS);
          }
        } else if (active) {
          const data = await resp.json().catch(() => ({}));
          setApiError(data.error || `Server returned status ${resp.status}`);
          setIsSimulated(true);
          setStories(INITIAL_STORIES);
          setTips(INITIAL_TIPS);
        }
      } catch (err: any) {
        console.error("Error loading mock stories/tips:", err);
        if (active) {
          setApiError(err.message || "Failed to connect to the Gemini API.");
          setIsSimulated(true);
          setStories(INITIAL_STORIES);
          setTips(INITIAL_TIPS);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPersonalized();
    return () => {
      active = false;
    };
  }, [profile.targetRole, profile.targetIndustry, profile.targetCompanyType]);

  // Derive available filters
  const industries = useMemo(() => {
    const list = new Set(stories.map(s => s.industry));
    return ['All', ...Array.from(list)];
  }, [stories]);

  const roles = useMemo(() => {
    const list = new Set(stories.map(s => s.role));
    return ['All', ...Array.from(list)];
  }, [stories]);

  // Filter and Search Stories
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = 
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesIndustry = selectedIndustry === 'All' || story.industry.toLowerCase() === selectedIndustry.toLowerCase();
      const matchesRole = selectedRole === 'All' || story.role.toLowerCase() === selectedRole.toLowerCase();
      const matchesBookmark = !showBookmarkedOnly || profile.savedStories.includes(story.id);

      return matchesSearch && matchesIndustry && matchesRole && matchesBookmark;
    });
  }, [stories, searchTerm, selectedIndustry, selectedRole, showBookmarkedOnly, profile.savedStories]);

  // Handle Bookmarks Stories
  const toggleBookmarkStory = (storyId: string) => {
    const isSaved = profile.savedStories.includes(storyId);
    let updatedStories = [...profile.savedStories];
    if (isSaved) {
      updatedStories = updatedStories.filter(id => id !== storyId);
    } else {
      updatedStories.push(storyId);
    }
    
    const updated = { ...profile, savedStories: updatedStories };
    onUpdateProfile(updated);
  };

  // Handle Bookmarks Tips
  const toggleBookmarkTip = (tipId: string) => {
    const isSaved = profile.savedTips.includes(tipId);
    let updatedTips = [...profile.savedTips];
    if (isSaved) {
      updatedTips = updatedTips.filter(id => id !== tipId);
    } else {
      updatedTips.push(tipId);
    }
    const updated = { ...profile, savedTips: updatedTips };
    onUpdateProfile(updated);
  };

  // Personalized dynamic recommendations (FR-1.5)
  // Recommends stories matching BOTH or EITHER target role or target industry
  const recommendedStories = useMemo(() => {
    return stories.filter(s => {
      const matchRole = s.role.toLowerCase().includes(profile.targetRole.toLowerCase()) || 
                        profile.targetRole.toLowerCase().includes(s.role.toLowerCase());
      const matchIndustry = s.industry.toLowerCase() === profile.targetIndustry.toLowerCase();
      return matchRole || matchIndustry;
    }).slice(0, 2); // Show top 2 recommendations
  }, [stories, profile.targetRole, profile.targetIndustry]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dynamic Career Guidance Callout - Sleek Dark Bento Card */}
      <div id="personalized-recommendation-deck" className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <Star className="w-4 h-4 fill-blue-500/20 text-blue-400" /> Personalized Career Recommendation
          </div>
          <h2 id="recommendation-header" className="text-xl font-extrabold text-white">
            Suggested for your target: <span className="text-blue-400">{profile.targetRole}</span> in <span className="text-emerald-400">{profile.targetIndustry}</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Based on your career settings, we prioritized relevant experience logs and success stories from graduates who signed offers in the {profile.targetIndustry} sector.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
          {loading ? (
            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/60 shadow-xs max-w-xs animate-pulse">
              <Sparkles className="w-5 h-5 text-blue-400 animate-spin" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white">Customizing narrative...</p>
                <p className="text-[10px] text-slate-400">Tailoring to {profile.targetRole}</p>
              </div>
            </div>
          ) : (
            recommendedStories.map(rs => (
              <div 
                key={rs.id} 
                id={`rec-item-${rs.id}`}
                className="bg-slate-800 p-3.5 rounded-xl border border-slate-700/60 shadow-sm max-w-xs text-xs space-y-1.5 hover:border-blue-500 transition-colors"
              >
                <div className="font-bold text-white line-clamp-1">{rs.title}</div>
                <div className="text-slate-400 flex justify-between gap-4 text-[11px]">
                  <span>{rs.role}</span>
                  <span className="font-extrabold text-blue-400">{rs.companyType}</span>
                </div>
                {rs.source && (
                  <div className="text-[10px] text-amber-400 truncate pt-1 border-t border-slate-700/60">
                    Source: {rs.source}
                  </div>
                )}
              </div>
            ))
          )}
          {!loading && recommendedStories.length === 0 && (
            <div className="text-xs text-slate-400 bg-slate-800 px-4 py-2 rounded-xl italic">
              No matching story found. Go to profile to set your target role.
            </div>
          )}
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex justify-between items-start text-xs text-rose-850">
          <div className="flex gap-3">
            <span className="text-base select-none">❌</span>
            <div>
              <span className="font-bold block text-sm mb-1 text-rose-900">Google Gemini API Connection Issue:</span>
              <p className="leading-relaxed">{apiError}</p>
              <p className="mt-2 text-[11px] text-slate-500 font-medium">
                Using default pre-cached stories & tips. Please verify your <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-semibold font-mono">GEMINI_API_KEY</code> is correctly configured in the <strong className="text-slate-750">Settings &gt; Secrets</strong> panel of Google AI Studio.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setApiError(null)} 
            className="text-rose-400 hover:text-rose-700 font-bold px-2 select-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fallback Simulation Notice */}
      {isSimulated && !apiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800 animate-pulse">
          <span className="text-base select-none">⚠️</span>
          <div>
            <span className="font-bold">Gemini API Rate-Limit / Demand Spike:</span> Handled gracefully! We loaded verified, high-quality professional interview stories and tips matching your target profile from our database so your preparation remains uninterrupted.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Interview Stories Browser */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 id="browser-title" className="text-2xl font-extrabold text-slate-900 tracking-tight">Professional Interview Stories</h1>
              <p className="text-xs text-slate-500">Read anonymous success narratives from senior hires and fresh grads</p>
            </div>
            
            <button
              id="btn-toggle-bookmarks"
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer select-none transition-all ${
                showBookmarkedOnly 
                  ? 'bg-blue-600 border-blue-750 text-white shadow-xs' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showBookmarkedOnly ? 'fill-current' : ''}`} />
              {showBookmarkedOnly ? 'Show All Stories' : 'Bookmarked Only'}
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
            
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="story-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stories, companies, or roles..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Industry Filter */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <select
                id="filter-industry"
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="rounded-lg border border-slate-200 text-xs py-1.5 px-2 bg-white text-slate-750 focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Industries</option>
                {industries.filter(i => i !== 'All').map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                id="filter-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="rounded-lg border border-slate-200 text-xs py-1.5 px-2 bg-white text-slate-755 focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Roles</option>
                {roles.filter(r => r !== 'All').map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stories List */}
          <div className="space-y-4">
            {filteredStories.map(story => {
              const isBookmarked = profile.savedStories.includes(story.id);
              return (
                <div 
                  key={story.id} 
                  id={`story-card-${story.id}`}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-350 shadow-sm p-6 relative transition-all"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase tracking-wide">
                      {story.industry}
                    </span>
                    <button
                      id={`bookmark-btn-${story.id}`}
                      onClick={() => toggleBookmarkStory(story.id)}
                      className="text-slate-400 hover:text-amber-500 cursor-pointer pr-1"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    </button>
                  </div>

                  <h3 id={`story-title-${story.id}`} className="text-lg font-bold text-slate-900 leading-tight">
                    {story.title}
                  </h3>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap text-xs text-slate-400 gap-3 mt-2 mb-4 items-center">
                    <span className="font-bold text-slate-700">{story.role}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-extrabold">{story.companyType}</span>
                    <span>•</span>
                    <span>Released {story.date}</span>
                    {story.source && (
                      <>
                        <span>•</span>
                        <span className="bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded text-[10px] border border-amber-200 uppercase tracking-wider">
                          Real Source: {story.source}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Prose Content */}
                  <p className="text-xs text-slate-600 mb-4 whitespace-pre-wrap leading-relaxed">
                    {story.content}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                      <h4 className="text-[11px] font-extrabold text-rose-800 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                        ⚠️ Key Mistakes Made
                      </h4>
                      <ul className="list-disc pl-4 text-xs text-rose-700 space-y-1">
                        {story.mistakes.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <h4 className="text-[11px] font-extrabold text-emerald-800 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                        💡 Placement Wins
                      </h4>
                      <ul className="list-disc pl-4 text-xs text-emerald-700 space-y-1">
                        {story.successTips.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredStories.length === 0 && (
              <div id="no-stories-state" className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-slate-700 font-bold">No Stories Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try widening your keyword filters or check back later for more placement additions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Tab: Categorized Interview Tips (FR-1.3 & FR-1.4) */}
        <div className="space-y-4">
          <div>
            <h1 id="tips-title" className="text-2xl font-extrabold text-slate-900 tracking-tight">Interview Tips</h1>
            <p className="text-xs text-slate-500 font-sans">Time-tested guidelines from recruiters</p>
          </div>

          {/* Quick filter tabs */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1 shadow-xs">
            {['all', 'before', 'during', 'after'].map((tab) => (
              <button
                key={tab}
                id={`tips-tab-${tab}`}
                onClick={() => setActiveTipTab(tab as any)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                  activeTipTab === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-150 text-xs text-blue-800 animate-pulse">
                <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
                <span>AI is customizing stories & expert tips for <strong>{profile.targetRole}</strong>...</span>
              </div>
            )}
            {tips.filter(tip => activeTipTab === 'all' || tip.category === activeTipTab).map(tip => {
              const isSaved = profile.savedTips.includes(tip.id);
              return (
                <div 
                  key={tip.id} 
                  id={`tip-card-${tip.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative hover:border-slate-350 transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                      tip.category === 'before' ? 'bg-blue-50 text-blue-700' :
                      tip.category === 'during' ? 'bg-violet-50 text-violet-750' : 'bg-pink-50 text-pink-700'
                    }`}>
                      {tip.category} the interview
                    </span>
                    <button
                      id={`tip-bookmark-${tip.id}`}
                      onClick={() => toggleBookmarkTip(tip.id)}
                      className="text-slate-300 hover:text-amber-500 cursor-pointer"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    </button>
                  </div>

                  <h3 id={`tip-title-head-${tip.id}`} className="text-sm font-bold text-slate-800 leading-tight">
                    {tip.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 mb-2">
                    {tip.description}
                  </p>
                  {tip.source && (
                    <div className="text-[10px] bg-slate-50 border border-slate-150 text-slate-600 px-2.5 py-1 rounded-xl mb-3 flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-400 text-[9px] tracking-wider uppercase shrink-0">Source:</span>
                      <span className="font-medium italic truncate">{tip.source}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                    {tip.actions.map((act, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-slate-600 leading-normal">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
