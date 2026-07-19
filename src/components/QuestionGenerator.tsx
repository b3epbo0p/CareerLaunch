import React, { useState, useEffect } from 'react';
import { GeneratedQuestion, QuestionSet, UserProfile } from '../types';
import { Sparkles, Save, FileDown, RefreshCw, Layers, Clipboard, HelpCircle, Check, Printer } from 'lucide-react';

interface QuestionGeneratorProps {
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export default function QuestionGenerator({ profile, onUpdateProfile }: QuestionGeneratorProps) {
  // Input states
  const [jobTitle, setJobTitle] = useState(profile.targetRole || '');
  const [industry, setIndustry] = useState(profile.targetIndustry || '');
  const [level, setLevel] = useState('Fresh Graduate');
  const [jobDescription, setJobDescription] = useState('');
  
  // App states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionSet, setCurrentQuestionSet] = useState<QuestionSet | null>(() => {
    try {
      const cached = localStorage.getItem(`interview_last_generated_set_${profile.email}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [lastGeneratedRole, setLastGeneratedRole] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(`interview_last_generated_set_${profile.email}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.jobTitle || '';
      }
    } catch {}
    return '';
  });

  const [lastGeneratedIndustry, setLastGeneratedIndustry] = useState<string>(() => {
    try {
      const cached = localStorage.getItem(`interview_last_generated_set_${profile.email}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.industry || '';
      }
    } catch {}
    return '';
  });

  const [savedSets, setSavedSets] = useState<QuestionSet[]>(() => {
    return JSON.parse(localStorage.getItem('interview_saved_question_sets') || '[]');
  });
  
  // UI states
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, boolean>>(() => {
    try {
      const cached = localStorage.getItem(`interview_last_generated_set_${profile.email}`);
      if (cached) {
        const parsed = JSON.parse(cached) as QuestionSet;
        const initialSelected: Record<string, boolean> = {};
        parsed.questions.forEach(q => {
          initialSelected[q.id] = true;
        });
        return initialSelected;
      }
    } catch {}
    return {};
  });

  // Call API to generate questions
  const generateQuestions = async (overrideRole?: string, overrideIndustry?: string) => {
    const activeRole = (overrideRole && typeof overrideRole === 'string') ? overrideRole : jobTitle;
    const activeIndustry = (overrideIndustry && typeof overrideIndustry === 'string') ? overrideIndustry : industry;

    if (!activeRole || !activeIndustry) {
      alert("Please enter both Job Title and Industry.");
      return;
    }

    setLoading(true);
    setIsSavedLocally(false);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: activeRole,
          industry: activeIndustry,
          level,
          jobDescription
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server returned status ${response.status}`);
      }
      
      if (data.questions) {
        const newSet: QuestionSet = {
          id: `qs-${Date.now()}`,
          jobTitle: activeRole,
          industry: activeIndustry,
          level,
          jobDescription,
          questions: data.questions,
          generatedAt: new Date().toLocaleDateString(),
          isSimulated: data.isSimulated || false
        };
        setCurrentQuestionSet(newSet);
        setLastGeneratedRole(activeRole);
        setLastGeneratedIndustry(activeIndustry);

        // Cache this as the last generated set for this user to enable instant tab-switches
        localStorage.setItem(`interview_last_generated_set_${profile.email}`, JSON.stringify(newSet));
        
        // Auto-select all for exports
        const initialSelected: Record<string, boolean> = {};
        newSet.questions.forEach(q => {
          initialSelected[q.id] = true;
        });
        setSelectedQuestions(initialSelected);
      }
    } catch (err: any) {
      console.error("Failed to generate questions:", err);
      setError(err.message || "Failed to generate questions. Please verify your GEMINI_API_KEY is configured.");
    } finally {
      setLoading(false);
    }
  };

  // Sync inputs with profile and automatically regenerate when the job role or industry changes
  useEffect(() => {
    const updatedRole = profile.targetRole || '';
    const updatedIndustry = profile.targetIndustry || '';

    if (!updatedRole || !updatedIndustry) return;

    // Sync input states
    setJobTitle(updatedRole);
    setIndustry(updatedIndustry);

    // If no questions generated yet, or role or industry differs from what was last generated, automatically trigger regeneration
    if (!currentQuestionSet || updatedRole !== lastGeneratedRole || updatedIndustry !== lastGeneratedIndustry) {
      generateQuestions(updatedRole, updatedIndustry);
    }
  }, [profile.targetRole, profile.targetIndustry]);

  // Automatically sync local input changes back to profile and regenerate questions with debounce
  useEffect(() => {
    const trimmedJobTitle = jobTitle.trim();
    const trimmedIndustry = industry.trim();

    if (!trimmedJobTitle || !trimmedIndustry) return;

    // Only trigger if different from profile values
    if (trimmedJobTitle === profile.targetRole && trimmedIndustry === profile.targetIndustry) {
      return;
    }

    const timer = setTimeout(() => {
      const updatedProfile = {
        ...profile,
        targetRole: trimmedJobTitle,
        targetIndustry: trimmedIndustry,
      };
      onUpdateProfile(updatedProfile);
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [jobTitle, industry, profile, onUpdateProfile]);

  // Save the complete set to profile tracking
  const handleSaveSet = () => {
    if (!currentQuestionSet) return;

    const exists = savedSets.some(s => s.id === currentQuestionSet.id);
    if (exists) return;

    const updatedSets = [currentQuestionSet, ...savedSets];
    setSavedSets(updatedSets);
    localStorage.setItem('interview_saved_question_sets', JSON.stringify(updatedSets));

    // Update profile saved sets tracking
    const updatedProfileSets = [...profile.savedQuestionSets, currentQuestionSet.id];
    const updatedProfile = { ...profile, savedQuestionSets: updatedProfileSets };
    onUpdateProfile(updatedProfile);

    setIsSavedLocally(true);
  };

  // Delete a saved set
  const handleDeleteSet = (id: string) => {
    const updatedSets = savedSets.filter(s => s.id !== id);
    setSavedSets(updatedSets);
    localStorage.setItem('interview_saved_question_sets', JSON.stringify(updatedSets));

    const updatedProfileSets = profile.savedQuestionSets.filter(savedId => savedId !== id);
    const updatedProfile = { ...profile, savedQuestionSets: updatedProfileSets };
    onUpdateProfile(updatedProfile);
  };

  // Copy to Clipboard
  const handleCopyToClipboard = () => {
    if (!currentQuestionSet) return;

    let textToCopy = `INTERVIEW QUESTIONS SHEET: ${currentQuestionSet.jobTitle} (${currentQuestionSet.industry})\n`;
    textToCopy += `Generated on: ${currentQuestionSet.generatedAt}\n\n`;

    currentQuestionSet.questions.forEach((q, index) => {
      textToCopy += `${index + 1}. [${q.category}] ${q.text}\n`;
      textToCopy += `   Intent: ${q.intent}\n`;
      textToCopy += `   Key Points to Mention:\n`;
      q.suggestedPoints.forEach(p => {
        textToCopy += `     - ${p}\n`;
      });
      textToCopy += `\n`;
    });

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export questions as beautifully formatted plain text / trigger native PDF print layout (FR-2.6)
  const handleExportPDF = () => {
    if (!currentQuestionSet) return;
    
    // Create an elegant print window structure for clean export formatting
    const printContent = `
      <html>
        <head>
          <title>Interview Questions - ${currentQuestionSet.jobTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; }
            .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #4f46e5; margin: 0; }
            .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
            .category-box { margin-bottom: 25px; page-break-inside: avoid; }
            .category-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #1e1b4b; background: #e0e7ff; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-bottom: 12px; }
            .question-text { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
            .info-block { font-size: 13px; margin-left: 15px; margin-bottom: 5px; }
            .info-label { font-weight: bold; color: #64748b; }
            .bullets { margin-left: 15px; margin-top: 5px; padding-left: 20px; font-size: 13px; color: #334155; }
            .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${currentQuestionSet.jobTitle} Prep Questions</h1>
            <div class="meta">Sector: ${currentQuestionSet.industry} | Generated on: ${currentQuestionSet.generatedAt}</div>
          </div>
          
          ${currentQuestionSet.questions.map((q, idx) => `
            <div class="category-box">
              <div class="category-title">${q.category} Question</div>
              <div class="question-text">${idx + 1}. ${q.text}</div>
              <div class="info-block">
                <span class="info-label">Interviewer Intent:</span> ${q.intent}
              </div>
              <div class="info-block" style="font-weight: 600; color: #4f46e5; margin-top: 8px;">Key Points You Should Outline:</div>
              <ul class="bullets">
                ${q.suggestedPoints.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
          
          <div class="footer">
            Graduate Interview Success Platform • Prepare. Practice. Succeed.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    // Trigger PDF download dynamically via a raw blob in standard browsers
    const fileContent = `
========================================
GRADUATE INTERVIEW SUCCESS PLATFORM
========================================
JOB TARGET: ${currentQuestionSet.jobTitle}
INDUSTRY: ${currentQuestionSet.industry}
GENERATED DATE: ${currentQuestionSet.generatedAt}
========================================

${currentQuestionSet.questions.map((q, idx) => `
Q${idx + 1} [${q.category}]
Question: ${q.text}
Interviewer Intent: ${q.intent}
Actions/Key Talking Points to Include:
${q.suggestedPoints.map(p => ` - ${p}`).join('\n')}
----------------------------------------
`).join('\n')}
`;
    // Standard quick text file download as well for high-accessibility
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Qset_${currentQuestionSet.jobTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also try opening the direct print-ready context in a target-friendly frame
    try {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(printContent);
        printWin.document.close();
      }
    } catch(err) {
      console.log("Iframe isolated print triggered fallback text file.");
    }
  };  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input parameters panel - Bento themed deep slate bg-slate-900 */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm space-y-6 h-fit">
          <div>
            <h2 id="generator-setup-title" className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Target Job Setup
            </h2>
            <p className="text-xs text-slate-400 mt-1">Configure your dream posting structure to compile dynamic prep sheets.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Dream Job Title
              </label>
              <input
                id="gen-job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Associate Product Analyst"
                className="mt-1 block w-full bg-slate-800 border-none rounded-lg text-sm px-3 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Target Sector / Industry
              </label>
              <input
                id="gen-industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology, Healthcare"
                className="mt-1 block w-full bg-slate-800 border-none rounded-lg text-sm px-3 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-amber-400 font-semibold">💡 Tip:</span> Please be highly specific with your target sector/industry. Entering a broad term like <em className="text-slate-300 not-italic">"Marketing"</em> is too generic, and the question generator won't know the exact type of marketing or sub-industry you are aiming for (e.g., specify <em className="text-blue-300 not-italic">"Digital B2B Marketing"</em> or <em className="text-blue-300 not-italic">"Healthcare Product Marketing"</em> instead).
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Experience Level
              </label>
              <input
                id="gen-level"
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. Fresh Graduate, Entry Level, Mid-Level, Senior"
                className="mt-1 block w-full bg-slate-800 border-none rounded-lg text-sm px-3 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none font-sans"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {['Fresh Graduate', 'Entry Level', 'Mid-Level', 'Senior'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      level === lvl
                        ? 'bg-slate-700 border-blue-500 text-blue-400 font-bold'
                        : 'bg-slate-800/50 border-slate-750 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider flex justify-between">
                <span>Job Description (Optional)</span>
                <span className="text-[10px] text-slate-500 font-normal">Saves skills matching</span>
              </label>
              <textarea
                id="gen-job-desc"
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities or requirements from the posting here. We will extract concrete technical domains dynamically."
                className="mt-1 block w-full bg-slate-800 border-none rounded-lg text-xs leading-relaxed px-3 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
              ></textarea>
            </div>

            <button
              id="btn-trigger-generation"
              onClick={generateQuestions}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-slate-950 bg-white hover:bg-slate-100 font-bold transition-all cursor-pointer text-sm disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed select-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-900" /> Mining Skills...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-600" /> Generate Set
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Display Panel */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex justify-between items-start text-xs text-rose-850">
              <div className="flex gap-3">
                <span className="text-base select-none">❌</span>
                <div>
                  <span className="font-bold block text-sm mb-1 text-rose-900">Google Gemini API Connection Issue:</span>
                  <p className="leading-relaxed">{error}</p>
                  <p className="mt-2 text-[11px] text-slate-500 font-medium">
                    Please verify your <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-semibold font-mono">GEMINI_API_KEY</code> is correctly set in Google AI Studio via the <strong className="text-slate-750">Settings &gt; Secrets</strong> panel.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setError(null)} 
                className="text-rose-400 hover:text-rose-700 font-bold px-2 select-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {currentQuestionSet ? (
            <div id="active-question-board" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              {/* Header actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 id="generated-role-badge" className="text-xl font-bold text-slate-900">{currentQuestionSet.jobTitle}</h3>
                  <p className="text-xs text-slate-500">Sector: {currentQuestionSet.industry}{currentQuestionSet.level ? ` • Level: ${currentQuestionSet.level}` : ''} | Created {currentQuestionSet.generatedAt}</p>
                </div>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    id="btn-copy-clipboard"
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5 text-slate-500" />}
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    id="btn-save-sheet"
                    onClick={handleSaveSet}
                    disabled={isSavedLocally}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      isSavedLocally 
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' 
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavedLocally ? 'Saved to Dashboard' : 'Save Set'}
                  </button>
                  <button
                    id="btn-export-txt"
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Export Sheet
                  </button>
                </div>
              </div>

              {/* Fallback Simulation Notice */}
              {currentQuestionSet.isSimulated && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800 animate-pulse">
                  <span className="text-base select-none">⚠️</span>
                  <div>
                    <span className="font-bold">Gemini API Rate-Limit (429 Quota Exceeded):</span> Handled gracefully! We loaded verified, high-quality professional interview preparative questions from our database to avoid any interruption in your preparation.
                  </div>
                </div>
              )}

              {/* Questions Rendered by Categories */}
              <div className="space-y-4">
                {currentQuestionSet.questions.map((q, index) => {
                  return (
                    <div 
                      key={q.id} 
                      id={`gquestion-block-${q.id}`}
                      className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-slate-200 transition-all space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          q.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                          q.category === 'Behavioural' ? 'bg-amber-100 text-amber-750' :
                          q.category === 'Situational' ? 'bg-emerald-100 text-emerald-750' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {q.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Q#{index+1}</span>
                      </div>

                      <h4 id={`gquestion-text-${q.id}`} className="text-sm font-bold text-slate-850 leading-snug">
                        {q.text}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1.5 border-t border-slate-100">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interviewer Intent</div>
                          <p className="text-slate-600 mt-1 leading-normal">{q.intent}</p>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Suggested Actions / Topics</div>
                          <ul className="list-disc pl-4 text-slate-600 space-y-1 mt-1 leading-normal">
                            {q.suggestedPoints.map((p, pIdx) => (
                              <li key={pIdx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trigger Regeneration */}
              <div className="flex justify-center pt-2">
                <button
                  id="btn-regenerate-sheet"
                  onClick={generateQuestions}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-250 hover:bg-blue-50/50 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate Entire Sheet
                </button>
              </div>

            </div>
          ) : (
            <div id="blank-generator-state" className="bg-white rounded-2xl border border-dashed border-slate-200 h-96 flex flex-col justify-center items-center text-center p-6 shadow-xs">
              <HelpCircle className="w-16 h-16 text-slate-200 mb-3" />
              <h3 className="font-bold text-slate-700">Ready to Generate Questions</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                Provide your custom job role, sector, and any descriptions on the left pane. Our AI recruiter will compile a dynamic prep scorecard.
              </p>
            </div>
          )}

          {/* Saved Sheets Catalog */}
          {savedSets.length > 0 && (
            <div id="saved-question-sheets-deck" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Saved Prep Sheets ({savedSets.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSets.map(set => (
                  <div 
                    key={set.id} 
                    id={`saved-card-${set.id}`}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 flex justify-between items-center transition-colors bg-slate-50"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{set.jobTitle}</h4>
                      <p className="text-[10px] text-slate-500">{set.industry}{set.level ? ` • ${set.level}` : ''} • {set.generatedAt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-load-saved-${set.id}`}
                        onClick={() => {
                          setCurrentQuestionSet(set);
                          // Auto-select keys
                          const initialS: Record<string, boolean> = {};
                          set.questions.forEach(q => { initialS[q.id] = true; });
                          setSelectedQuestions(initialS);
                          setIsSavedLocally(true);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Load Sheet
                      </button>
                      <button
                        id={`btn-delete-saved-${set.id}`}
                        onClick={() => handleDeleteSet(set.id)}
                        className="text-[10px] font-bold text-rose-550 hover:text-rose-700 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
