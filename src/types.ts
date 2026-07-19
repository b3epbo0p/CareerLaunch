export interface InterviewStory {
  id: string;
  title: string;
  role: string;
  industry: string;
  companyType: 'Startup' | 'Tech Giant' | 'Corporate' | 'Agency' | 'Consulting';
  experienceLevel: string;
  content: string;
  lessons: string[];
  mistakes: string[];
  successTips: string[];
  date: string;
  source: string; // The origin of the real story (e.g. Glassdoor entry, Reddit r/sales, industry interview)
}

export interface InterviewTip {
  id: string;
  category: 'before' | 'during' | 'after';
  title: string;
  description: string;
  actions: string[];
  source: string; // Sourced from (e.g. LinkedIn Hiring Managers Survey, Automotive Sales Guild, r/AskHR)
}

export type QuestionCategory = 'Technical' | 'Behavioural' | 'Situational' | 'Company-Specific';

export interface GeneratedQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  intent: string;
  suggestedPoints: string[];
}

export interface QuestionSet {
  id: string;
  jobTitle: string;
  industry: string;
  level?: string;
  jobDescription: string;
  questions: GeneratedQuestion[];
  generatedAt: string;
  isSimulated?: boolean;
}

export interface MockInterviewQA {
  question: string;
  answer: string;
  score: number; // 0-100
  clarity: string;
  relevance: string;
  professionalism: string;
  suggestions: string;
  scoreBreakdown?: {
    domainAccuracy: number; // out of 30
    starStructure: number;   // out of 40
    starDetailed?: {
      situation: number; // out of 10
      task: number;      // out of 10
      action: number;    // out of 10
      result: number;    // out of 10
    };
    communication: number;   // out of 30
  };
}

export interface MockInterviewSession {
  id: string;
  industry: string;
  role: string;
  level?: string;
  date: string;
  status: 'ongoing' | 'completed';
  questions: string[];
  answers: string[];
  qas: MockInterviewQA[];
  overallScore: number;
  strengths: string[];
  improvements: string[];
  suggestedResources: string[];
  evaluationText: string;
  isSimulated?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  targetRole: string;
  targetIndustry: string;
  targetCompanyType: string;
  savedStories: string[]; // Story IDs
  savedTips: string[]; // Tip IDs
  savedQuestionSets: string[]; // QuestionSet IDs
}
