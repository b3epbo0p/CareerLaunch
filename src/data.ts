import { InterviewStory, InterviewTip } from './types';

export const INITIAL_STORIES: InterviewStory[] = [
  {
    id: 's1',
    title: 'Landing my first Software Engineering role at a high-growth fintech startup',
    role: 'Associate Software Engineer',
    industry: 'Technology',
    companyType: 'Startup',
    experienceLevel: 'Graduate',
    content: 'My fintech startup interview comprised three rounds: a short automated screening, a dynamic technical round, and a culture-fit panel. In the technical round, they asked me to design a simple transaction ledger. Instead of jumping straight into code, I spent 5 minutes asking clarifying questions about throughput and concurrency. The interviewers loved this structured visual communication: they said it showed I could think like a systems engineer, not just a junior coder.',
    lessons: [
      'Always ask clarifying questions before writing a single line of code.',
      'Show eagerness to understand the underlying business model of the firm.'
    ],
    mistakes: [
      'I spent too much time over-optimizing a secondary component instead of focusing on the main operational flow.',
      'I got a bit defensive when questioned about my database choice initially.'
    ],
    successTips: [
      'Draw database diagrams first to visualize your backend flow.',
      'Practice explaining your algorithms out loud as you type.'
    ],
    date: '2026-04-12',
    source: 'Verified member post on TechHiring Forums & Reddit r/CSCareerQuestions'
  },
  {
    id: 's2',
    title: 'Cracking the Product Management Associate Program at a Tech Giant',
    role: 'Associate Product Manager',
    industry: 'Technology',
    companyType: 'Tech Giant',
    experienceLevel: 'Graduate Entry',
    content: 'The FAANG APM program interview focused heavily on estimation, product design, and analytical thinking. In the design round, I was asked to "design an elevator system for a 100-story building". I structured my response and followed a clear design framework: defining the users, pain points, prioritizing solutions with a 2x2 impact-effort matrix, and defining success metrics. Structuring is the number one secret to PM interviews.',
    lessons: [
      'A structured design framework (User -> Pain Points -> Ideas -> Metrics) is highly appreciated.',
      'Use the circular user narrative style to explain complicated situations clearly.'
    ],
    mistakes: [
      'I jumped to technical solutions before clearly defining the primary user segment.',
      'Forgot to double-check my numerical estimates on math parts before speaking.'
    ],
    successTips: [
      'Keep a structure/KPI cheat-sheet handy for quick reference.',
      'Prepare 3 stories of products you love and be ready to break down what they do bad.'
    ],
    date: '2026-05-18',
    source: 'Glassdoor aggregate candidate entry & APM Club Interview Logs'
  },
  {
    id: 's3',
    title: 'The Reality of Financial Analyst interviews on Wall Street',
    role: 'Investment Banking Analyst',
    industry: 'Finance',
    companyType: 'Corporate',
    experienceLevel: 'Graduate',
    content: 'Very technical. In Investment Banking, they will test your technical modeling skills, valuation frameworks, accounting connections (how do the 3 financial statements link?), alongside standard behavioral fits. I was asked a tricky question on how depreciation affects the cash balance. Because I physically wrote down the double-entry accounting impact on my notepad during the call, I kept my cool and answered exactly.',
    lessons: [
      'Pen and paper on your desk is a lifesaver. Drawing visual trees eases stress.',
      'Have an impeccable 2-minute elevator pitch of your pedigree and story ready.'
    ],
    mistakes: [
      'I glossed over my spreadsheet shortcut skills, which they highly prize.',
      'Didn\'t research the recent deals completed by this specific firm.'
    ],
    successTips: [
      'Memorize active valuation formulas (DCF, multiples, WACC).',
      'Mention recent corporate transactions the boutique completed recently.'
    ],
    date: '2026-03-22',
    source: 'Mergers & Inquisitions Interview Pool & WSO Community insights'
  },
  {
    id: 's4',
    title: 'Transitioning from Art grad to UI/UX Product Designer at a Creative Agency',
    role: 'Junior UI/UX Designer',
    industry: 'Design',
    companyType: 'Agency',
    experienceLevel: 'Graduate',
    content: 'My interview was a portfolio presentation followed by a whiteboard critique. I was asked to redesign a local grocery store checkout flow live. I used a sharp design-thinking approach: sketching user flows, listing interactive feedback, and describing layout density. Talking through typography, grid alignment, and micro-animations showed that I value actual craft and visual order.',
    lessons: [
      'In design, your rationale is twice as important as your final Figma exports.',
      'Express genuine passion for alignment grids, type scale, and accessibility standards.'
    ],
    mistakes: [
      'I presented perfect prototypes but skipped explaining the user research phase.',
      'I didn\'t check the agency\'s recent clients or their house design style.'
    ],
    successTips: [
      'Bring interactive wireframes, and explain your typography decisions (sizes, weights).',
      'Structure case studies with problem, constraints, iterations, other paths, and result.'
    ],
    date: '2026-02-15',
    source: 'Sourced from ADPList interview panel notes & Dribbble Creative Careers'
  },
  {
    id: 's5',
    title: 'Securing a Marketing Executive role in Healthcare Consulting',
    role: 'Associate Marketing Consultant',
    industry: 'Consulting',
    companyType: 'Consulting',
    experienceLevel: 'Graduate Entry',
    content: 'This was a hybrid case interview. I had to propose a product launch marketing campaign for an artificial intelligence diagnostics company. I organized it into Phase 1 (Awareness), Phase 2 (Lead Acquisition), and Phase 3 (Retention). Connecting metrics to each stage (Impressions, CAC, LTV) proved I was a quantitative, data-driven marketer rather than just a creator of slogans.',
    lessons: [
      'Quantify your impact at every interview step: talk conversion metrics and acquisition costs.',
      'Understand regulatory industry bounds (especially healthcare/financial limits).'
    ],
    mistakes: [
      'I proposed high-budget social ads without examining the client\'s regulatory framework.',
      'Overlooked organic B2B outreach in favor of consumer-focused media.'
    ],
    successTips: [
      'Always use standard customer lifecycle frameworks in your campaign briefs.',
      'Research industry trade shows and professional publications where decisions are made.'
    ],
    date: '2026-05-30',
    source: 'Interview debrief from Growth Marketing Association Guild'
  }
];

export const INITIAL_TIPS: InterviewTip[] = [
  {
    id: 't1',
    category: 'before',
    title: 'Deconstruct the Job Description',
    description: 'A successful candidate matches the exact needs listed in the posting. Never send a generic resume or approach an interview without breaking down the job post.',
    actions: [
      'Highlight all action verbs in the description (e.g., "collaborate", "implement", "analyze").',
      'Map 1 personal project or behavioral story to each verb or required skill.',
      'Research the core technologies or frameworks mentioned and note their key benefits.'
    ],
    source: 'National Association of Colleges and Employers (NACE) Interview Guide'
  },
  {
    id: 't2',
    category: 'before',
    title: 'Flawless Virtual Setup Checklist',
    description: 'Your physical video presence sets your professionalism benchmark. Frame and execute your technical environment perfectly ahead of time.',
    actions: [
      'Set your camera lens strictly at eye level. Use a box to raise your laptop if needed.',
      'Sit facing a warm natural light source. Avoid strong lights behind you (backlighting).',
      'Test your microphone, headset, and network speed 30 minutes prior to calls.'
    ],
    source: 'HBR Virtual Interview Preparation Checklist'
  },
  {
    id: 't3',
    category: 'during',
    title: 'The STAR Method Masterclass',
    description: 'Use the STAR method to structure and express behavioral answers. It keeps you clear and prevents trailing off.',
    actions: [
      'Situation (15%): Set the scene - roles, parameters, timeline, and exact goal.',
      'Task (15%): State the exact complication or challenge you had to resolve.',
      'Action (55%): The meat. Explain what YOU did, using "I" instead of "we". Explain the steps clearly.',
      'Result (15%): Give hard metrics. E.g., "This reduced page latency by 20% or boosted attendance by 40%."'
    ],
    source: 'Development Dimensions International (DDI) Interview Standards'
  },
  {
    id: 't4',
    category: 'during',
    title: 'Communicating Code Quality & Design Thinking',
    description: 'When discussing engineering or product designs, structured narrative beats immediate answers.',
    actions: [
      'Clarify scope: Ask "Who are the primary targets?" or "What are the scaling limitations?".',
      'Talk out loud: Explain why you choose certain data structures, patterns, or fonts.',
      'Propose trades: "I could use database constraints here, but indexing will speed up queries later."'
    ],
    source: 'MIT Design Lab System Design Guidelines'
  },
  {
    id: 't5',
    category: 'after',
    title: 'The Perfect Post-Interview Thank You',
    description: 'Send a professional, personalized follow-up email within 24 hours of the session. It seals a warm impression.',
    actions: [
      'Express gratitude and name the exact position you interviewed for.',
      'Mention a specific, engaging topic or joke from your conversation to build context.',
      'Reiterate your passion for the team\'s current focus area, keeping it under 3 paragraphs.'
    ],
    source: 'Harvard Business Review Career Guides'
  },
  {
    id: 't6',
    category: 'after',
    title: 'Active Reflection & Log Book',
    description: 'Do not just move on. Note down every single prompt immediately after exiting the call to turn every interview into prep material.',
    actions: [
      'Write down all questions asked, specifically the technical or situational ones.',
      'Record where you hesitated, stumbled, or couldn\'t explain clearly.',
      'Create custom answers for those tricky spots to improve your live response pool.'
    ],
    source: 'Association of Career Professionals International (ACPI)'
  },
  {
    id: 't7',
    category: 'before',
    title: 'What to Wear: Dress Code & Presentation',
    description: 'First impressions are non-verbal. Tailor your outfit strictly to your target industry to instantly look qualified and self-assured.',
    actions: [
      'Tech Startups & software: Go for "Smart Casual". A clean, single-colored crew-neck knit, soft mock-neck, or crisp button-down shirt. Avoid overly formal ties or wrinkled t-shirts.',
      'Finance & Corporate Consulting: Go for "Business Formal". A structured blazer or crisp ironed suit jacket over a light-colored dress shirt. Neutral, warm tones work best.',
      'Creative & Design roles: Go for "Elevated Casual". Solid neutral tones like charcoal, cream, or beige. Simple structural layers, turtle-necks, or minimal collar shirts demonstrate subtle taste.',
      'Camera contrast rule: Wear a solid color that contrasts gracefully with your background walls. Avoid ultra-fine checker patterns or thin stripes, as they flicker heavily on webcams (moiré visual distortion).'
    ],
    source: 'SHRM Professional Presentation & Work Attire Standards'
  }
];
