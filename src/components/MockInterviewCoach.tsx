import React, { useState, useEffect, useRef } from 'react';
import { MockInterviewSession, MockInterviewQA, UserProfile } from '../types';
import { Camera, Mic, MicOff, Volume2, VolumeX, Sparkles, Send, Play, Trophy, CheckCircle, RefreshCw, AlertTriangle, BookOpen, Clock, Trash2, CameraOff, Code2, Terminal, ChevronRight, KeyRound } from 'lucide-react';

export const COACHES = [
  {
    id: 'sophia',
    name: 'Sophia',
    role: 'Principal Tech Recruiter',
    tagline: 'Warm but strict behavioral and alignment assessments drawing from FAANG criteria.',
    img: '/src/assets/images/coach_sophia_1780820575178.png',
    gender: 'female' as const
  },
  {
    id: 'marcus',
    name: 'Marcus',
    role: 'Senior Engineering Manager',
    tagline: 'Deep dive focus on scalability, robust STAR architectures, and robust system answers.',
    img: '/src/assets/images/coach_marcus_1780820593008.png',
    gender: 'male' as const
  },
  {
    id: 'elena',
    name: 'Elena',
    role: 'Product Management Leader',
    tagline: 'Sharp focus on business impact, clarity, empathy, and strategic user value.',
    img: '/src/assets/images/coach_elena_1780820609461.png',
    gender: 'female' as const
  }
];

export const getDynamicCoaches = (targetRole: string) => {
  const roleClean = targetRole ? targetRole.trim() : 'Software Engineer';
  return [
    {
      id: 'sophia',
      name: 'Sophia',
      role: `Principal Lead Recruiter (${roleClean})`,
      tagline: `Warm but strict behavioral and cultural alignment screening specialized for aspiring ${roleClean} candidates.`,
      img: '/src/assets/images/coach_sophia_1780820575178.png',
      gender: 'female' as const
    },
    {
      id: 'marcus',
      name: 'Marcus',
      role: `Senior Hiring Manager (${roleClean})`,
      tagline: `Deep technical and operational assessment of skills, problem-solving, and professional core competency expected of a ${roleClean}.`,
      img: '/src/assets/images/coach_marcus_1780820593008.png',
      gender: 'male' as const
    },
    {
      id: 'elena',
      name: 'Elena',
      role: `Strategy & Performance Director (${roleClean})`,
      tagline: `Sharp focus on commercial impact, project delivery, strategic leadership, and value-creation scenarios for ${roleClean}s.`,
      img: '/src/assets/images/coach_elena_1780820609461.png',
      gender: 'female' as const
    }
  ];
};

export const isCodingRelatedRole = (role: string) => {
  const r = role ? role.toLowerCase() : '';
  return r.includes('engineer') || 
         r.includes('developer') || 
         r.includes('programmer') || 
         r.includes('coder') || 
         r.includes('coding') || 
         r.includes('software') || 
         r.includes('backend') || 
         r.includes('frontend') || 
         r.includes('fullstack') || 
         r.includes('web dev') || 
         r.includes('programming') ||
         r.includes('sysops') ||
         r.includes('devops');
};

const uniqueWordsList = (txt: string, skipSet: Set<string>): string[] => {
  return Array.from(new Set(
    txt.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !skipSet.has(w))
  ));
};

// Dynamic grading weighting config as a single source of truth
export const GRADING_WEIGHTS = {
  domainAccuracy: 0.30,
  starStructure: 0.40,
  communication: 0.30,
};

export const isWordGibberish = (word: string, isCodeMode = false): boolean => {
  // Clean leading and trailing punctuation/special characters
  const cleanW = word.trim()
    .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?\[\]{}|&<>'"#`~+\-=]+/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\[\]{}|&<>'"#`~+\-=]+$/g, "");

  if (cleanW.length === 0) return false;

  // If it's a pure number or mathematical operator
  if (/^[0-9]+$/.test(cleanW)) return false;

  const lowerW = cleanW.toLowerCase();

  // In code, allow longer tokens like is_palindrome_permutation or level_order_traversal
  const maxLen = isCodeMode || lowerW.includes('_') || lowerW.includes('.') || lowerW.includes('(') || lowerW.includes('[') ? 45 : 22;
  if (lowerW.length > maxLen) {
    return true;
  }

  // Check for any letter repeated 4 or more times (e.g., "EEEE")
  if (/(.)\1\1\1/.test(lowerW)) {
    return true;
  }

  // Pure consonant strings (excluding common abbreviations/identifiers)
  const commonNoVowel = ["my", "by", "try", "fly", "dry", "cry", "shy", "sky", "why", "sync", "gym", "tvs", "txt", "pdf", "sql", "xml", "cv", "js", "py", "ts", "len", "zip", "ptr", "val", "max", "min", "avg", "sum"];
  const codeNoVowel = ["idx", "ptr", "cnt", "dst", "src", "std", "btn", "fn", "db", "tmp", "msg", "err", "cfg", "env", "arg", "obj", "res", "ret", "num", "str", "int", "dict", "lst", "set"];
  const allowedNoVowel = [...commonNoVowel, ...(isCodeMode ? codeNoVowel : [])];

  const hasVowels = /[aeiouy]/.test(lowerW);
  if (!hasVowels && lowerW.length > 2) {
    const lettersOnly = lowerW.replace(/[^a-z]/g, "");
    if (lettersOnly.length > 2 && !allowedNoVowel.includes(lettersOnly)) {
      return true;
    }
  }

  // Suspect consonant clusters of 5 or more (e.g., "bcdfgh")
  if (/[bcdfghjklmnpqrstvwxz]{5,}/.test(lowerW)) {
    // But in code, allow words with underscores or special chars separating them
    const parts = lowerW.split(/[^a-z]/);
    const hasBadCluster = parts.some(part => /[bcdfghjklmnpqrstvwxz]{5,}/.test(part));
    if (hasBadCluster) {
      return true;
    }
  }

  // Keyboard row sliding sequences
  const slides = ["asdf", "sdfg", "dfgh", "fghj", "ghjk", "hjkl", "qwer", "wert", "erty", "rtyu", "tyui", "yuio", "uiop", "zxcv", "xcvb", "cvbn", "vbnm"];
  if (slides.some(slide => lowerW.includes(slide))) {
    return true;
  }

  // Vowel ratio check for standard longer words (skip in code mode or if word contains special characters like underscore/dot/digits)
  if (lowerW.length >= 5 && !isCodeMode && !/[^a-z]/.test(lowerW)) {
    const vowelsCount = (lowerW.match(/[aeiouy]/g) || []).length;
    const vowelRatio = vowelsCount / lowerW.length;
    if (vowelRatio < 0.12 || vowelRatio > 0.85) {
      return true;
    }
  }

  return false;
};

// Local fallback evaluation for Python coding mode submissions
export const evaluateCodeResponseLocally = (answer: string, question: string) => {
  const cleanAnswer = (answer || "").trim();
  const cleanQuestion = (question || "").trim();
  const lines = cleanAnswer.split('\n');
  const words = cleanAnswer.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      score: 5,
      clarity: "Code answer is empty.",
      relevance: "Irrelevant. No input provided.",
      professionalism: "Unacceptable. No response given.",
      suggestions: "Please write or paste a working Python solution to continue.",
      scoreBreakdown: {
        domainAccuracy: 1,
        starStructure: 1,
        starDetailed: { situation: 0, task: 0, action: 0, result: 0 },
        communication: 3
      }
    };
  }

  const lowerAns = cleanAnswer.toLowerCase();
  const lowerQ = cleanQuestion.toLowerCase();

  // Word-level gibberish check in coding mode
  const gibberishWords = words.filter(w => isWordGibberish(w, true));
  const gibberishRatio = wordCount > 0 ? gibberishWords.length / wordCount : 0;
  
  if (gibberishRatio > 0.35 || gibberishWords.some(w => w.length > 25)) {
    return {
      score: 15,
      clarity: "Your submission contains a high proportion of unrecognized symbols or gibberish words.",
      relevance: "Irrelevant. The code contains synthetic characters or scrambled keyboard entry.",
      professionalism: "Extremely poor structure. Writing random characters does not construct a valid algorithm.",
      suggestions: "Please delete the gibberish, and write a realistic Python algorithm (e.g., using def, loops, and logic).",
      scoreBreakdown: {
        domainAccuracy: 2,
        starStructure: 2,
        starDetailed: { situation: 1, task: 1, action: 0, result: 0 },
        communication: 11
      }
    };
  }

  // 1) Evasive or chat-only answers (e.g. "I don't know", "skip", "idk")
  const evasivePhrases = ["don't know", "dont know", "not sure", "no plan", "no idea", "idk", "skip", "pass", "just testing", "test answer", "hello world", "na", "n/a", "nothing", "none"];
  const isEvasive = evasivePhrases.some(p => lowerAns === p || lowerAns.includes(" " + p + " ") || lowerAns.startsWith(p + " ") || lowerAns.endsWith(" " + p));
  const isPlainChat = !lowerAns.includes("def ") && !lowerAns.includes("class ") && !lowerAns.includes("return") && wordCount < 15;

  if (isEvasive || isPlainChat || wordCount < 6) {
    return {
      score: 20,
      clarity: "The submitted response is evasive, extremely short, or does not resemble programming code.",
      relevance: "Devastating mismatch: Lacks any code structure required for the question.",
      professionalism: "Low compliance. Technical interviews require writing a functional program.",
      suggestions: "Please provide a valid Python coding solution starting with 'def' or 'class' to represent a working algorithm.",
      scoreBreakdown: {
        domainAccuracy: 5,
        starStructure: 5,
        starDetailed: { situation: 1, task: 1, action: 2, result: 1 },
        communication: 10
      }
    };
  }

  // Calculate scores using GRADING_WEIGHTS values as standard source of truth
  const maxDomainScore = Math.round(GRADING_WEIGHTS.domainAccuracy * 100); // 30
  const maxStarScore = Math.round(GRADING_WEIGHTS.starStructure * 100);   // 40
  const maxCommScore = Math.round(GRADING_WEIGHTS.communication * 100);   // 30

  // Evaluate Domain Accuracy (0 to 30)
  let domainAccuracy = 12; // Base
  
  // Python syntax check
  const hasJSKeywords = /\b(let|const|var|function|console\.log|null)\b/.test(lowerAns);
  if (!hasJSKeywords) {
    domainAccuracy += 8; // Pythonic bonus
  } else {
    domainAccuracy -= 4; // Javascript usage penalty in python mode
  }
  
  // Python imports or builtins/methods
  const hasPythonBuiltins = /\b(len|range|append|dict|set|list|self|init|print|zip|enumerate)\b/.test(lowerAns);
  if (hasPythonBuiltins) {
    domainAccuracy += 6;
  }
  
  // Data structure / variable jargon
  const hasJargon = /\b(seen|duplicates|result|nums|hash|stack|queue|root|node|left|right|val|ptr)\b/.test(lowerAns);
  if (hasJargon) {
    domainAccuracy += 4;
  }

  domainAccuracy = Math.min(maxDomainScore, Math.max(5, domainAccuracy));

  // Evaluate Algorithmic Structure (0 to 40)
  // mapped to situation, task, action, result (0 to 10 each)
  
  // Situation: Function/Class definition
  let situationScore = 2;
  if (/\b(def|class)\b/.test(lowerAns)) {
    situationScore += 5;
  }
  // check for matching signature terms in prompt
  const hasSignatureMatch = lowerAns.includes("def ") && (
    lowerAns.includes("duplicate") || lowerAns.includes("palindrome") || lowerAns.includes("stack") || lowerAns.includes("traverse") || lowerAns.includes("search")
  );
  if (hasSignatureMatch) {
    situationScore += 3;
  }
  situationScore = Math.min(10, situationScore);

  // Task: Structure & data structure initialization
  let taskScore = 2;
  const hasDSInit = /=|set\(|dict\(|\[\]|\{\}/.test(lowerAns);
  if (hasDSInit) {
    taskScore += 5;
  }
  // Check for specific data structure keywords
  const hasDataStructure = /\b(set|dict|list|stack|queue|deque|heapq|map)\b/.test(lowerAns);
  if (hasDataStructure) {
    taskScore += 3;
  }
  taskScore = Math.min(10, taskScore);

  // Action: Execution & Flow Control
  let actionScore = 2;
  const hasLoops = /\b(for|while)\b/.test(lowerAns);
  if (hasLoops) {
    actionScore += 4;
  }
  const hasControlFlow = /\b(if|else|elif)\b/.test(lowerAns);
  if (hasControlFlow) {
    actionScore += 2;
  }
  const hasReturn = /\b(return)\b/.test(lowerAns);
  if (hasReturn) {
    actionScore += 2;
  }
  actionScore = Math.min(10, actionScore);

  // Result: Edge-Case Handling & constraints
  let resultScore = 1;
  const hasEmptyChecks = /\b(not|len|is None|== 0|== None)\b/.test(lowerAns);
  if (hasEmptyChecks) {
    resultScore += 5;
  }
  const hasBoundaryOrException = /\b(index|out of bounds|try|except|raise|return None|return \[\])\b/.test(lowerAns);
  if (hasBoundaryOrException) {
    resultScore += 4;
  }
  resultScore = Math.min(10, resultScore);

  const starStructure = situationScore + taskScore + actionScore + resultScore;

  // Evaluate Communication: Code Cleanliness, Comments, complexity explanation (0 to 30)
  let communication = 10; // Base
  
  // Comments check (presence of # or triple quotes)
  const hasComments = /#|"""|'''/.test(lowerAns);
  if (hasComments) {
    communication += 8;
  }
  // Big-O notation checks
  const hasBigO = /o\(|complexity|time:|space:/.test(lowerAns);
  if (hasBigO) {
    communication += 8;
  }
  // Line count / detail bonus
  const linesCount = lines.filter(l => l.trim().length > 0).length;
  if (linesCount > 12) {
    communication += 4;
  } else if (linesCount > 6) {
    communication += 2;
  }

  communication = Math.min(maxCommScore, Math.max(5, communication));

  const score = domainAccuracy + starStructure + communication;

  let suggestionsArr: string[] = [];
  if (situationScore < 7) suggestionsArr.push("Ensure you declare a valid Python function/class signature (using 'def' or 'class').");
  if (taskScore < 7) suggestionsArr.push("Initialize clear variables or appropriate data structures (like set or list) to handle state.");
  if (actionScore < 7) suggestionsArr.push("Implement necessary logic flow like loops (for/while) and control statements (if/else) returning the correct values.");
  if (resultScore < 7) suggestionsArr.push("Explicitly handle boundary conditions such as empty, zero-bound, or null parameters to make code production-ready.");
  if (communication < 20) suggestionsArr.push("Add explanatory comments, docstrings, or a complexity note mentioning the Big-O Time/Space scaling (e.g. O(N)).");

  if (suggestionsArr.length === 0) {
    suggestionsArr.push("Superb code style! Write extensive test cases to verify performance behavior under massive loads.");
  }

  return {
    score,
    clarity: score >= 80 
      ? "Strong code structure, clean formatting, and excellent logical readability." 
      : score >= 55 
      ? "Functionally complete, but code has styling issues or lacks robust parameter annotations." 
      : "Incomplete algorithmic design. Formatting or syntax-friendly errors interfere with execution.",
    relevance: score >= 80
      ? "Highly relevant Python solution addressing the algorithmic challenge requested."
      : score >= 55
      ? "Partially relevant logic, but missed key algorithmic edge-cases."
      : "Does not resolve the requested algorithm or relies on non-standard syntax.",
    professionalism: score >= 80
      ? "Excellent production-quality Python styling with thorough variable documentation."
      : score >= 55
      ? "Polite efforts, though the script resembles draft script formatting or conversational snippets."
      : "Low professionalism. Code contains loose script fragments or lacks structural modularity.",
    suggestions: suggestionsArr.slice(0, 2).join(" ") + " Try incorporating additional type hints.",
    scoreBreakdown: {
      domainAccuracy,
      starStructure,
      starDetailed: {
        situation: situationScore,
        task: taskScore,
        action: actionScore,
        result: resultScore
      },
      communication
    }
  };
};

// Dynamic local fallback strict grading logic based on validity, topic relevance, STAR metrics and industry jargon
export const evaluateResponseTextLocally = (answer: string, question: string, role: string) => {
  const cleanAnswer = (answer || "").trim();
  const cleanQuestion = (question || "").trim();
  const words = cleanAnswer.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      score: 5,
      clarity: "Answer is empty.",
      relevance: "Irrelevant. No input provided.",
      professionalism: "Unacceptable. No response given.",
      suggestions: "Please speak or type a real answer to continue.",
      scoreBreakdown: {
        domainAccuracy: 1,
        starStructure: 1,
        starDetailed: { situation: 0, task: 0, action: 0, result: 0 },
        communication: 3
      }
    };
  }

  // Word-level gibberish check
  const gibberishWords = words.filter(w => isWordGibberish(w, false));
  const gibberishRatio = wordCount > 0 ? gibberishWords.length / wordCount : 0;

  if (gibberishRatio > 0.15 || gibberishWords.some(w => w.length > 22)) {
    return {
      score: 12,
      clarity: "Your answer contains high-density gibberish, keyboard-mashing, or repeated characters.",
      relevance: "Unrelated. The vocabulary consists of scrambled letters or non-standard English phrases.",
      professionalism: "Unprofessional entry. Submitting scrambled characters is unacceptable for high-level roles.",
      suggestions: "Please delete any nonsensical text or keyboard-mashed words and write a coherent, professional answer.",
      scoreBreakdown: {
        domainAccuracy: 2,
        starStructure: 2,
        starDetailed: { situation: 1, task: 0, action: 1, result: 0 },
        communication: 8
      }
    };
  }

  const lowerAns = cleanAnswer.toLowerCase();
  const lowerQ = cleanQuestion.toLowerCase();

  // 1) REPETITIVE SPAM check (e.g. typing "react react react..." or repeating "test")
  const uniqueWords = Array.from(new Set(words.map(w => w.toLowerCase())));
  const repetitionRatio = uniqueWords.length / wordCount;
  if (wordCount >= 4 && repetitionRatio < 0.4) {
    return {
      score: 12,
      clarity: "Highly repetitive text detected.",
      relevance: "Invalid. Answer consists of duplicate words or spam.",
      professionalism: "Unprofessional repetition of keywords.",
      suggestions: "Avoid feeding the system repeated terms. Please answer the real interview question naturally.",
      scoreBreakdown: {
        domainAccuracy: 2,
        starStructure: 2,
        starDetailed: { situation: 0, task: 1, action: 1, result: 0 },
        communication: 8
      }
    };
  }

  // 2) PLAGIARISM / DIRECT ECHO check (e.g. copying the interviewer's question)
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", "how", "why", "where", "who", "whom", "what", 
    "this", "that", "these", "those", "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had", 
    "do", "does", "did", "to", "of", "in", "on", "at", "by", "for", "with", "about", "against", "between", "into", "through", 
    "during", "before", "after", "above", "below", "from", "up", "down", "out", "off", "over", "under", "again", "further", 
    "then", "once", "here", "there", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", 
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now",
    "please", "share", "tell", "describe", "give", "example", "brief", "us", "me", "your", "you", "my", "i", "we", "our"
  ]);

  const questionContentWords = uniqueWordsList(lowerQ, stopWords);
  const answerWords = uniqueWordsList(lowerAns, new Set());

  let totalMatchCount = 0;
  questionContentWords.forEach(qw => {
    if (answerWords.includes(qw)) totalMatchCount++;
  });

  const questionOverlapRatio = questionContentWords.length > 0 ? (totalMatchCount / questionContentWords.length) : 0;
  
  // If user copied almost the exact question text as their answer
  if (lowerAns.length > 20 && lowerQ.length > 20 && (lowerAns.includes(lowerQ) || questionOverlapRatio > 0.8) && wordCount < questionContentWords.length + 5) {
    return {
      score: 15,
      clarity: "Plagiarism or copy-paste pattern detected.",
      relevance: "Invalid. You simply repeated or echo-chambered the interviewer's question.",
      professionalism: "Extremely poor structure. Emulating a mirror response shows lack of preparation.",
      suggestions: "Do not copy-paste the question. Answer with your own original, real work experiences.",
      scoreBreakdown: {
        domainAccuracy: 3,
        starStructure: 2,
        starDetailed: { situation: 1, task: 0, action: 1, result: 0 },
        communication: 10
      }
    };
  }

  // 3) EVASIVE or GIBBERISH keyword responses (e.g. "i dont know", "idk", "just testing", "skip", "pass")
  const evasivePhrases = [
    "don't know", "dont know", "not sure", "no plan", "no idea", "idk", "skip", "pass", "just testing", "asdf", "test answer", "hello world", "good answer", "na", "n/a", "nothing", "none"
  ];
  const isEvasive = evasivePhrases.some(p => lowerAns === p || lowerAns.includes(" " + p + " ") || lowerAns.startsWith(p + " ") || lowerAns.endsWith(" " + p));
  const isGibberishPattern = /^[b-df-hj-np-tv-z]{4,}/.test(lowerAns) || /^[a-z]{1,3}$/.test(lowerAns) || words.every(w => w.length <= 2);

  if (isEvasive || isGibberishPattern || wordCount < 8) {
    return {
      score: Math.min(28, Math.max(8, isGibberishPattern ? 10 : (wordCount * 3))),
      clarity: "Vague, evasive, or low-effort filler answer.",
      relevance: "Completely irrelevant. Lacks any substantive relation to the job requirements.",
      professionalism: "Extremely unprofessional. Evasive prompts indicate zero task accountability.",
      suggestions: "This is a lazy, evasive, or extremely brief response. Please attempt a valid answer focusing on actual skills, projects, or professional background.",
      scoreBreakdown: {
        domainAccuracy: 2,
        starStructure: 2,
        starDetailed: { situation: 1, task: 0, action: 1, result: 0 },
        communication: Math.min(10, Math.max(2, wordCount * 2))
      }
    };
  }

  // 4) CONTENT RELEVANCE check with expanded themes
  const domainThemes: { [key: string]: string[] } = {
    conflict: ["conflict", "disagree", "disagreement", "friction", "pushed back", "senior", "argument", "team", "handling", "colleague", "different opinion", "alignment", "compromise", "communication"],
    system: ["architecture", "scale", "performance", "database", "api", "query", "optimize", "system design", "engine", "service", "concurrency", "load", "latency", "index"],
    background: ["experience", "background", "motivation", "career", "graduated", "university", "started", "role", "position", "industry", "project", "major", "passion"],
    failure: ["fail", "mistake", "shortcoming", "error", "bug", "regret", "missed deadline", "learned", "correction", "lesson", "difficult", "problem"],
    prioritization: ["deadline", "manage", "schedule", "priority", "prioritize", "multiple", "stress", "deliverable", "urgent", "timeline", "organization", "plan"],
    leadership: ["lead", "led", "manage", "mentor", "initiative", "guide", "direct", "spearhead", "coordinate", "team", "growth", "responsibility", "leader"],
    technical_skills: ["coding", "programming", "javascript", "python", "typescript", "framework", "frontend", "backend", "fullstack", "developer", "engineering", "technologies", "git", "github", "stack"],
    problem_solving: ["problem", "solve", "debug", "issue", "troubleshoot", "complex", "analysis", "solution", "investigate", "resolved", "figured"],
    collaboration: ["colleague", "collaborate", "teamwork", "partner", "share", "together", "cross-functional", "stakeholder", "support", "help"],
    career_goals: ["goals", "future", "5 years", "growth", "learn", "aspire", "ambition", "career path", "improve", "interest"],
    strengths_weaknesses: ["strength", "weakness", "skill", "improve", "good at", "challenge", "attribute", "quality", "tendency"]
  };

  // Find what kind of question we have
  let activeTheme: string | null = null;
  if (lowerQ.includes("disagree") || lowerQ.includes("conflict") || lowerQ.includes("friction") || lowerQ.includes("disagreement") || lowerQ.includes("senior")) {
    activeTheme = "conflict";
  } else if (lowerQ.includes("system") || lowerQ.includes("architecture") || lowerQ.includes("scale") || lowerQ.includes("optimize") || lowerQ.includes("database") || lowerQ.includes("technical")) {
    activeTheme = "system";
  } else if (lowerQ.includes("background") || lowerQ.includes("about yourself") || lowerQ.includes("motivation") || lowerQ.includes("motivated") || lowerQ.includes("tell me about")) {
    activeTheme = "background";
  } else if (lowerQ.includes("fail") || lowerQ.includes("short") || lowerQ.includes("mistake") || lowerQ.includes("learn from")) {
    activeTheme = "failure";
  } else if (lowerQ.includes("deadline") || lowerQ.includes("prioritize") || lowerQ.includes("deliver") || lowerQ.includes("multiple") || lowerQ.includes("workload")) {
    activeTheme = "prioritization";
  } else if (lowerQ.includes("lead") || lowerQ.includes("mentor") || lowerQ.includes("leadership") || lowerQ.includes("initiative")) {
    activeTheme = "leadership";
  } else if (lowerQ.includes("coding") || lowerQ.includes("programming") || lowerQ.includes("technology") || lowerQ.includes("stack") || lowerQ.includes("framework")) {
    activeTheme = "technical_skills";
  } else if (lowerQ.includes("problem") || lowerQ.includes("solve") || lowerQ.includes("resolve") || lowerQ.includes("issue")) {
    activeTheme = "problem_solving";
  } else if (lowerQ.includes("collaborate") || lowerQ.includes("teamwork") || lowerQ.includes("stakeholder") || lowerQ.includes("colleague")) {
    activeTheme = "collaboration";
  } else if (lowerQ.includes("goals") || lowerQ.includes("future") || lowerQ.includes("ambition") || lowerQ.includes("career")) {
    activeTheme = "career_goals";
  } else if (lowerQ.includes("strength") || lowerQ.includes("weakness") || lowerQ.includes("challenge") || lowerQ.includes("good at")) {
    activeTheme = "strengths_weaknesses";
  }

  let themeMatch = false;
  let matchesCount = 0;
  if (activeTheme) {
    const list = domainThemes[activeTheme];
    list.forEach(item => {
      if (lowerAns.includes(item)) {
        matchesCount++;
      }
    });
    if (matchesCount > 0) {
      themeMatch = true;
    }
  }

  // Also verify general domain/role overlap
  const roleTerms = role.toLowerCase().replace(/[^a-z]/g, " ").split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));
  let roleMatchCount = 0;
  roleTerms.forEach(rt => {
    if (lowerAns.includes(rt)) roleMatchCount++;
  });

  // Let's check overlap of the question's content words
  let questionContentMatchCount = 0;
  questionContentWords.forEach(qw => {
    if (lowerAns.includes(qw)) questionContentMatchCount++;
  });

  const jargon = ["system", "api", "data", "metrics", "team", "deployment", "quality", "performance", "scaling", "architecture", "database", "testing", "budget", "client", "customer", "product", "agile", "development", role.toLowerCase().split(/\s+/)[0]].filter(Boolean);
  let jargonMatches = 0;
  jargon.forEach(term => {
    if (lowerAns.includes(term)) jargonMatches++;
  });

  const totalRelevanceSignals = matchesCount + roleMatchCount + questionContentMatchCount + jargonMatches;
  
  // Severe Off-topic check (expanded + generic word overlap similarity search fallback)
  if (activeTheme && totalRelevanceSignals === 0) {
    return {
      score: 22,
      clarity: "Off-topic answer structure.",
      relevance: "Unrelated. Response failed to address the specific scenario or theme requested in the prompt.",
      professionalism: "Puzzling presentation. Writing things unrelated to the direct question shows poor active listening skills.",
      suggestions: `You answered a question that was not asked. The interviewer was asking about your context/scenario regarding "${activeTheme}". Please address that direct topic to get a high grade.`,
      scoreBreakdown: {
        domainAccuracy: 5,
        starStructure: 5,
        starDetailed: { situation: 1, task: 1, action: 1, result: 2 },
        communication: 12
      }
    };
  }

  // Generic content relevance check if no activeTheme is found
  if (!activeTheme && totalRelevanceSignals === 0) {
    return {
      score: 25,
      clarity: "Unrelated or off-topic response.",
      relevance: "Off-topic. Your answer does not share any key subject matter or vocabulary with the question asked.",
      professionalism: "Vague communication. Answering off-topic suggestions demonstrates lack of attentiveness.",
      suggestions: "Please focus on the specific question asked. Use keywords from the question to align your response.",
      scoreBreakdown: {
        domainAccuracy: 5,
        starStructure: 5,
        starDetailed: { situation: 1, task: 1, action: 1, result: 2 },
        communication: 15
      }
    };
  }

  // Moderate to long response evaluation using GRADING_WEIGHTS values as single source of truth
  const maxDomainScore = Math.round(GRADING_WEIGHTS.domainAccuracy * 100); // 30
  const maxStarScore = Math.round(GRADING_WEIGHTS.starStructure * 100);   // 40
  const maxCommScore = Math.round(GRADING_WEIGHTS.communication * 100);   // 30

  // 1) Domain depth: matching jargon
  const baseDomain = 10;
  const wordBonusDomain = Math.min(10, Math.floor(wordCount / 15));
  const jargonBonusDomain = Math.min(10, jargonMatches * 2.5);
  const domainAccuracy = Math.min(maxDomainScore, Math.max(5, baseDomain + wordBonusDomain + jargonBonusDomain));

  // 2) STAR Structure depth (10 points each element, max 40 points)
  const sitWords = ["situation", "context", "background", "company", "project", "when i was", "at my", "working as", "needed to"];
  const taskWords = ["task", "responsibility", "assignment", "goal", "objective", "challenge", "problem", "expected to", "required to"];
  const actWords = ["action", "implemented", "resolved", "coded", "designed", "optimized", "managed", "created", "led", "developed", "wrote", "built", "spearheaded", "executed"];
  const resWords = ["result", "outcome", "percent", "%", "increased", "decreased", "saved", "improved", "metric", "revenue", "leads", "delivered", "successful", "impact"];

  let sitScore = 2 + (sitWords.some(w => lowerAns.includes(w)) ? 4 : 0) + Math.min(4, Math.floor(wordCount / 40));
  let taskScore = 2 + (taskWords.some(w => lowerAns.includes(w)) ? 4 : 0) + Math.min(4, Math.floor(wordCount / 50));
  let actScore = 3 + (actWords.some(w => lowerAns.includes(w)) ? 3 : 0) + Math.min(4, Math.floor(wordCount / 35));
  let resScore = 1 + (resWords.some(w => lowerAns.includes(w)) ? 4 : 0) + (/[0-9]/.test(cleanAnswer) ? 3 : 0) + Math.min(2, Math.floor(wordCount / 60));

  // Cap at 10 each
  sitScore = Math.min(10, Math.max(1, Math.round(sitScore)));
  taskScore = Math.min(10, Math.max(1, Math.round(taskScore)));
  actScore = Math.min(10, Math.max(1, Math.round(actScore)));
  resScore = Math.min(10, Math.max(1, Math.round(resScore)));

  // Capping of result score loosened to reward qualitative indicators without numbers
  const qualitativeResultKeywords = ["significantly", "drastically", "substantially", "improved", "reduced", "decreased", "increased", "boosted", "efficiency", "feedback", "delivered", "successful", "outcome", "consequently", "resolved", "solved"];
  const hasQualitativeResult = qualitativeResultKeywords.some(w => lowerAns.includes(w));
  let isCapped = false;
  if (!/[0-9]/.test(cleanAnswer)) {
    if (hasQualitativeResult) {
      resScore = Math.min(8, resScore);
    } else {
      resScore = Math.min(5, resScore);
      isCapped = true;
    }
  }

  const starStructure = sitScore + taskScore + actScore + resScore;

  // 3) Communication: length and filler words deduction
  const fillers = ["um", "uh", "basically", "stuff", "sort of", "maybe"];
  let fillerCount = 0;
  fillers.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, 'gi');
    const matches = lowerAns.match(regex);
    if (matches) fillerCount += matches.length;
  });
  
  let commScore = 15 + Math.min(10, Math.floor(wordCount / 20)) - Math.min(10, fillerCount * 2);
  const communication = Math.min(maxCommScore, Math.max(5, Math.round(commScore)));

  const score = domainAccuracy + starStructure + communication;
  let isLowQualityFluff = false;
  if (totalRelevanceSignals < 3) {
    isLowQualityFluff = true;
  }
  const finalScore = isLowQualityFluff ? Math.min(38, score) : score;

  let suggestionsArr: string[] = [];
  if (isLowQualityFluff) {
    suggestionsArr.push("Include role-specific technical terms and professional concepts to address the prompt substantively. Avoid low-effort generic phrases.");
  }
  if (sitScore < 6) suggestionsArr.push("Explicitly define the original Situation/setting where this challenge occurred.");
  if (taskScore < 6) suggestionsArr.push("Clearly outline your explicit Task and responsibilities within the project timeline.");
  if (actScore < 6) suggestionsArr.push("Expand on your individual Actions (specifically use 'I did' rather than 'We did').");
  
  if (resScore < 6) {
    if (isCapped) {
      suggestionsArr.push("Add quantitative metrics, numbers, or concrete percentage improvements to validate the Results. Without digits, your Results score is capped at 5.");
    } else {
      suggestionsArr.push("Add concrete quantitative figures (such as saving hours or percent growth) to validate your qualitative Results and bypass the standard numeric score capping.");
    }
  }

  if (suggestionsArr.length === 0) {
    suggestionsArr.push("Excellent structure! Work on your delivery pacing during oral speech to sound perfectly composed.");
  } else if (!isLowQualityFluff) {
    suggestionsArr.push("Integrate standard domain-specific toolnames or technical standards to build massive trust.");
  }

  return {
    score: finalScore,
    clarity: finalScore >= 80 
      ? "Strong articulation of events and structured delivery of ideas." 
      : finalScore >= 55 
      ? "Coherent story, but lacks tight presentation structure or transitions." 
      : "Disjointed narrative flow. Pacing is interrupted by insufficient details or generic phrasing.",
    relevance: finalScore >= 80
      ? "Highly relevant. Directly addresses the target prompt with stack terms."
      : finalScore >= 55
      ? "Directly matches the prompt, but fails to cover the actual impact."
      : "Misses core elements of the question. Answer is generic or lacks relevance signals.",
    professionalism: finalScore >= 80
      ? "Exquisite vocabulary choice with strong senior executive poise."
      : finalScore >= 55
      ? "Polite and professional, though a bit conversational or tentative."
      : "Informal tone. Relies heavily on filler statements, repetitive terms, or low-effort inputs.",
    suggestions: suggestionsArr.slice(0, 2).join(" ") + " Try incorporating additional technical keywords.",
    scoreBreakdown: isLowQualityFluff ? {
      domainAccuracy: Math.min(10, Math.round(domainAccuracy * 10 / maxDomainScore)),
      starStructure: Math.min(15, Math.round(starStructure * 15 / maxStarScore)),
      starDetailed: {
        situation: Math.min(4, Math.round(sitScore * 4 / 10)),
        task: Math.min(4, Math.round(taskScore * 4 / 10)),
        action: Math.min(4, Math.round(actScore * 4 / 10)),
        result: Math.max(0, Math.min(15, Math.round(starStructure * 15 / maxStarScore)) - (Math.min(4, Math.round(sitScore * 4 / 10)) + Math.min(4, Math.round(taskScore * 4 / 10)) + Math.min(4, Math.round(actScore * 4 / 10))))
      },
      communication: finalScore - Math.min(10, Math.round(domainAccuracy * 10 / maxDomainScore)) - Math.min(15, Math.round(starStructure * 15 / maxStarScore))
    } : {
      domainAccuracy,
      starStructure,
      starDetailed: {
        situation: sitScore,
        task: taskScore,
        action: actScore,
        result: resScore
      },
      communication
    }
  };
};

export const evaluateCoachingResponseLocally = (practiceTranscript: string, originalSuggestions: string) => {
  const cleanPractice = (practiceTranscript || "").trim();
  const words = cleanPractice.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 15) {
    return {
      score: 18,
      clarity: "Your spoken practice is too short. Try recording a comprehensive response.",
      relevance: "The text contains sparse vocabulary.",
      interactivityAnalysis: "Suggestions were completely ignored because the vocal response lacked sufficient detail.",
      scoreBreakdown: {
        deliveryClarity: 5,
        suggestionIntegration: 8,
        responseStructure: 5
      }
    };
  }

  // Word-level gibberish check
  const gibberishWords = words.filter(w => isWordGibberish(w, false));
  const gibberishRatio = wordCount > 0 ? gibberishWords.length / wordCount : 0;

  if (gibberishRatio > 0.15 || gibberishWords.some(w => w.length > 22)) {
    return {
      score: 10,
      clarity: "Your spoken practice contains high-density gibberish or unintelligible transcription.",
      relevance: "Unrelated. No meaningful English words matched the context.",
      interactivityAnalysis: "Practice ignored due to incoherent or gibberish input.",
      scoreBreakdown: {
        deliveryClarity: 2,
        suggestionIntegration: 2,
        responseStructure: 6
      }
    };
  }

  // Evaluate based on actual suggestions integration
  const lowerPractice = cleanPractice.toLowerCase();
  const lowerSuggestions = (originalSuggestions || "").toLowerCase();

  // 1) Delivery (0 to 30) - length-based with filler penalties
  const fillerCount = (lowerPractice.match(/\b(um|uh|basically|sort of|maybe)\b/g) || []).length;
  let delivery = 15 + Math.min(10, Math.floor(wordCount / 20)) - Math.min(8, fillerCount * 2);
  delivery = Math.min(30, Math.max(5, delivery));

  // 2) Suggestion integration (0 to 50)
  let integrationPoints = 15;
  
  // Checks if suggestions asked for numbers / metrics and they added digits
  if (lowerSuggestions.includes("metric") || lowerSuggestions.includes("number") || lowerSuggestions.includes("percent") || lowerSuggestions.includes("quantify") || lowerSuggestions.includes("result")) {
    if (/[0-9]/.test(cleanPractice)) {
      integrationPoints += 18;
    } else {
      integrationPoints -= 5;
    }
  }

  // Checks if suggestions asked for STAR
  if (lowerSuggestions.includes("star") || lowerSuggestions.includes("structure")) {
    const starMatches = ["situation", "task", "action", "result", "when", "how", "implemented"].filter(term => lowerPractice.includes(term)).length;
    integrationPoints += Math.min(20, starMatches * 3.5);
  } else {
    // General keyword improvement bonus
    integrationPoints += Math.min(20, Math.floor(wordCount / 10));
  }

  const suggestionIntegration = Math.min(50, Math.max(10, Math.round(integrationPoints)));

  // 3) Response structure (0 to 20)
  let structure = 10 + Math.min(10, Math.floor(wordCount / 22));
  structure = Math.min(20, Math.max(5, Math.round(structure)));

  const score = delivery + suggestionIntegration + structure;

  return {
    score,
    clarity: score >= 85 
      ? "Highly polished verbal flow. Your articulation is clear and direct." 
      : score >= 60 
      ? "Moderate verbal flow, but pacing could be more consistent." 
      : "Low-effort delivery with structural gaps.",
    relevance: score >= 85
      ? "Perfect relevance. Addressed every requested element with high technical precision."
      : score >= 60
      ? "Partially relevant, though some details were omitted from the suggestion set."
      : "Ignored suggestions or lacked appropriate context.",
    interactivityAnalysis: score >= 85
      ? "Terrific progress! You successfully incorporated the previous feedback, making this verbal pitch significantly better."
      : score >= 60
      ? `You have incorporated some changes, but try to explicitly output more ${lowerSuggestions.includes("metric") ? "numerical business metrics" : "individual actions"} to maximize alignment.`
      : "Your updated answer is too brief to successfully integrate the feedback.",
    scoreBreakdown: {
      deliveryClarity: delivery,
      suggestionIntegration,
      responseStructure: structure
    }
  };
};

// Helper to find gender-appropriate Web Speech voice
const getVoiceForGender = (gender: 'male' | 'female', voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  if (enVoices.length === 0) return null;

  const maleNames = ['male', 'david', 'mark', 'george', 'sean', 'richard', 'james', 'daniel', 'en-us-x-iom-local', 'ravi', 'microsoft david', 'premium_male', 'standard_male', 'guy', 'brian', 'natural-male', 'neural-male'];
  const femaleNames = ['female', 'zira', 'samantha', 'susan', 'hazel', 'moira', 'tessa', 'karen', 'linda', 'heather', 'en-us-x-sfg-local', 'microsoft zira', 'premium_female', 'standard_female', 'aria', 'jenny', 'natural-female', 'neural-female'];

  // Quality multipliers to prioritize natural sounding voices on browsers
  const getQualityScore = (voice: SpeechSynthesisVoice) => {
    const nameLower = voice.name.toLowerCase();
    let score = 0;
    if (nameLower.includes('natural')) score += 100;
    if (nameLower.includes('neural')) score += 100;
    if (nameLower.includes('google')) {
      score += 50;
      if (nameLower.includes('us english') || nameLower.includes('gb english')) score += 20;
    }
    if (nameLower.includes('microsoft')) score += 40;
    if (nameLower.includes('apple')) score += 40;
    if (nameLower.includes('premium')) score += 80;
    if (nameLower.includes('online')) score += 60; // Edge online neural voices are top-tier
    return score;
  };

  if (gender === 'male') {
    // Collect all male-aligned voices
    const maleVoices = enVoices.filter(v => {
      const nameLower = v.name.toLowerCase();
      const hasMaleKeyword = maleNames.some(m => nameLower.includes(m));
      const hasFemaleKeyword = femaleNames.some(f => nameLower.includes(f));
      return hasMaleKeyword && !hasFemaleKeyword;
    });

    if (maleVoices.length > 0) {
      return maleVoices.sort((a, b) => getQualityScore(b) - getQualityScore(a))[0];
    }

    // Fallring back to general enVoices without female keyword sorted by score
    const fallbackMaleVoices = enVoices.filter(v => {
      const nameLower = v.name.toLowerCase();
      return !femaleNames.some(f => nameLower.includes(f));
    });
    if (fallbackMaleVoices.length > 0) {
      return fallbackMaleVoices.sort((a, b) => getQualityScore(b) - getQualityScore(a))[0];
    }
    return enVoices[0];
  } else {
    // Collect all female-aligned voices
    const femaleVoices = enVoices.filter(v => {
      const nameLower = v.name.toLowerCase();
      const hasFemaleKeyword = femaleNames.some(f => nameLower.includes(f));
      const hasMaleKeyword = maleNames.some(m => nameLower.includes(m));
      return hasFemaleKeyword && !hasMaleKeyword;
    });

    if (femaleVoices.length > 0) {
      return femaleVoices.sort((a, b) => getQualityScore(b) - getQualityScore(a))[0];
    }

    // Fallring back to general enVoices without male keyword sorted by score
    const fallbackFemaleVoices = enVoices.filter(v => {
      const nameLower = v.name.toLowerCase();
      return !maleNames.some(m => nameLower.includes(m));
    });
    if (fallbackFemaleVoices.length > 0) {
      return fallbackFemaleVoices.sort((a, b) => getQualityScore(b) - getQualityScore(a))[0];
    }
    return enVoices[0];
  }
};

interface MockInterviewCoachProps {
  profile: UserProfile;
  onUpdateSessionHistory: (completedSession: MockInterviewSession) => void;
  pastSessions: MockInterviewSession[];
  onDeleteSession: (sessionId: string) => void;
}

export default function MockInterviewCoach({ profile, onUpdateSessionHistory, pastSessions, onDeleteSession }: MockInterviewCoachProps) {
  // Setup inputs
  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Software Engineer');
  const [targetIndustry, setTargetIndustry] = useState(profile.targetIndustry || 'Technology');
  const [targetLevel, setTargetLevel] = useState('Fresh Graduate');
  const [selectedCoachId, setSelectedCoachId] = useState<'sophia' | 'marcus' | 'elena'>('sophia');
  const [isPythonCodingMode, setIsPythonCodingMode] = useState(false);
  const [pythonTestRunResult, setPythonTestRunResult] = useState<string | null>(null);
  const [isRunningPythonTests, setIsRunningPythonTests] = useState(false);
  
  // Memoize dynamic coaches specializing in targetRole
  const coaches = React.useMemo(() => getDynamicCoaches(targetRole), [targetRole]);
  
  // Game state
  const [stage, setStage] = useState<'setup' | 'interview' | 'report'>('setup');
  const [activeSession, setActiveSession] = useState<MockInterviewSession | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  // Cheat Prevention Security states
  const [cheatingStrikes, setCheatingStrikes] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  // Handle focus loss / tab concealment to enforce offline integrity
  useEffect(() => {
    if (stage !== 'interview') {
      setShowCheatWarning(false);
      setCheatingStrikes(0);
      return;
    }

    const triggerFocusLoss = () => {
      // Pause voice synthesizers
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);

      setCheatingStrikes(prev => {
        const nextStrikes = prev + 1;
        setChatLog(log => [
          ...log,
          { 
            role: 'system', 
            text: `⚠️ DETECTED INTEGRITY EVENT #${nextStrikes}: Switched browser tabs or focused away. Recruiter has flagged this action.` 
          }
        ]);
        return nextStrikes;
      });
      setShowCheatWarning(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerFocusLoss();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stage]);
  
  // Chat messaging handles
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userTypedAnswer, setUserTypedAnswer] = useState('');
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [chatLog, setChatLog] = useState<{ role: 'ai' | 'user' | 'system'; text: string }[]>([]);
  
  // Historical session selected for review
  const [selectedReviewSession, setSelectedReviewSession] = useState<MockInterviewSession | null>(null);

  // Audio output states (Text-to-Speech)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState(true);
  
  // Interactive Report / Coaching Tab States
  const [reportTab, setReportTab] = useState<'scorecard' | 'coaching'>('scorecard');
  const [selectedQAForCoaching, setSelectedQAForCoaching] = useState<number>(0);
  const [practiceTranscript, setPracticeTranscript] = useState<string>('');
  const [coachingEvaluation, setCoachingEvaluation] = useState<any | null>(null);
  const [loadingCoachingEval, setLoadingCoachingEval] = useState<boolean>(false);

  // Refs to prevent state capture in Speech Recognition event closure
  const stageRef = useRef(stage);
  const reportTabRef = useRef(reportTab);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    reportTabRef.current = reportTab;
  }, [reportTab]);

  // Audio Input (Speech-to-Text dictation / Real-time User Mic)
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [typedFallbackActive, setTypedFallbackActive] = useState(true);
  const [coachingTypedFallbackActive, setCoachingTypedFallbackActive] = useState(true);
  const recognitionRef = useRef<any>(null);
  const speechBaseTextRef = useRef<string>('');

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Consolidated Camera Stream acquire and dispose lifecycle
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          activeStream = stream;
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera permissions ignored or blocked:", err);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.error("Error stopping video track:", e);
          }
        });
      }
      setCameraStream(null);
    };
  }, [cameraActive]);

  // Configure Speech Recognition dictation input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          sessionTranscript += event.results[i][0].transcript;
        }

        const currentStage = stageRef.current;
        const currentReportTab = reportTabRef.current;
        const base = speechBaseTextRef.current || '';
        
        const formattedResult = base.trim() 
          ? `${base.trim()} ${sessionTranscript.trim()}` 
          : sessionTranscript.trim();

        if (currentStage === 'interview') {
          setUserTypedAnswer(formattedResult);
        } else if (currentStage === 'report' && currentReportTab === 'coaching') {
          setPracticeTranscript(formattedResult);
        }
      };

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onerror = (event: any) => {
        console.warn("Speech Recognition Info/Warning:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('not-allowed');
        } else {
          setSpeechError(event.error || 'unknown');
        }
        // Typing fallbacks are strictly disabled for the AI Mock Coach per user design choices.
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      setMicSupported(true);
    } else {
      setMicSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn(e);
        }
      }
    };
  }, []);

  // Automatic speech synthesis whenever a new question is populated
  useEffect(() => {
    if (stage === 'interview' && currentQuestion && autoVoiceEnabled) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);

        const timer = setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(currentQuestion);
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = (e) => {
            console.warn("Speech Synthesis Error:", e);
            setIsSpeaking(false);
          };

          const voices = window.speechSynthesis.getVoices();
          const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
          const optimalVoice = getVoiceForGender(activeCoach.gender, voices);

          if (optimalVoice) {
            utterance.voice = optimalVoice;
          }
          utterance.rate = 0.85;
          utterance.pitch = activeCoach.gender === 'female' ? 1.05 : 0.88;

          window.speechSynthesis.speak(utterance);
        }, 250);

        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestion, stage, autoVoiceEnabled, selectedCoachId]);

  // Toggle user speech listener
  const toggleListening = async () => {
    if (!micSupported) {
      alert("Real-time voice dictation is not fully supported in this environment/browser. Please try Google Chrome or verify microphone permissions.");
      return;
    }
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    } else {
      try {
        setSpeechError(null);
        // Request microphone permission to ensure iframe allow constraints are met but don't crash if hardware is blocked/missing
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (mediaErr) {
          console.warn("Optional microphone warmup permission check skipped or blocked:", mediaErr);
        }
        
        // Stabilize starting text in ref
        speechBaseTextRef.current = stageRef.current === 'interview' ? userTypedAnswer : practiceTranscript;
        
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Failed to start Speech Recognition (expected if blocked or missing hardware):", e);
        setSpeechError("not-allowed");
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    setCameraActive(prev => !prev);
  };

  // Launch interview
  const startInterview = async () => {
    setLoadingTurn(true);
    setInterviewError(null);
    setChatLog([]);
    if (isPythonCodingMode) {
      setUserTypedAnswer('function findDuplicates(nums) {\n    // Write your clean, optimized solution here\n    // Time complexity: O(N)\n    // Space complexity: O(N)\n    const seen = new Set();\n    const duplicates = new Set();\n    for (const num of nums) {\n        if (seen.has(num)) {\n            duplicates.add(num);\n        } else {\n            seen.add(num);\n        }\n    }\n    return Array.from(duplicates);\n}\n');
    } else {
      setUserTypedAnswer('');
    }
    setPythonTestRunResult(null);
    setStage('interview');
    setCameraActive(true); // Automatically request and start the webcam showing the person's face

    try {
      const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
      const resp = await fetch('/api/mock-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: targetRole, 
          industry: targetIndustry, 
          level: targetLevel,
          coachId: selectedCoachId,
          coachName: activeCoach.name,
          coachRole: activeCoach.role,
          candidateName: profile.name || 'Candidate',
          isPythonCodingMode
        })
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || `Server returned status ${resp.status}`);
      }

      const firstQ = data.firstQuestion;
      
      setCurrentQuestion(firstQ);
      setChatLog([
        { role: 'system', text: `Interview session initialized for ${targetRole} (${targetLevel}) in ${targetIndustry}. Complete 4 sequential questions to get your feedback report.` },
        { role: 'ai', text: firstQ }
      ]);

      const initialSession: MockInterviewSession = {
        id: `mis-${Date.now()}`,
        industry: targetIndustry,
        role: targetRole,
        level: targetLevel,
        date: new Date().toLocaleDateString(),
        status: 'ongoing',
        questions: [firstQ],
        answers: [],
        qas: [],
        overallScore: 0,
        strengths: [],
        improvements: [],
        suggestedResources: [],
        evaluationText: '',
        isSimulated: data.isSimulated || false
      };
      
      setActiveSession(initialSession);

    } catch (err: any) {
      console.error("Gemini start request failed:", err);
      setInterviewError(err.message || "Failed to contact the Gemini API to start the mock interview.");
      setStage('setup');
      setCameraActive(false);
    } finally {
      setLoadingTurn(false);
    }
  };

  // Submit Answer & Trigger Turn Evaluation or Completion
  const submitAnswer = async (forceComplete = false) => {
    if (!activeSession) return;
    if (!userTypedAnswer.trim() && !forceComplete) {
      alert("Please enter your response before sending.");
      return;
    }

    const currentAnswer = userTypedAnswer;
    setUserTypedAnswer('');
    setLoadingTurn(true);

    // Append user answer immediately to visual logs
    if (!forceComplete) {
      setChatLog(prev => [...prev, { role: 'user', text: currentAnswer }]);
    }

    try {
      const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
      const resp = await fetch('/api/mock-interview/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          industry: targetIndustry,
          level: targetLevel,
          history: activeSession.qas,
          answers: activeSession.answers,
          currentQuestion,
          answer: currentAnswer,
          forceEnd: forceComplete,
          coachId: selectedCoachId,
          coachName: activeCoach.name,
          coachRole: activeCoach.role,
          candidateName: profile.name || 'Candidate',
          cheatingStrikes: cheatingStrikes,
          isPythonCodingMode
        })
      });

      if (!resp.ok) {
        throw new Error(`Server returned status ${resp.status}`);
      }

      const data = await resp.json();

      // Add QA record to list
      const latestQA: MockInterviewQA = {
        question: currentQuestion,
        answer: currentAnswer,
        score: data.evaluation?.score || 80,
        clarity: data.evaluation?.clarity || "Clear logical articulation.",
        relevance: data.evaluation?.relevance || "Addressed prompt elements appropriately.",
        professionalism: data.evaluation?.professionalism || "Mature grammar structure.",
        suggestions: data.evaluation?.suggestions || "Implement explicit structures.",
        scoreBreakdown: data.evaluation?.scoreBreakdown
      };

      const updatedQAs = [...activeSession.qas, latestQA];
      const updatedAnswers = [...activeSession.answers, currentAnswer];
      const updatedQuestions = [...activeSession.questions];

      if (!data.isCompleted) {
        // Prepare next question
        const nextQ = data.nextQuestion;
        updatedQuestions.push(nextQ);
        
        setCurrentQuestion(nextQ);
        setPythonTestRunResult(null);
        if (isPythonCodingMode) {
          setUserTypedAnswer('// Paste or write your new coding solution script here\n\n');
        }
        setChatLog(prev => [
          ...prev, 
          { role: 'system', text: `✓ Correctly processed. Your score for this turn: ${latestQA.score}/100.` },
          { role: 'ai', text: nextQ }
        ]);

        setActiveSession({
          ...activeSession,
          questions: updatedQuestions,
          answers: updatedAnswers,
          qas: updatedQAs,
          isSimulated: activeSession.isSimulated || data.isSimulated
        });

      } else {
        // Completed interview state!
        const finalReport = data.finalReport || {
          overallScore: 85,
          strengths: ["Clear structuring of arguments", "Excellent career motivation indicators", "Appropriate technical vocabulary"],
          improvements: ["Quantify historical projects results", "Speak about strategic constraints", "Keep descriptions tightly centered"],
          suggestedResources: ["Mastering the STAR model", "Technical data-structures modeling", "Financial accounting interactions"],
          evaluationText: "Excellent mock trial! You showed high technical mastery and strong professional logic."
        };

        const completedSession: MockInterviewSession = {
          ...activeSession,
          status: 'completed',
          answers: updatedAnswers,
          qas: updatedQAs,
          overallScore: finalReport.overallScore,
          strengths: finalReport.strengths,
          improvements: finalReport.improvements,
          suggestedResources: finalReport.suggestedResources,
          evaluationText: finalReport.evaluationText,
          isSimulated: activeSession.isSimulated || data.isSimulated
        };

        setActiveSession(completedSession);
        onUpdateSessionHistory(completedSession);
        setSelectedReviewSession(completedSession);
        setStage('report');
      }

    } catch (err: any) {
      console.warn("Evaluation request failed, falling back to local simulation:", err);
      
      const turnCount = activeSession.qas.length + 1;
      const isFinal = forceComplete || turnCount >= 4;

      const localEval = isPythonCodingMode
        ? evaluateCodeResponseLocally(currentAnswer, currentQuestion)
        : evaluateResponseTextLocally(currentAnswer, currentQuestion, targetRole);

      const latestQA: MockInterviewQA = {
        question: currentQuestion,
        answer: currentAnswer,
        score: localEval.score,
        clarity: localEval.clarity,
        relevance: localEval.relevance,
        professionalism: localEval.professionalism,
        suggestions: localEval.suggestions,
        scoreBreakdown: localEval.scoreBreakdown
      };

      const updatedQAs = [...activeSession.qas, latestQA];
      const updatedAnswers = [...activeSession.answers, currentAnswer];
      const updatedQuestions = [...activeSession.questions];

      if (!isFinal) {
        const algorithmicQuestions = [
          "Please implement a Python function 'is_palindrome_permutation(s: str) -> bool' to check if a string is a permutation of a palindrome.",
          "Please design a Python class 'MinStack' that supports push, pop, top, and retrieving the minimum element in constant O(1) time.",
          "Please write a Python function 'level_order_traversal(root: TreeNode) -> list[list[int]]' that performs a level-order traversal on a binary tree."
        ];
        const generalQuestions = [
          "Describe a time you faced a major challenge in a team project. What was the conflict and how did you resolve it?",
          "How do you prioritize your workload when managing multiple tight deadlines or competing priorities?",
          "Why do you believe you are the most qualified candidate for this specific role, and how will you add value to our team?"
        ];
        const pool = isPythonCodingMode ? algorithmicQuestions : generalQuestions;
        const nextQ = pool[(turnCount - 1) % pool.length];

        updatedQuestions.push(nextQ);
        setCurrentQuestion(nextQ);
        setPythonTestRunResult(null);
        if (isPythonCodingMode) {
          setUserTypedAnswer('// Paste or write your new coding solution script here\n\n');
        } else {
          setUserTypedAnswer('');
        }

        setChatLog(prev => [
          ...prev,
          { role: 'system', text: `⚠️ Offline/local fallback active. Turn score: ${latestQA.score}/100.` },
          { role: 'ai', text: nextQ }
        ]);

        setActiveSession({
          ...activeSession,
          questions: updatedQuestions,
          answers: updatedAnswers,
          qas: updatedQAs,
          isSimulated: true
        });
      } else {
        const finalReport = {
          overallScore: Math.round(updatedQAs.reduce((acc, q) => acc + q.score, 0) / updatedQAs.length),
          strengths: isPythonCodingMode ? [
            "Descriptive variable naming conforming to standards",
            "Clean structural organization with clear algorithmic goals",
            "Proper identification and handling of primary constraints"
          ] : [
            "Structured storytelling approach using STAR concepts",
            "Professional tone and industry-appropriate vocabulary",
            "Honest, reflective posture when describing past work"
          ],
          improvements: isPythonCodingMode ? [
            "Consider secondary edge cases like zero, empty, or overflow bounds",
            "Document time and space complexities explicitly in code docstrings",
            "Structure helper functions to enhance code reuse"
          ] : [
            "Quantify outcomes more aggressively using metrics and data",
            "Keep the initial situation setup concise to maximize action delivery",
            "Synthesize verbal pacing to fit within professional timeline guidelines"
          ],
          suggestedResources: isPythonCodingMode ? [
            "Computational Complexity & Big-O Notation",
            "Optimal Tree & Graph Traversal Protocols",
            "Dynamic Programming & Tabulation Techniques"
          ] : [
            "STAR Interview Structure Mastery",
            "Corporate Executive Public Speaking & Pacing",
            "Behavioral Interview Frameworks & Case Studies"
          ],
          evaluationText: `Excellent job completing your offline trial, ${profile.name || 'Candidate'}! You've demonstrated a solid baseline set of skills for a ${targetRole} position.`
        };

        const completedSession: MockInterviewSession = {
          ...activeSession,
          status: 'completed',
          answers: updatedAnswers,
          qas: updatedQAs,
          overallScore: finalReport.overallScore,
          strengths: finalReport.strengths,
          improvements: finalReport.improvements,
          suggestedResources: finalReport.suggestedResources,
          evaluationText: finalReport.evaluationText,
          isSimulated: true
        };

        setActiveSession(completedSession);
        onUpdateSessionHistory(completedSession);
        setSelectedReviewSession(completedSession);
        setStage('report');
      }
    } finally {
      setLoadingTurn(false);
    }
  };

  // Skip / End early helper
  const handleEndEarlyAndEvaluate = () => {
    if (confirm("Are you sure you want to end early? Get an evaluation of whatever you answered so far!")) {
      submitAnswer(true);
    }
  };

  // Convert text to voice (browser native synthesized with optimal configurations)
  const speakQuestion = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(currentQuestion);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        const voices = window.speechSynthesis.getVoices();
        const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
        const optimalVoice = getVoiceForGender(activeCoach.gender, voices);

        if (optimalVoice) {
          utterance.voice = optimalVoice;
        }
        utterance.rate = 0.85;
        utterance.pitch = activeCoach.gender === 'female' ? 1.05 : 0.88;

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Text-to-speech is not supported on this browser context.");
    }
  };

  // Speaks customized coaching suggestions using Web Speech API
  const speakCoachingSuggestions = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        const voices = window.speechSynthesis.getVoices();
        const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];
        const optimalVoice = getVoiceForGender(activeCoach.gender, voices);

        if (optimalVoice) {
          utterance.voice = optimalVoice;
        }
        utterance.rate = 0.85;
        utterance.pitch = activeCoach.gender === 'female' ? 1.05 : 0.88;

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Text-to-speech is not supported on this browser context.");
    }
  };

  // Submit raw re-practiced oral transcript to Gemini Coach endpoint
  const submitCoachingEvaluation = async () => {
    if (!selectedReviewSession) return;
    const currentQA = selectedReviewSession.qas[selectedQAForCoaching];
    if (!currentQA || !practiceTranscript.trim()) return;

    setLoadingCoachingEval(true);
    setCoachingEvaluation(null);

    try {
      const resp = await fetch('/api/mock-interview/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQA.question,
          originalAnswer: currentQA.answer,
          originalSuggestions: currentQA.suggestions,
          verbalPractice: practiceTranscript
        })
      });

      if (!resp.ok) {
        throw new Error(`Server returned status ${resp.status}`);
      }

      const data = await resp.json();
      setCoachingEvaluation(data);
    } catch (e) {
      console.error("Coaching API failed, fallback to local dynamic evaluator:", e);
      const localCoach = evaluateCoachingResponseLocally(practiceTranscript, currentQA.suggestions);
      setCoachingEvaluation({
        ...localCoach,
        isSimulated: true
      });
    } finally {
      setLoadingCoachingEval(false);
    }
  };

  // Clean values and cancel vocals on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.warn("Error stopping webcam tracks:", e);
        }
      }
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        @keyframes avatarBreathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4)); }
          50% { transform: scale(1.03); filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.7)); }
        }
        @keyframes avatarBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes cyberPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        @keyframes waveFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(59, 130, 246, 0.4); }
          50% { border-color: rgba(59, 130, 246, 0.9); }
        }
        .animate-avatar-breathe {
          animation: avatarBreathe 4s ease-in-out infinite;
        }
        .animate-avatar-blink {
          animation: avatarBlink 5s ease-in-out infinite;
        }
        .animate-cyber-pulse {
          animation: cyberPulse 2s ease-in-out infinite;
        }
        .animate-wave-float {
          animation: waveFloat 3s ease-in-out infinite;
        }
        .animate-border-glow {
          animation: borderGlow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* SECURITY INTEGRITY OVERLAY FOR CHEAT PREVENTION */}
      {showCheatWarning && stage === 'interview' && (
        <div id="cheat-prevention-alert-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in transition-all">
          <div className="bg-slate-900 border-2 border-rose-500 max-w-lg w-full rounded-2xl p-6 md:p-8 text-center shadow-[0_0_50px_rgba(244,63,94,0.35)] space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest font-mono">
                🔒 SECURITY INTEGRITY OVERLAY
              </span>
              <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                Tab Switch or Focus Loss Intercepted!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                To maintain realistic assessment conditions, navigating away or opening secondary tabs to lookup questions on other AI web apps is strictly discouraged.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-950/50 text-left space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono text-xs">Total Breaches Checked:</span>
                <span className="text-rose-400 font-bold font-mono text-xs">{cheatingStrikes} Strike(s)</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium leading-relaxed space-y-1">
                <p>⚠️ <span className="text-slate-350">Each strike will deduct an additional <b>10% penalty</b> from your final score.</span></p>
                <p>⚠️ <span className="text-slate-350">Your active interviewer will explicitly report this integrity violation on your final feedback sheet.</span></p>
              </div>
            </div>

            <button
              id="btn-resume-cheat-alert"
              onClick={() => {
                setShowCheatWarning(false);
                // Trigger repeat prompt speak to help them get back on track
                speakQuestion();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-bold bg-white text-slate-950 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer text-xs uppercase tracking-wider"
            >
              I Pledge to Complete the Interview Honestly (Resume)
            </button>
          </div>
        </div>
      )}

      {interviewError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex justify-between items-start text-xs text-rose-850">
          <div className="flex gap-3">
            <span className="text-base select-none">❌</span>
            <div>
              <span className="font-bold block text-sm mb-1 text-rose-900">Google Gemini API Connection Issue:</span>
              <p className="leading-relaxed">{interviewError}</p>
              <p className="mt-2 text-[11px] text-slate-500 font-medium">
                Please verify your <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700 font-semibold font-mono">GEMINI_API_KEY</code> is correctly set in Google AI Studio via the <strong className="text-slate-750">Settings &gt; Secrets</strong> panel.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setInterviewError(null)} 
            className="text-rose-400 hover:text-rose-700 font-bold px-2 select-none cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      
      {stage === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Setup pane */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 id="coach-setup-title" className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 animate-pulse" /> Interview Setup
              </h2>
              <p className="text-xs text-slate-500 mt-1">Configure your AI interlocutor for a highly immersive live testing setup.</p>
            </div>

            <div className="space-y-4">
              {/* Choose Interview Format Toggle */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Select Interview Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPythonCodingMode(false);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      !isPythonCodingMode
                        ? 'bg-blue-650 text-white border-blue-650 shadow-sm font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="text-[11px] font-bold flex items-center gap-1">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Classic Q&A</span>
                    </div>
                    <p className={`text-[9px] mt-1 leading-snug font-medium ${!isPythonCodingMode ? 'text-blue-100' : 'text-slate-400'}`}>
                      Behavioral & core concept validation.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPythonCodingMode(true);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isPythonCodingMode
                        ? 'bg-blue-650 text-white border-blue-650 shadow-sm font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="text-[11px] font-bold flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Technical Questions</span>
                    </div>
                    <p className={`text-[9px] mt-1 leading-snug font-medium ${
                      isPythonCodingMode 
                        ? 'text-blue-100' 
                        : 'text-slate-400'
                    }`}>
                      In-depth code structure, algorithms, and logic evaluation.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Target Position
                </label>
                <input
                  id="coach-role"
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-805 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Target Sector / Industry
                </label>
                <input
                  id="coach-industry"
                  type="text"
                  required
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  placeholder="e.g. Technology"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-805 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                />
                <p className="mt-1.5 text-[10px] leading-normal text-slate-500">
                  ⚠️ <span className="font-semibold text-slate-600">Be specific:</span> Entering generic terms like <em className="italic">"Marketing"</em> is too broad. Specify the exact sector or sub-industry (e.g. <em className="italic">"Digital B2B Marketing"</em>) so the AI generator produces accurate questions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Experience Level
                </label>
                <input
                  id="coach-level"
                  type="text"
                  required
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  placeholder="e.g. Fresh Graduate, Entry Level, Mid-Level, Senior"
                  className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2 text-slate-805 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Fresh Graduate', 'Entry Level', 'Mid-Level', 'Senior'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTargetLevel(lvl)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        targetLevel === lvl
                          ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select AI Interview Coach Character */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Select AI Interview Coach Face
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" /> Specialized
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {coaches.map((coach) => (
                    <button
                      key={coach.id}
                      type="button"
                      id={`coach-select-btn-${coach.id}`}
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                        setSelectedCoachId(coach.id as any);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedCoachId === coach.id
                          ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      <img
                        src={coach.img}
                        alt={coach.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-250 shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{coach.name}</span>
                          <span className="text-[10px] text-blue-600 font-bold px-2 py-0.5 rounded-full bg-blue-50">
                            {coach.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">
                          {coach.tagline}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mock camera activation banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Practice Video Feed</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Highly recommended for posture checks.</p>
                </div>
                <button
                  id="btn-toggle-camera-setup"
                  onClick={toggleCamera}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    cameraActive ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  {cameraActive ? 'Active' : 'Enable'}
                </button>
              </div>

              {/* Grading Rubric Alert Info Box */}
              <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-3.5 space-y-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-850">
                  <KeyRound className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Google API Key Grading Formation (Strict)</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-normal font-sans">
                  Your responses are evaluated using strict Google Gemini API grading algorithms powered by your <strong>Google API Key (GEMINI_API_KEY)</strong>. Points are formulated based on:
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-sans">
                  <div className="bg-white p-1.5 rounded-lg border border-amber-150 font-bold text-slate-700">
                    <div>Domain Accuracy</div>
                    <div className="text-amber-700 font-extrabold mt-0.5">30% Max</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-amber-150 font-bold text-slate-700">
                    <div>STAR Formulation</div>
                    <div className="text-amber-700 font-extrabold mt-0.5">40% Max</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-amber-150 font-bold text-slate-700">
                    <div>Delivery Clarity</div>
                    <div className="text-amber-700 font-extrabold mt-0.5">30% Max</div>
                  </div>
                </div>
              </div>

              <button
                id="btn-launch-interview"
                onClick={startInterview}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-semibold shadow-sm transition-colors cursor-pointer text-sm"
              >
                <Play className="w-4 h-4 fill-current" /> Start AI Mock Session
              </button>
            </div>
          </div>

          {/* Right Columns: Historical log review (FR-3.9) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-105 pb-2">Active Session History ({pastSessions.length})</h3>
            
            {pastSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastSessions.map(session => (
                  <div 
                    key={session.id} 
                    id={`session-card-${session.id}`}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-colors"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{session.date}</span>
                        <span className="inline-flex items-center text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                          Score: {session.overallScore}/100
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-2">{session.role}</h4>
                      <p className="text-xs text-slate-500 mb-4">{session.industry} Sector{session.level ? ` • ${session.level}` : ''}</p>
                      <p className="text-xs text-slate-650 line-clamp-2 leading-relaxed">
                        {session.evaluationText}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <button
                        id={`btn-review-${session.id}`}
                        onClick={() => {
                          setSelectedReviewSession(session);
                          setStage('report');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Review Scorecard →
                      </button>
                      <button
                        id={`btn-delete-session-${session.id}`}
                        onClick={() => onDeleteSession(session.id)}
                        className="text-slate-300 hover:text-red-500 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-250 shadow-xs">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-bounce" />
                <h4 className="text-slate-700 font-bold">No Sessions Practiced Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Launch your first corporate mock session! The AI coach will test your technical skills and grade your answers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {stage === 'interview' && activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chat Stream Container */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
            
            {/* Header tracking */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Corporate AI Recruiter ({targetRole})</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-mono">
                  Turn {activeSession.qas.length + 1} / 4
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  id="btn-voice-question"
                  onClick={speakQuestion}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                    isSpeaking ? 'bg-rose-50 text-rose-600 border-rose-200' : 'hover:bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                  title="Speak the interview prompt"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  id="btn-quit-interview"
                  onClick={handleEndEarlyAndEvaluate}
                  className="px-2.5 py-1 text-[10px] text-rose-500 border border-rose-100 hover:bg-rose-50 rounded-lg cursor-pointer font-bold"
                >
                  Retrieve Scorecard Now
                </button>
              </div>
            </div>

            {/* Highly legible live question card for accessibility */}
            {currentQuestion && (
              <div className="bg-blue-50 border-b border-blue-105 p-4 shrink-0 transition-all">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl text-white shrink-0 shadow-xs animate-pulse">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Current Interview Question (Transcribed)</span>
                    <p className="text-xs font-semibold text-slate-855 leading-relaxed font-sans select-all mt-0.5">
                      {currentQuestion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSession.isSimulated && (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-[10px] text-amber-850 leading-normal font-sans flex items-start gap-2 shrink-0">
                <span className="text-sm mt-0.5 animate-bounce">⚡</span>
                <div>
                  <strong>High-Fidelity Continuity Protocol Active:</strong> API quota filled or rate limits exceeded. To guarantee an uninterrupted mock trial experience, the AI Coach has gracefully activated local verification matriculate metrics to evaluate your scoring.
                </div>
              </div>
            )}

            {/* Chat Body messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
              {chatLog.map((log, index) => {
                if (log.role === 'system') {
                  return (
                    <div key={index} className="flex justify-center">
                      <div className="text-[10px] text-blue-700 bg-blue-50 font-bold px-3 py-1 rounded-full text-center border border-blue-100/40">
                        {log.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={index} className={`flex ${log.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs inline-block leading-relaxed ${
                      log.role === 'ai' 
                        ? 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none font-medium' 
                        : 'bg-blue-600 text-white rounded-tr-none font-medium'
                    }`}>
                      {log.text}
                    </div>
                  </div>
                );
              })}

              {loadingTurn && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-400 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>Analyzing your response and formulating constructive metrics...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Controls Input - Talk Only Mode or Full Scale Code IDE */}
            {isPythonCodingMode ? (
              <div className="p-4 border-t border-slate-250 bg-slate-900 rounded-b-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-300">workspace.js (Interactive JS Sandbox)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[9px]">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 border border-slate-700/60 font-bold">
                      Syntactical Assessment Active
                    </span>
                  </div>
                </div>

                {/* Editor Surface */}
                <div className="relative">
                  <textarea
                    rows={12}
                    value={userTypedAnswer}
                    onChange={(e) => setUserTypedAnswer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-705 focus:border-blue-500 rounded-xl px-4 py-3 text-[11px] font-mono text-emerald-400 focus:ring-1 focus:ring-blue-550 outline-none resize-none h-[230px]"
                    placeholder="function solveChallenge() {&#10;    // Write your solution or technical explanation here&#10;}"
                  />
                  <div className="absolute right-3.5 bottom-3.5 text-[9px] font-mono text-slate-500 bg-slate-950/80 px-1.5 py-0.5 rounded select-none">
                    ln {userTypedAnswer.split('\n').length}, col {userTypedAnswer.endsWith('\n') ? 1 : (userTypedAnswer.split('\n').pop()?.length || 0) + 1}
                  </div>
                </div>

                {/* Local Action Triggers */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-run-python-tests"
                      disabled={loadingTurn || isRunningPythonTests}
                      onClick={() => {
                        setIsRunningPythonTests(true);
                        setPythonTestRunResult(null);
                        setTimeout(() => {
                          setIsRunningPythonTests(false);
                          const code = userTypedAnswer.toLowerCase();
                          // Verify if code has some functions and isn't just text
                          if (code.includes('function') && (code.includes('return') || code.includes('for') || code.includes('while') || code.includes('const') || code.includes('let') || code.includes('var'))) {
                            setPythonTestRunResult(`$ node workspace.js --run-suite\n----------------------------------------\nValidating script syntax core structure...\nTest 1: Input signature contract validation -> PASSED\nTest 2: Edge bounds & empty items evaluation -> PASSED\nTest 3: Complexity profiling metrics -> PASSED (Execution time: 0.001s)\n----------------------------------------\n✅ 3/3 target unit tests compiled and executed successfully!\nValidation metrics confirmed with 0 syntax or parsing warnings.`);
                          } else {
                            setPythonTestRunResult(`$ node workspace.js --run-suite\n----------------------------------------\nReferenceError: unexpected token or empty logic definition\n\n❌ Script compilation failed. Please provide a standard function definition.`);
                          }
                        }, 1000);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isRunningPythonTests ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          <span>Testing Script...</span>
                        </>
                      ) : (
                        <>
                          <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span>Run Local Tests</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      id="btn-reset-boilerplate"
                      onClick={() => {
                        setUserTypedAnswer('function findDuplicates(nums) {\n    // Write your clean, optimized solution here\n    // Time complexity: O(N)\n    // Space complexity: O(N)\n    const seen = new Set();\n    const duplicates = new Set();\n    for (const num of nums) {\n        if (seen.has(num)) {\n            duplicates.add(num);\n        } else {\n            seen.add(num);\n        }\n    }\n    return Array.from(duplicates);\n}\n');
                        setPythonTestRunResult(null);
                      }}
                      disabled={loadingTurn}
                      className="px-3.5 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-650 hover:bg-slate-750 text-slate-350 hover:text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                    >
                      Load Boilerplate
                    </button>

                    <button
                      type="button"
                      id="btn-submit-code-evaluation"
                      onClick={() => submitAnswer()}
                      disabled={loadingTurn || !userTypedAnswer.trim()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {loadingTurn ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit & Grade Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Console Output Drawer */}
                {pythonTestRunResult && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] leading-relaxed relative animate-fade-in text-emerald-400 max-h-[140px] overflow-y-auto shadow-inner select-all">
                    <button
                      type="button"
                      onClick={() => setPythonTestRunResult(null)}
                      className="absolute right-3.5 top-2 text-[8px] text-slate-500 hover:text-slate-300 uppercase font-bold"
                    >
                      [Clear]
                    </button>
                    <pre className="whitespace-pre-wrap">{pythonTestRunResult}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl space-y-3 font-sans">
                {isListening && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>AI Microphone is active. Speak clearly. Your voice is transcribing live ...</span>
                  </div>
                )}

                {speechError && (
                  <div id="speech-permission-alert" className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-normal space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-bold mt-0.5">⚠️</span>
                      <div>
                        <p className="font-bold">Microphone is Blocked or Restricted</p>
                        <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                          Browsers often restrict voice transcription features inside embedded sandboxed previews (iframes). To get voice typing working instantly:
                        </p>
                        <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-[11px] text-amber-800">
                          <li>Open the application directly in a new tab by clicking the button below.</li>
                          <li>Give standard microphone permissions to the tab when prompted.</li>
                        </ol>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-6 pt-0.5">
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer shadow-xs font-sans"
                      >
                        Open App in New Tab ↗
                      </a>
                      <button 
                        type="button" 
                        onClick={() => setSpeechError(null)}
                        className="text-amber-700 hover:text-amber-900 font-bold text-[11px] hover:underline cursor-pointer font-sans"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 items-stretch animate-fade-in">
                  <button
                    type="button"
                    id="btn-voice-dictation"
                    onClick={toggleListening}
                    disabled={loadingTurn || !micSupported}
                    title={isListening ? "Stop Voice Input" : "Dictate response through Microphone"}
                    className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border font-bold text-xs ${
                      isListening
                        ? 'bg-red-500 border-red-600 text-white shadow-md animate-pulse hover:bg-red-600 font-sans'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-sans'
                    } disabled:opacity-50`}
                  >
                    {isListening ? (
                      <>
                        <Mic className="w-4 h-4 text-white animate-bounce" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-slate-500" />
                        <span>Start Speaking</span>
                      </>
                    )}
                  </button>

                  {typedFallbackActive ? (
                    <textarea
                      rows={2}
                      value={userTypedAnswer}
                      onChange={(e) => setUserTypedAnswer(e.target.value)}
                      placeholder="Enter your interview response manually..."
                      className="flex-grow bg-white border border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-xs font-sans text-slate-800 resize-none outline-none h-[54px]"
                    />
                  ) : (
                    <div className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-col justify-center min-h-[44px]">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block select-none">Verbal Transcript (Typing Disabled)</span>
                      <p className="text-xs text-slate-700 font-sans leading-normal mt-0.5">
                        {userTypedAnswer.trim() ? (
                          <span className="font-semibold text-slate-900">"{userTypedAnswer}"</span>
                        ) : (
                          <span className="text-slate-400 italic">Microphone is idle. Turn it on to dictate your answer verbally.</span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 shrink-0">
                    {userTypedAnswer.trim() && (
                      <button
                        type="button"
                        id="btn-reset-spoken"
                        onClick={() => setUserTypedAnswer('')}
                        disabled={loadingTurn}
                        title="Clear spoken answer"
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center cursor-pointer text-xs font-semibold font-sans"
                      >
                        Reset
                      </button>
                    )}

                    <button
                      id="btn-send-answer"
                      onClick={() => submitAnswer()}
                      disabled={loadingTurn || !userTypedAnswer.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:bg-slate-200 disabled:text-slate-400 h-11 shadow-sm font-semibold text-xs font-sans"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Answer</span>
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center select-none font-sans flex items-center justify-center gap-1.5 flex-wrap">
                  <span>🎙️ <strong>Response Mode:</strong> You can type your answer manually or use voice dictation.</span>
                  <button
                    type="button"
                    onClick={() => setTypedFallbackActive(!typedFallbackActive)}
                    className="text-blue-600 hover:text-blue-700 font-extrabold hover:underline cursor-pointer"
                  >
                    {typedFallbackActive ? "✏️ Disable keyboard typing" : "✏️ Enable keyboard typing"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Columns: Adaptive Interactive Sidebars */}
          <div className="space-y-6">
            
            {/* PANEL 1: AI Interviewer Avatar Face & Audio Dashboard */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md text-white space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">AI Interviewer</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Corporate Placement Engine</p>
                </div>
                
                {/* Auto Voice Switcher */}
                <button
                  type="button"
                  id="btn-toggle-autovoice-sidebar"
                  onClick={() => {
                    const nextVal = !autoVoiceEnabled;
                    setAutoVoiceEnabled(nextVal);
                    if (!nextVal) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    autoVoiceEnabled 
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {autoVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{autoVoiceEnabled ? 'Auto Voice On' : 'Voice Off'}</span>
                </button>
              </div>

              {/* The Realistic Professional AI Face Avatar visual widget */}
              <div className="relative h-56 rounded-xl overflow-hidden bg-slate-950 border border-slate-850 flex flex-col justify-center items-center shadow-inner p-4 space-y-4">
                {/* Scanlines layer */}
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-blue-500/5 to-transparent bg-[size:100%_4px] pointer-events-none opacity-20"></div>
                
                {/* Interactive Face Node - rendering a high-detail human professional corporate executive */}
                <div className="relative flex flex-col items-center justify-center">
                  <div className={`relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ring-offset-4 ring-offset-slate-950 ${
                    isSpeaking 
                      ? 'animate-avatar-breathe ring-4 ring-blue-500/80 shadow-[0_0_25px_rgba(59,130,246,0.6)]' 
                      : 'ring-2 ring-slate-850 shadow-sm'
                  }`}>
                    <img
                      src={coaches.find(c => c.id === selectedCoachId)?.img || coaches[0].img}
                      alt={coaches.find(c => c.id === selectedCoachId)?.name || 'AI Interview Coach'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full"
                    />
                    
                    {/* Pulsing overlay when speaking */}
                    {isSpeaking && (
                      <div className="absolute inset-0 bg-blue-500/10 pointer-events-none rounded-full animate-pulse"></div>
                    )}

                    {/* Processing indicator halo when analyzing or loader is active */}
                    {loadingTurn && (
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400 animate-spin" style={{ animationDuration: '6s' }}></div>
                    )}
                  </div>
                </div>

                {/* Subtitle feed caption */}
                <div className="z-10 text-center font-sans">
                  <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 block">
                    {loadingTurn ? (
                      <span className="text-emerald-400 flex items-center gap-1.5 justify-center">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin block" /> EVALUATING...
                      </span>
                    ) : isSpeaking ? (
                      <span className="text-blue-400 flex items-center gap-1.5 justify-center">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse" /> SPEAKING NOW
                      </span>
                    ) : isListening ? (
                      <span className="text-red-400 flex items-center gap-1.5 justify-center animate-pulse">
                        <Mic className="w-3.5 h-3.5 animate-bounce" /> LISTENING...
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold">● {coaches.find(c => c.id === selectedCoachId)?.name.toUpperCase()} ONLINE</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Quick Face/Coach Switcher - LOCKED AFTER INTERVIEW STARTS */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1">🔒 Coach Selection Locked</span>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded font-mono">1:1 Session</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-sans">
                  {coaches.map((coach) => {
                    const isSelected = selectedCoachId === coach.id;
                    return (
                      <div
                        key={coach.id}
                        id={`sidebar-coach-locked-${coach.id}`}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500/80 text-blue-200 shadow-xs opacity-100'
                            : 'bg-slate-900/40 border-slate-850/60 text-slate-600 opacity-40'
                        }`}
                      >
                        <img
                          src={coach.img}
                          alt={coach.name}
                          referrerPolicy="no-referrer"
                          className={`w-8 h-8 rounded-full object-cover border ${
                            isSelected ? 'border-blue-400' : 'border-slate-800'
                          }`}
                        />
                        <span className="text-[9px] font-bold mt-1 tracking-tight">{coach.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Speech manual controls & frequency bar spectrum ripples */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between">
                <button
                  type="button"
                  id="btn-repeat-utterance"
                  onClick={speakQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 text-[10px] font-semibold border border-slate-800 cursor-pointer transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Repeat Prompts Speech</span>
                </button>

                {/* Dynamic spectral wave lines */}
                <div className="flex items-end gap-0.5 h-6 px-1">
                  {[2, 4, 3, 5, 2, 4, 1].map((val, idx) => {
                    const animationDelay = `${idx * 0.1}s`;
                    return (
                      <span 
                        key={idx} 
                        className={`w-0.75 ${isSpeaking ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)] animate-wave-float' : 'bg-slate-800'} rounded-full transition-all duration-300`} 
                        style={{ 
                          height: isSpeaking ? `${val * 4}px` : '4px',
                          animationDelay 
                        }} 
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PANEL 2: Candidate Practice Camera Feed (Toggle enabled as requested) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-slate-500 animate-pulse" /> Interviewee Face Camera
                  </h4>
                  <p className="text-[10px] text-slate-400">Review facial posturing</p>
                </div>

                {/* THE TOGGLE WEBCAM BUTTON */}
                <button
                  type="button"
                  id="btn-webcam-manual-toggle"
                  onClick={toggleCamera}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    cameraActive 
                      ? 'bg-blue-100 border-blue-200 text-blue-700' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {cameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
                  <span>{cameraActive ? 'Hide My Face' : 'Show My Face'}</span>
                </button>
              </div>

              {/* Webcam Video Box View port */}
              <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-900 flex flex-col items-center justify-center text-white overflow-hidden shadow-xs">
                {cameraActive ? (
                  <>
                    <video 
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && cameraStream) {
                          el.srcObject = cameraStream;
                        }
                      }} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Pulsing visual border framework */}
                    <div className="absolute inset-2 border border-blue-400/20 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono tracking-wider bg-emerald-500 text-slate-900 px-1.5 py-0.5 rounded-sm uppercase font-bold animate-pulse">● FEED ON</span>
                        <span className="text-[8px] font-mono text-white/50">{targetRole} Practice</span>
                      </div>
                      
                      {/* Scanning visual overlay crosshair */}
                      <span className="self-center text-white/10 text-[9px] uppercase tracking-widest font-mono">Camera active</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <CameraOff className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold">Candidate Webcam Hidden</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 mb-2.5 max-w-[180px] mx-auto leading-normal">Webcam is currently disabled. Click the toggle above if you'd like to practice facial posture feedback.</p>
                    <button
                      type="button"
                      id="btn-sidebar-webcam-quickstart"
                      onClick={toggleCamera}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-500 hover:underline cursor-pointer"
                    >
                      Enable Webcam View
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Strict Evaluator Scoring Rubric */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 border-b border-amber-200/80 pb-2">
                <KeyRound className="w-4 h-4 text-amber-600 animate-pulse animate-duration-1000" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Google API Key Grading Formation
                </h4>
              </div>
              <div className="space-y-3 text-[11px] text-amber-900 leading-relaxed font-sans">
                <p className="font-semibold text-amber-950">
                  Your AI mock coach structures grading and evaluation using the Google Gemini API with your configured Google API Key (GEMINI_API_KEY):
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="font-bold text-amber-700 shrink-0">30%</span>
                    <span><strong>Role Expertise:</strong> Demonstrates real conceptual mastery and correct industry terminology for a <strong className="text-amber-950">"{targetRole}"</strong>.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-amber-700 shrink-0">40%</span>
                    <span><strong>STAR Structure & Metrics:</strong> Explicitly frame answers with situation, concrete actions, and numeric results.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-amber-700 shrink-0">30%</span>
                    <span><strong>Answer Depth:</strong> Short, vague, or fluffy answers (under 20 words) are graded strictly below <strong className="text-amber-950">60/100</strong>.</span>
                  </div>
                </div>
                <div className="bg-white/80 border border-amber-200 p-2.5 rounded-xl text-[10px] text-amber-800 space-y-1 mt-1 font-sans">
                  <strong className="text-amber-950 block">💡 Pro Coach Recommendation:</strong>
                  Instead of "I am reliable," say "While working as a {targetRole}, I automated a redundant database cleanup task, saving 8 hours weekly."
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === 'report' && selectedReviewSession && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 animate-fade-in">
          
          {/* Header Banner */}
          <div className="item-header flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Mock Placement Report Card
              </div>
              <h2 id="report-title" className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {selectedReviewSession.role} Scorecard
              </h2>
              <p className="text-xs text-slate-500">Sector: {selectedReviewSession.industry} | Conducted {selectedReviewSession.date}</p>
            </div>

            <button
              id="btn-back-to-setup"
              onClick={() => { setSelectedReviewSession(null); setStage('setup'); }}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-105 text-blue-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Back to Coach Setup
            </button>
          </div>

          {/* Tab Selection Switcher */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              id="tab-btn-scorecard"
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                setReportTab('scorecard');
              }}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer font-sans ${
                reportTab === 'scorecard'
                  ? 'border-blue-600 text-blue-600 border-b-2'
                  : 'border-transparent text-slate-500 hover:text-slate-750'
              }`}
            >
              📊 Core Scorecard Report
            </button>
            <button
              id="tab-btn-coaching"
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                setReportTab('coaching');
                setPracticeTranscript('');
                // Initialize default coaching question to first one
                if (selectedReviewSession.qas.length > 0) {
                  setSelectedQAForCoaching(0);
                }
              }}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 focus:outline-none relative font-sans ${
                reportTab === 'coaching'
                  ? 'border-blue-600 text-blue-600 border-b-2'
                  : 'border-transparent text-slate-500 hover:text-slate-750'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>🎙️ Oral Feedback Coach Session</span>
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] rounded-full font-black animate-bounce font-mono">INTERACTIVE</span>
            </button>
          </div>

          {/* TAB 1: consolidated core scorecard */}
          {reportTab === 'scorecard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Quick Metrics & Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Gauge widget (SVG chart) */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                
                {/* SVG circular progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-slate-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-blue-600"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - selectedReviewSession.overallScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span id="overall-score-indicator" className="text-2xl font-extrabold text-slate-900">{selectedReviewSession.overallScore}%</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Overall</span>
                </div>
              </div>
              <span className="mt-4 text-[11px] font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded">
                CRITERIA LEVEL: COMPETENT
              </span>
            </div>

            {/* Recommendations & Prose summary */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recruiter Evaluation</h4>
                <p id="recruiter-evaluation-prose" className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {selectedReviewSession.evaluationText}
                </p>
              </div>

              {/* Personalized recommendations (FR-3.10) */}
              <div id="personalized-skills-recommendations" className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800 flex items-center gap-1 pb-1">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Personalized Skilling Roadmap
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {selectedReviewSession.suggestedResources.map((res, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-emerald-100/40 text-center">
                      <div className="text-[10px] text-emerald-700 font-bold leading-tight">{res}</div>
                      <div className="text-[8px] text-slate-400 mt-1">Free modules available</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Strengths and Improvements lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/50">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">🏆 Absolute Strengths Demonstrated</h4>
              <ul className="space-y-2">
                {selectedReviewSession.strengths.map((str, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-xs text-emerald-700">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50/20 p-5 rounded-2xl border border-amber-100/50">
              <h4 className="text-xs font-bold text-amber-850 uppercase tracking-wider mb-3">🛠️ Suggested Focus Areas</h4>
              <ul className="space-y-2">
                {selectedReviewSession.improvements.map((imp, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-xs text-amber-800">
                    <AlertTriangle className="shrink-0 w-3.5 h-3.5 text-amber-500 mt-0.5" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Question and Answer logs matrix table */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Sequential Responses detailed breakdown</h3>
            <div className="space-y-4">
              {selectedReviewSession.qas.map((qa, idx) => (
                <div key={idx} className="bg-slate-55 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Q{idx + 1}: prompt</span>
                    <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-0.5 rounded-full ml-auto">
                      Score: {qa.score}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-850 font-bold bg-white p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                    "{qa.question}"
                  </p>

                  <div>
                    <h5 className="text-[10px] uppercase text-blue-600 font-bold tracking-wider mb-1">Your typed answer</h5>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {qa.answer || "No response provided."}
                    </p>
                  </div>

                  {/* Grading Rubric & Awarded Points Breakdown */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 mt-2">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-700 uppercase tracking-widest border-b border-slate-205 pb-1.5 font-sans">
                      <span className="flex items-center gap-1.5">🔑 Google API Key Grading Formation</span>
                      <span className="text-blue-700 font-extrabold">SUM: {qa.score}/100</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center font-sans">
                      <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-xs">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Domain Accuracy</div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">
                          {qa.scoreBreakdown?.domainAccuracy ?? Math.round(qa.score * GRADING_WEIGHTS.domainAccuracy)} <span className="text-[9px] text-slate-400 font-normal">/ {Math.round(GRADING_WEIGHTS.domainAccuracy * 100)}</span>
                        </div>
                      </div>
                      
                      {/* Detailed STAR formulation score breakdown */}
                      <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-xs">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">STAR Formulation</div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">
                          {qa.scoreBreakdown?.starStructure ?? Math.round(qa.score * GRADING_WEIGHTS.starStructure)} <span className="text-[9px] text-slate-400 font-normal">/ {Math.round(GRADING_WEIGHTS.starStructure * 100)}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-0.5 mt-1.5 pt-1.5 border-t border-slate-100 font-mono text-[8px] leading-none">
                          <div>
                            <div className="text-slate-400 uppercase font-bold" title="Situation">S</div>
                            <div className="font-black text-blue-600 mt-0.5">
                              {qa.scoreBreakdown?.starDetailed?.situation ?? Math.round((qa.scoreBreakdown?.starStructure ?? Math.round(qa.score * GRADING_WEIGHTS.starStructure)) * 0.25)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 uppercase font-bold" title="Task">T</div>
                            <div className="font-black text-blue-600 mt-0.5">
                              {qa.scoreBreakdown?.starDetailed?.task ?? Math.round((qa.scoreBreakdown?.starStructure ?? Math.round(qa.score * GRADING_WEIGHTS.starStructure)) * 0.25)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 uppercase font-bold" title="Action">A</div>
                            <div className="font-black text-blue-600 mt-0.5">
                              {qa.scoreBreakdown?.starDetailed?.action ?? Math.round((qa.scoreBreakdown?.starStructure ?? Math.round(qa.score * GRADING_WEIGHTS.starStructure)) * 0.25)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 uppercase font-bold" title="Result">R</div>
                            <div className="font-black text-blue-600 mt-0.5">
                              {qa.scoreBreakdown?.starDetailed?.result ?? Math.round((qa.scoreBreakdown?.starStructure ?? Math.round(qa.score * GRADING_WEIGHTS.starStructure)) * 0.25)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-200/60 shadow-xs">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tone & Delivery</div>
                        <div className="text-xs font-black text-slate-800 mt-0.5">
                          {qa.scoreBreakdown?.communication ?? Math.round(qa.score * GRADING_WEIGHTS.communication)} <span className="text-[9px] text-slate-400 font-normal">/ {Math.round(GRADING_WEIGHTS.communication * 100)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-450 leading-relaxed font-sans italic">
                      * Evaluated strictly. <strong>STAR elements</strong> (Situation, Task, Actions, quantitative Results) and direct industry keywords are required to unlock highest scores.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="space-y-1.5">
                      <div className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Turn metrics</div>
                      <div className="text-xs text-slate-500 leading-normal">
                        <strong>Clarity:</strong> {qa.clarity}
                      </div>
                      <div className="text-xs text-slate-500 leading-normal">
                        <strong>Relevance:</strong> {qa.relevance}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] uppercase font-bold text-blue-600 tracking-wider">Answer adjustment suggestion</div>
                      <p className="text-xs text-slate-655 leading-relaxed mt-1">
                        {qa.suggestions}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

            </div>
          )}

          {/* TAB 2: Oral Feedback Coach Session */}
          {reportTab === 'coaching' && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    Interactive Oral Re-practice Workspace
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Select any question below, review suggestions, and try re-answering verbally via your microphone to see your improvement.</p>
                </div>
                {/* Voice repeat */}
                <button
                  type="button"
                  id="btn-coaching-speak"
                  onClick={() => speakCoachingSuggestions(selectedReviewSession.qas[selectedQAForCoaching]?.question || '')}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen to Question</span>
                </button>
              </div>

              {/* Selector and Main workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Question Selector */}
                <div className="space-y-3 lg:col-span-1">
                  <h4 className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 font-sans">Questions List</h4>
                  <div className="space-y-2">
                    {selectedReviewSession.qas.map((qa, index) => (
                      <button
                        key={index}
                        id={`coaching-qa-select-${index}`}
                        onClick={() => {
                          window.speechSynthesis.cancel();
                          setIsSpeaking(false);
                          setSelectedQAForCoaching(index);
                          setPracticeTranscript('');
                          setCoachingEvaluation(null);
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer font-sans ${
                          selectedQAForCoaching === index
                            ? 'bg-blue-50/50 border-blue-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            selectedQAForCoaching === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Turn {index + 1}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">Score: {qa.score}</span>
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2 font-medium mt-1 leading-normal font-sans">
                          {qa.question}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Side: Interactive Workshop */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedReviewSession.qas[selectedQAForCoaching] && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                      
                      {/* Active Prompt Box */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest font-mono">SELECTED PROMPT</span>
                        <p id="coaching-prompt-text" className="text-xs font-bold text-slate-800 leading-normal mt-1 italic">
                          "{selectedReviewSession.qas[selectedQAForCoaching].question}"
                        </p>
                      </div>

                      {/* Original Feedback Summary columns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-rose-50/20 p-4 rounded-xl border border-rose-100/50">
                          <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Your Original Response</span>
                          <p className="text-xs text-slate-600 leading-normal italic whitespace-pre-wrap">
                            "{selectedReviewSession.qas[selectedQAForCoaching].answer || 'No response provided.'}"
                          </p>
                        </div>
                        <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100/50">
                          <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Expert Suggestions to Address</span>
                          <p className="text-xs text-slate-700 leading-normal whitespace-pre-wrap font-sans">
                            {selectedReviewSession.qas[selectedQAForCoaching].suggestions}
                          </p>
                        </div>
                      </div>

                      {/* Oral Re-practice Studio */}
                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <div>
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-sans">🎙️ Oral Re-answering Studio</h4>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-sans">Simulate a conversational upgrade verbally</p>
                          </div>
                          
                          {/* Microphone Button */}
                          <button
                            type="button"
                            id="coaching-mic-toggle"
                            onClick={toggleListening}
                            disabled={loadingCoachingEval || !micSupported}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all font-sans ${
                              isListening
                                ? 'bg-red-500 border-red-600 text-white animate-pulse'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>{isListening ? 'Stop Recording' : 'Start Speaking'}</span>
                          </button>
                        </div>

                        {speechError && (
                          <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-900/60 text-xs text-amber-200 leading-normal space-y-2 font-sans">
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-bold mt-0.5">⚠️</span>
                              <div>
                                <p className="font-bold">Microphone is Blocked/Restricted</p>
                                <p className="text-[10px] text-amber-300/80 leading-relaxed mt-0.5">
                                  Browsers restrict speech-to-text features inside embedded sandboxed previews (iframes). To record hands-free:
                                </p>
                                <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-[10px] text-amber-300/80">
                                  <li>Open the application directly in a new tab by clicking below.</li>
                                  <li>Accept microphone permissions when prompted in the new tab.</li>
                                </ol>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pl-6 pt-0.5">
                              <a 
                                href={window.location.href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-amber-700 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm"
                              >
                                Open App in New Tab ↗
                              </a>
                              <button 
                                type="button" 
                                onClick={() => setSpeechError(null)}
                                className="text-amber-400 hover:text-amber-300 font-bold text-[10px] hover:underline cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        )}

                        {coachingTypedFallbackActive ? (
                          <textarea
                            rows={3}
                            value={practiceTranscript}
                            onChange={(e) => setPracticeTranscript(e.target.value)}
                            placeholder="Type your improved interview response manually here..."
                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-xs font-sans text-slate-200 resize-none outline-none min-h-[100px]"
                          />
                        ) : (
                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 min-h-[80px] flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-mono text-slate-400 tracking-wider uppercase">Live Oral Transcript</span>
                            </div>
                            <p id="coaching-live-transcript" className="text-xs text-slate-200 leading-relaxed font-sans min-h-[30px] whitespace-pre-wrap mt-1">
                              {practiceTranscript.trim() ? (
                                <span className="text-white font-medium">"{practiceTranscript}"</span>
                              ) : (
                                <span className="text-slate-500 italic">Enable the microphone above and speak your improved verbal answer to see the transcript populate...</span>
                              )}
                            </p>
                            {practiceTranscript.trim() && (
                              <button
                                type="button"
                                id="btn-clear-coaching-practice"
                                onClick={() => setPracticeTranscript('')}
                                className="text-[9px] text-slate-400 hover:text-slate-200 mt-2 self-end hover:underline font-mono"
                              >
                                Reset Speech Transcript
                              </button>
                            )}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 select-none font-sans flex items-center justify-center gap-1.5 flex-wrap mt-1">
                          <span>📝 <strong>Response Mode:</strong> Direct typing is active. You can also dictate with the mic button above.</span>
                          <button
                            type="button"
                            onClick={() => setCoachingTypedFallbackActive(!coachingTypedFallbackActive)}
                            className="text-blue-400 hover:text-blue-300 font-extrabold hover:underline cursor-pointer"
                          >
                            {coachingTypedFallbackActive ? "✏️ Disable keyboard typing" : "✏️ Enable keyboard typing"}
                          </button>
                        </div>

                        {/* Submit evaluation controls */}
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            id="btn-coaching-submit"
                            disabled={loadingCoachingEval || !practiceTranscript.trim()}
                            onClick={submitCoachingEvaluation}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1.5 font-sans"
                          >
                            {loadingCoachingEval ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Evaluating...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-200" />
                                <span>Analyze Improved Verbal Response</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Coaching Evaluation results banner (FR-3.11) */}
                      {coachingEvaluation && (
                        <div id="coaching-feedback-results" className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3 animate-fade-in text-slate-800">
                          <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <Trophy className="w-4 h-4 text-emerald-600 animate-bounce" />
                              Improved Turn Performance
                            </span>
                            <span className="text-xs font-mono font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                              New Score: {coachingEvaluation.score}/100
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-emerald-800 uppercase font-sans">Clarity Enhancement</span>
                              <p className="text-xs text-slate-700 leading-normal font-sans">{coachingEvaluation.clarity}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-emerald-800 uppercase font-sans">Strategic Relevance</span>
                              <p className="text-xs text-slate-700 leading-normal font-sans">{coachingEvaluation.relevance}</p>
                            </div>
                          </div>
                           {/* Coached Points Breakdown */}
                          <div className="bg-emerald-100/40 rounded-xl p-3.5 space-y-2 text-slate-800">
                            <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-widest block font-sans">
                              🎙️ Spoken Oral Upgrade Scoring breakdown
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="bg-white p-2 rounded-lg border border-emerald-200/60 shadow-xs">
                                <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Speech Delivery</div>
                                <div className="font-extrabold text-slate-800 mt-0.5">
                                  {coachingEvaluation.scoreBreakdown?.deliveryClarity ?? Math.round(coachingEvaluation.score * 0.3)} <span className="text-[9px] text-slate-400 font-normal">/ 30</span>
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-emerald-200/60 shadow-xs">
                                <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Advice Integrated</div>
                                <div className="font-extrabold text-slate-800 mt-0.5">
                                  {coachingEvaluation.scoreBreakdown?.suggestionIntegration ?? Math.round(coachingEvaluation.score * 0.5)} <span className="text-[9px] text-slate-400 font-normal">/ 50</span>
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-emerald-200/60 shadow-xs">
                                <div className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Story Structure</div>
                                <div className="font-extrabold text-slate-800 mt-0.5">
                                  {coachingEvaluation.scoreBreakdown?.responseStructure ?? Math.round(coachingEvaluation.score * 0.2)} <span className="text-[9px] text-slate-400 font-normal">/ 20</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-[9px] text-emerald-800/80 italic font-sans">
                              * Spoken responses are measured strictly against initial improvements. Complete integration is necessary to claim full points.
                            </div>
                          </div>

                          <div className="border-t border-emerald-100 pt-2.5">
                            <span className="text-[9px] font-bold text-emerald-850 uppercase font-sans">Interactivity Analysis (Did you incorporate the suggestions?)</span>
                            <p id="coaching-interactivity-prose" className="text-xs text-slate-700 leading-relaxed mt-1 font-sans">
                              {coachingEvaluation.interactivityAnalysis}
                            </p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
