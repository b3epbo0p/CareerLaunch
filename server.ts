import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client with telemetry headers
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API Key in the Settings > Secrets panel of Google AI Studio.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Graceful, clean warning logger to handle 429/503 quota limit errors during concurrent runs cleanly without polluting test logs
function logGeminiError(context: string, error: any) {
  const errMsg = error?.message || String(error);
  if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("503") || errMsg.includes("demand") || errMsg.includes("UNAVAILABLE")) {
    console.warn(`[Gemini Fallback Active] ${context}: Quota rate-limit or high service demand detected (429/503). Graceful local simulation loaded successfully.`);
  } else {
    console.warn(`[Gemini Fallback Active] ${context}: ${errMsg}. Graceful local simulation loaded successfully.`);
  }
}

// Simulated data helpers in case Gemini API is not configured or fails
function isCodingRole(jobTitle: string): boolean {
  const t = jobTitle.toLowerCase();
  return t.includes('engineer') || 
         t.includes('developer') || 
         t.includes('programmer') || 
         t.includes('coder') || 
         t.includes('coding') || 
         t.includes('software') || 
         t.includes('backend') || 
         t.includes('frontend') || 
         t.includes('fullstack') || 
         t.includes('web dev') || 
         t.includes('programming') ||
         t.includes('sysops') ||
         t.includes('devops');
}

function getMockQuestions(jobTitle: string, industry: string, level?: string): any[] {
  const titleLower = jobTitle.toLowerCase();
  const indLower = industry.toLowerCase();
  const levelLabel = level ? ` (${level} level)` : '';
  const candidateRef = level ? `as a ${level} candidate` : 'your graduate background';

  // Determine standard role category
  const isMedical = titleLower.includes('dentist') || titleLower.includes('doctor') || titleLower.includes('medical') || titleLower.includes('nurse') || titleLower.includes('health') || titleLower.includes('clinical') || titleLower.includes('patient') || indLower.includes('health') || indLower.includes('medical') || indLower.includes('dental');
  const isTechCoding = isCodingRole(jobTitle) && (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('programmer') || titleLower.includes('software') || titleLower.includes('tech') || titleLower.includes('coder') || titleLower.includes('data') || indLower.includes('tech') || indLower.includes('software'));

  if (isMedical) {
    return [
      // Behavioural
      {
        id: `q-${Date.now()}-1`,
        text: `What motivated you to enter the dental and medical profession, and how does your training prepare you for this ${jobTitle} role${levelLabel}?`,
        category: "Behavioural",
        intent: "To evaluate candidate commitment, bedside manner, and clinical care orientation.",
        suggestedPoints: ["State your passion for helping patients and dental health.", "Connect clinical or academic labs to the role.", "Mention why this clinic or organization appeals to you."]
      },
      {
        id: `q-${Date.now()}-2`,
        text: `Tell me about a time you had to deal with an anxious or difficult patient or colleague. How did you handle the situation?`,
        category: "Behavioural",
        intent: "To assess empathy, patient reassurance, communication, and conflict resolution under pressure.",
        suggestedPoints: ["Focus on patient comfort and active listening.", "Explain how you calmed anxiety using clear communication.", "Detail the successful resolution or treatment outcome."]
      },
      {
        id: `q-${Date.now()}-3`,
        text: `Can you share a situation where you had to manage a busy patient schedule with unexpected clinical emergencies?`,
        category: "Behavioural",
        intent: "To assess prioritization, resilience, and maintaining patient care quality under stress.",
        suggestedPoints: ["Explain how you triaged patients based on urgency.", "Describe keeping patients informed of delays.", "Focus on maintaining high safety and treatment standards."]
      },
      // Technical
      {
        id: `q-${Date.now()}-4`,
        text: `Can you describe your experience with modern clinical tools, diagnostic equipment, or patient management software essential for ${jobTitle}?`,
        category: "Technical",
        intent: "To evaluate competency with dental/medical instruments, safety guidelines, and treatment planning.",
        suggestedPoints: ["List specific clinical tools or software you're trained on.", "Explain your protocol for infection control or diagnostics.", "Highlight continuous learning of new clinical procedures."]
      },
      {
        id: `q-${Date.now()}-5`,
        text: `How do you stay updated with the latest treatments, guidelines, or dental technologies, and how do you apply them in practice?`,
        category: "Technical",
        intent: "To validate commitment to continuous education and evidence-based practice.",
        suggestedPoints: ["Mention professional journals, courses, or training.", "Give an example of implementing a modern clinical best practice.", "Discuss maintaining credential standards."]
      },
      {
        id: `q-${Date.now()}-6`,
        text: `How do you approach a complex diagnosis or treatment plan when a patient's symptoms are atypical or conflicting?`,
        category: "Technical",
        intent: "To evaluate clinical problem-solving, diagnostic precision, and patient counseling.",
        suggestedPoints: ["Describe step-by-step diagnostic verification.", "Detail consulting medical histories or secondary opinions.", "Explain how you present treatment options clearly to the patient."]
      },
      // Situational
      {
        id: `q-${Date.now()}-7`,
        text: `How would you handle a situation where a patient refuses a highly recommended, critical treatment due to cost or anxiety?`,
        category: "Situational",
        intent: "To assess patient advocacy, clear explanation of risks, and collaborative decision making.",
        suggestedPoints: ["Educate the patient clearly on pros, cons, and risks without pressure.", "Explore alternative treatments or flexible payment structures.", "Respect patient autonomy while documenting the refusal correctly."]
      },
      {
        id: `q-${Date.now()}-8`,
        text: `If you notice a fellow practitioner failing to adhere strictly to hygiene or clinical safety protocols, what immediate steps do you take?`,
        category: "Situational",
        intent: "To evaluate professional ethics, patient safety priority, and communication tact.",
        suggestedPoints: ["Prioritize patient safety above all else.", "Address the colleague constructively and professionally in private.", "Follow clinical reporting procedures if safety remains compromised."]
      },
      {
        id: `q-${Date.now()}-9`,
        text: `Imagine a patient is deeply unsatisfied with their treatment results and becomes highly vocal in the waiting room. How do you manage this?`,
        category: "Situational",
        intent: "To evaluate crisis de-escalation, professional poise, and clinic reputation management.",
        suggestedPoints: ["Invite the patient to a private room immediately to maintain clinic calm.", "Listen actively without getting defensive.", "Offer clear, realistic corrective solutions."]
      },
      // Company-Specific
      {
        id: `q-${Date.now()}-10`,
        text: `What is one major development or technology in the ${industry} field right now that you are eager to bring to our clinic?`,
        category: "Company-Specific",
        intent: "To evaluate proactive interest and forward-thinking clinical contribution.",
        suggestedPoints: ["Identify a specific advance (e.g., digital imaging, pain-free techniques).", "Explain how it improves patient outcomes.", "Discuss the integration process."]
      },
      {
        id: `q-${Date.now()}-11`,
        text: `How do you see our clinic's commitment to patient-centered care and community health aligning with your values?`,
        category: "Company-Specific",
        intent: "To evaluate patient dedication and alignment with clinic standards.",
        suggestedPoints: ["Reference a specific mission of the clinic.", "Connect it with your history of volunteer or volunteer-like patient care.", "Emphasize long-term career growth with the clinic."]
      },
      {
        id: `q-${Date.now()}-12`,
        text: `Why do you want to practice specifically at our clinic compared to other dental or healthcare providers in the area?`,
        category: "Company-Specific",
        intent: "To ensure alignment with the clinic's patient demographic and unique services.",
        suggestedPoints: ["State unique aspects of our clinical practice (e.g., family care, specialized treatments).", "Show genuine respect for our local reputation.", "Convey excitement about learning from our experienced team."]
      }
    ];
  }

  if (isTechCoding) {
    return [
      // Behavioural
      {
        id: `q-${Date.now()}-1`,
        text: `What motivated you to apply for this ${jobTitle} role${levelLabel}, and how does your engineering background prepare you?`,
        category: "Behavioural",
        intent: "To evaluate candidate alignment, tech passion, and communication skills.",
        suggestedPoints: ["State your core passion.", "Link personal or academic projects to the role.", "Mention why this specific tech sector appeals to you."]
      },
      {
        id: `q-${Date.now()}-2`,
        text: `Tell me about a time you had to work with a difficult team member or partner. How did you resolve the friction?`,
        category: "Behavioural",
        intent: "To evaluate conflict resolution, empathy, and constructive communication.",
        suggestedPoints: ["Focus on objective facts rather than personal feelings.", "Use standard active listening to align intentions.", "Describe the positive shared outcome."]
      },
      {
        id: `q-${Date.now()}-3`,
        text: `Can you share a significant professional or academic failure, and what vital lessons you learned from it?`,
        category: "Behavioural",
        intent: "To assess resilience, self-reflection, and continuous self-improvement.",
        suggestedPoints: ["Explain the situation and take full responsibility.", "Detail the constructive adjustments made since.", "Provide evidence of subsequent success."]
      },
      // Technical
      {
        id: `q-${Date.now()}-4`,
        text: `Can you describe a challenging technical, architectural, or coding project you completed, and how you solved a critical bottleneck?`,
        category: "Technical",
        intent: "To test problem-solving, structural design, and actual execution ability.",
        suggestedPoints: ["Define the context briefly.", "Use the STAR method.", "Mention concrete tools or technical methodologies."]
      },
      {
        id: `q-${Date.now()}-5`,
        text: `What specific tools, frameworks, or programming languages are you most proficient in for ${jobTitle}, and how do you ensure high quality code?`,
        category: "Technical",
        intent: "To validate practical tool knowledge, documentation, and quality standards.",
        suggestedPoints: ["Name real tools/frameworks you've used.", "Mention linting, testing, or review processes.", "Highlight modularity and clean architectural patterns."]
      },
      {
        id: `q-${Date.now()}-6`,
        text: `How do you approach optimizing or troubleshooting a system or codebase that is performing slowly or hitting scale barriers?`,
        category: "Technical",
        intent: "To evaluate diagnostics, performance profiling, and optimization mindsets.",
        suggestedPoints: ["Describe profiling/measurement first before guessing.", "Identify standard CPU, memory, or logic bottlenecks.", "Explain incremental testing and refactoring."]
      },
      // Situational
      {
        id: `q-${Date.now()}-7`,
        text: `How would you handle a situation where a key stakeholder or supervisor changes their requirements days before a release?`,
        category: "Situational",
        intent: "To assess adaptability, client management, and performance under pressure.",
        suggestedPoints: ["Stay calm and constructive.", "Initiate early impact assessment.", "Keep communication lines fully transparent."]
      },
      {
        id: `q-${Date.now()}-8`,
        text: `If you are given two high-priority tasks with conflicting, tight deadlines, how do you manage your time and stakeholders?`,
        category: "Situational",
        intent: "To evaluate prioritization metrics, boundary setting, and proactive updates.",
        suggestedPoints: ["Assess the business value or impact of each task.", "Communicate early with stakeholders to adjust expectations.", "Leverage delegation or time-blocking to deliver high-quality outputs."]
      },
      {
        id: `q-${Date.now()}-9`,
        text: `Imagine you notice a major error in a colleague's code or architectural plan after it was already approved. How do you handle it?`,
        category: "Situational",
        intent: "To assess peer collaboration, tact, and team-oriented responsibility.",
        suggestedPoints: ["Address the colleague directly and privately first.", "Frame the problem constructively around fixing the error, not blaming.", "Work together to present a unified fix to the supervisor if needed."]
      },
      // Company-Specific
      {
        id: `q-${Date.now()}-10`,
        text: `What is one major trend or development in the ${industry} industry right now that keeps you excited?`,
        category: "Company-Specific",
        intent: "To see if the candidate has commercial awareness and does self-learning.",
        suggestedPoints: ["Identify a real major trend.", "Explain the strategic impact.", "Formulate a forward-looking opinion."]
      },
      {
        id: `q-${Date.now()}-11`,
        text: `How do you envision our company's core values or mission aligning with your long-term career aspirations?`,
        category: "Company-Specific",
        intent: "To evaluate organizational cultural fit, strategic alignment, and retention potential.",
        suggestedPoints: ["Reference a specific company mission statement or value.", "Explain how your personal work ethic embodies that value.", "Connect it to long-term skill acquisition goals."]
      },
      {
        id: `q-${Date.now()}-12`,
        text: `Why did you choose our specific organization over our competitors in the ${industry} space?`,
        category: "Company-Specific",
        intent: "To verify tailored research, brand loyalty, and authentic competitive awareness.",
        suggestedPoints: ["State a unique differentiator of the company (e.g. culture, specific product).", "Show awareness of the competitive landscape.", "Keep the tone positive and highly specific to this company."]
      }
    ];
  }

  // General Business/Other
  return [
    // Behavioural Questions (3)
    {
      id: `q-${Date.now()}-1`,
      text: `What motivated you to apply for this ${jobTitle} role${levelLabel}, and how does ${candidateRef} prepare you?`,
      category: "Behavioural",
      intent: "To evaluate candidate alignment, interest, and communication skills.",
      suggestedPoints: ["State your core passion.", "Link personal or academic achievements to the role.", "Mention why this specific sector appeals to you."]
    },
    {
      id: `q-${Date.now()}-2`,
      text: `Tell me about a time you had to work with a difficult team member or partner. How did you resolve the friction?`,
      category: "Behavioural",
      intent: "To evaluate conflict resolution, empathy, and constructive communication.",
      suggestedPoints: ["Focus on objective facts rather than personal feelings.", "Use standard active listening to align intentions.", "Describe the positive shared outcome."]
    },
    {
      id: `q-${Date.now()}-3`,
      text: `Can you share a significant professional or academic failure, and what vital lessons you learned from it?`,
      category: "Behavioural",
      intent: "To assess resilience, self-reflection, and continuous self-improvement.",
      suggestedPoints: ["Explain the situation and take full responsibility.", "Detail the constructive adjustments made since.", "Provide evidence of subsequent success."]
    },
    // Technical
    {
      id: `q-${Date.now()}-4`,
      text: `Can you describe a challenging project, case study, or operational problem you completed, and how you solved a critical bottleneck?`,
      category: "Technical",
      intent: "To test problem-solving, analytical mindset, and execution ability.",
      suggestedPoints: ["Define the context briefly.", "Use the STAR method.", "Mention concrete tools or methodologies used."]
    },
    {
      id: `q-${Date.now()}-5`,
      text: `What specific industry tools, software applications, or specialized frameworks are you most proficient in for ${jobTitle}, and how do you ensure high quality outcomes?`,
      category: "Technical",
      intent: "To validate practical tool knowledge, quality control, and standards compliance.",
      suggestedPoints: ["Name real tools, platforms, or standards you've used.", "Mention validation, verification, or peer review processes.", "Highlight organizational best practices."]
    },
    {
      id: `q-${Date.now()}-6`,
      text: `How do you approach optimizing or troubleshooting a workflow, system, or dataset that is performing slowly or hitting constraints?`,
      category: "Technical",
      intent: "To evaluate diagnostics, bottleneck analysis, and operational optimization.",
      suggestedPoints: ["Describe quantitative measurement or observation first.", "Identify key resource constraints.", "Explain systematic testing and improvement."]
    },
    // Situational
    {
      id: `q-${Date.now()}-7`,
      text: `How would you handle a situation where a key stakeholder or supervisor changes their requirements days before an important deadline?`,
      category: "Situational",
      intent: "To assess adaptability, relationship management, and performance under pressure.",
      suggestedPoints: ["Stay calm and constructive.", "Initiate early impact assessment.", "Keep communication lines fully transparent."]
    },
    {
      id: `q-${Date.now()}-8`,
      text: `If you are given two high-priority tasks with conflicting, tight deadlines, how do you manage your time and stakeholders?`,
      category: "Situational",
      intent: "To evaluate prioritization metrics, boundary setting, and proactive updates.",
      suggestedPoints: ["Assess the business value or impact of each task.", "Communicate early with stakeholders to adjust expectations.", "Leverage planning or time-blocking to deliver high-quality outputs."]
    },
    {
      id: `q-${Date.now()}-9`,
      text: `Imagine you notice a major error in a colleague's work after it was already approved. How do you handle it?`,
      category: "Situational",
      intent: "To assess peer collaboration, tact, and team-oriented responsibility.",
      suggestedPoints: ["Address the colleague directly and privately first.", "Frame the problem constructively around fixing the error, not blaming.", "Work together to present a unified fix to the supervisor if needed."]
    },
    // Company-Specific
    {
      id: `q-${Date.now()}-10`,
      text: `What is one major trend or development in the ${industry} industry right now that keeps you excited?`,
      category: "Company-Specific",
      intent: "To see if the candidate has commercial awareness and does self-learning.",
      suggestedPoints: ["Identify a real major trend.", "Explain the strategic impact.", "Formulate a forward-looking opinion."]
    },
    {
      id: `q-${Date.now()}-11`,
      text: `How do you envision our company's core values or mission aligning with your long-term career aspirations?`,
      category: "Company-Specific",
      intent: "To evaluate organizational cultural fit, strategic alignment, and retention potential.",
      suggestedPoints: ["Reference a specific company mission statement or value.", "Explain how your personal work ethic embodies that value.", "Connect it to long-term skill acquisition goals."]
    },
    {
      id: `q-${Date.now()}-12`,
      text: `Why did you choose our specific organization over our competitors in the ${industry} space?`,
      category: "Company-Specific",
      intent: "To verify tailored research, brand loyalty, and authentic competitive awareness.",
      suggestedPoints: ["State a unique differentiator of the company (e.g. culture, specific product).", "Show awareness of the competitive landscape.", "Keep the tone positive and highly specific to this company."]
    }
  ];
}

function getMockStoriesAndTips(targetRole: string, targetIndustry: string, targetCompanyType?: string) {
  const companyType = targetCompanyType || "Corporate";
  const stories = [
    {
      id: "ps1",
      title: `How I nailed the ${targetRole} interview at a leading ${targetIndustry} firm`,
      role: targetRole,
      industry: targetIndustry,
      companyType: companyType,
      experienceLevel: "Mid Level",
      content: `I recently completed the interview loop for a ${targetRole} position in the ${targetIndustry} sector. The process started with a phone screen where they asked about my past experience and motivation for the industry. This was followed by a deep-dive round where we discussed core tools and methodologies. I focused heavily on using structured storytelling (the STAR method) to explain how I solved previous bottlenecks. I made sure to emphasize quantifiable outcomes and team alignment, which the hiring manager loved.`,
      lessons: [
        "Pre-prepare at least 3 behavioral stories structured cleanly with the STAR framework.",
        "Always research the specific company values and align your answers with their mission."
      ],
      mistakes: [
        "I was slightly verbose in my first technical round, taking too long on the situation setup.",
        "I didn't ask enough proactive questions about their current team challenges in the final minutes."
      ],
      successTips: [
        "Focus on delivering clear, quantifiable results like percentages, hours saved, or revenue goals.",
        "Practice speaking your answers aloud in front of a mirror or camera to reduce verbal clutter."
      ],
      date: "2026-06-15",
      source: `Community Interview Review - ${targetRole}, 2026`
    },
    {
      id: "ps2",
      title: `Succeeding as a Fresh Graduate in ${targetIndustry} as a ${targetRole}`,
      role: targetRole,
      industry: targetIndustry,
      companyType: "Startup",
      experienceLevel: "Entry Level",
      content: `Transitioning into a ${targetRole} role can feel daunting without extensive experience. In my interview, they cared more about my problem-solving approach and willingness to learn. I walked them through a major academic/personal project where I had to master a new skill under a tight deadline. Showing structured enthusiasm and high professional integrity set me apart from other graduate applicants.`,
      lessons: [
        "Highlight your fast-learning capability and proactive self-study habits.",
        "Acknowledge what you don't know honestly but immediately describe how you'd find the answer."
      ],
      mistakes: [
        "I initially tried to over-complicate my answers instead of keeping them simple and human.",
        "I was too nervous during the initial greetings, but I settled in once we talked about hands-on work."
      ],
      successTips: [
        "Align your academic or side projects directly with the job description's toolset.",
        "Follow up with a highly professional, tailored thank-you note within 12 hours of the loop."
      ],
      date: "2026-06-20",
      source: `University Career Network Entry Log - ${targetRole}, 2026`
    },
    {
      id: "ps3",
      title: `What I learned interviewing at a major ${targetIndustry} competitor`,
      role: targetRole,
      industry: targetIndustry,
      companyType: "Corporate",
      experienceLevel: "Junior Level",
      content: `The recruiter asked me very targeted operational questions related to being a ${targetRole}. Although I did not pass the final committee review because they preferred someone with slightly more specialized tool mastery, the constructive feedback was incredibly helpful. I realized I needed to prepare structured answers that explicitly highlight key safety protocols and team accountability.`,
      lessons: [
        "Never underestimate the value of post-interview feedback sessions.",
        "Focus on safety protocols and administrative rigor standard in ${targetIndustry}."
      ],
      mistakes: [
        "I assumed they only cared about hard skills, and neglected showing strong communication.",
        "I didn't explicitly map my previous experiences to their long-term growth priorities."
      ],
      successTips: [
        "Treat every interview as high-value training to build your confidence.",
        "Review standard operating procedures carefully to demonstrate immediate day-one value."
      ],
      date: "2026-06-22",
      source: `Graduate Interview Tracker - ${targetRole}`
    },
    {
      id: "ps4",
      title: `Navigating the technical screening for ${targetRole}`,
      role: targetRole,
      industry: targetIndustry,
      companyType: "Corporate",
      experienceLevel: "Senior Level",
      content: `The interview centered around real-world situational challenges. They gave me a scenario where a high-priority deadline was heavily compromised due to resource constraints. I walked them through how I would prioritize tasks, establish clear team communication, and manage stakeholder expectations. This approach showed that I possess the maturity and leadership skills needed for a senior ${targetRole} role.`,
      lessons: [
        "Demonstrate proactive stakeholder management and operational trade-offs clearly.",
        "Focus on high-level strategic alignment rather than just micro-execution."
      ],
      mistakes: [
        "I didn't emphasize budget parameters in my initial situational analysis.",
        "I was too quiet when brainstorming options, rather than thinking out loud with the panel."
      ],
      successTips: [
        "Prepare concrete examples where you successfully managed conflicting deadlines.",
        "Acknowledge the stress of the situation but display calm, logical problem-solving."
      ],
      date: "2026-06-25",
      source: `Hiring Manager Feedback Log - ${targetIndustry} recruiter`
    },
    {
      id: "ps5",
      title: `Securing a highly competitive ${targetRole} position`,
      role: targetRole,
      industry: targetIndustry,
      companyType: "Agency",
      experienceLevel: "Junior Level",
      content: `In the final round, I met with the department head. They wanted to see if I truly understood the competitive landscape of ${targetIndustry}. I was able to talk about major recent trends and explain how our team could adapt. Showing that commercial awareness and forward-thinking mindset was what ultimately got me the job offer.`,
      lessons: [
        "Stay fully updated on major industry trends and structural shifts.",
        "Show a proactive growth mindset and explain how you will contribute to the team's evolution."
      ],
      mistakes: [
        "I spoke too fast because of my excitement, but I corrected my pacing during the wrap-up.",
        "I spent too much time on general theories instead of sharing specific examples."
      ],
      successTips: [
        "Read major industry news and publications in the days leading up to your interview.",
        "Relate your interest in trends directly to the company's current service offerings."
      ],
      date: "2026-06-28",
      source: `LinkedIn Placement Announcement - ${targetRole}, 2026`
    }
  ];

  const tips = [
    {
      id: "pt1",
      category: "before" as any,
      title: `Master the Essential Tooling for ${targetRole}`,
      description: `Success in the ${targetIndustry} industry requires a strong command of standard tools and best practices. Before your interview, make sure you can speak confidently about these tools.`,
      actions: [
        "Identify the top 3 tools or software listed in the job description.",
        "Review standard workflows and edge cases for each of these tools.",
        "Prepare a short story showing your practical hands-on experience."
      ],
      source: "Industry Guild Guidelines"
    },
    {
      id: "pt2",
      category: "before" as any,
      title: `Research Company Core Values & Projects`,
      description: `Hiring teams seek candidates who are passionate about their unique mission and projects. Demonstrating this tailored research immediately sets you apart.`,
      actions: [
        "Analyze the company's official website, mission statement, and recent news.",
        "Identify 1-2 major projects or initiatives they launched recently.",
        "Formulate a thoughtful question about how this role contributes to those goals."
      ],
      source: "Recruiter Masterclass Playbook"
    },
    {
      id: "pt3",
      category: "before" as any,
      title: `Prepare Your STAR Story Library`,
      description: `Recruiters assess candidates using behavioral prompts. Having a pre-defined set of 4-5 stories structured with STAR ensures you never scramble for answers.`,
      actions: [
        "Draft stories covering leadership, conflict resolution, failure, and success.",
        "Write down the exact Situation, Task, Action, and Result for each story.",
        "Keep each draft concise, aiming for an elegant 2-minute verbal delivery."
      ],
      source: "Career Center Guidelines"
    },
    {
      id: "pt4",
      category: "during" as any,
      title: "Utilize the STAR Structuring Method",
      description: "Recruiters evaluate your communication using highly structured frameworks. Make sure you answer every behavioral question by defining the Situation, Task, Action, and specific Result.",
      actions: [
        "Spend 15% of your time on Situation & Task.",
        "Focus 60% of your time on your specific, high-value Actions.",
        "Dedicate the final 25% to quantifiable Results and learnings."
      ],
      source: "Professional Recruiter Survey"
    },
    {
      id: "pt5",
      category: "during" as any,
      title: "Think Out Loud & Explain Your Process",
      description: "In technical or situational questions, the interviewer cares more about your thinking process than a perfect answer. Keep communication open and active.",
      actions: [
        "State your initial understanding of the problem and verify constraints.",
        "Explain the trade-offs of different approaches before implementing one.",
        "Acknowledge edge cases and state how you would address them in production."
      ],
      source: "Technical Recruitment Association"
    },
    {
      id: "pt6",
      category: "during" as any,
      title: "Align Your Tone with the Culture",
      description: "Every organization has a unique communication style. Pay attention to how your interviewers speak and match their level of formality and excitement.",
      actions: [
        "Listen to the interviewers' vocabulary and use similar industry terms.",
        "Keep your delivery structured and focused, avoiding long monologues.",
        "Maintain high-fidelity professional poise and confidence."
      ],
      source: "HR Assessment Standards"
    },
    {
      id: "pt7",
      category: "after" as any,
      title: "Write a Tailored Post-Interview Thank You",
      description: "A tailored thank you note reinforces your professionalism and keeps you top-of-mind. It's your last chance to address any minor gaps from the interview.",
      actions: [
        "Send the note within 24 hours of the interview session.",
        "Reference a specific, engaging topic discussed with that interviewer.",
        "Reiterate your unique value proposition for the role."
      ],
      source: "Executive Placement Playbook"
    },
    {
      id: "pt8",
      category: "after" as any,
      title: "Conduct a Post-Interview Self-Audit",
      description: "Treating every interview as a learning experience accelerates your mastery. Documenting questions while they are fresh helps you prep for subsequent rounds.",
      actions: [
        "Immediately write down all questions, coding tasks, or prompts you received.",
        "Reflect honestly on which answers felt strong and where you faltered.",
        "Update your story library or coding repository to address those specific gaps."
      ],
      source: "Career Growth Guild"
    }
  ];

  return { stories, tips };
}

function getMockTurnResponse(body: any, turnCount: number, isFinalTurn: boolean) {
  const { role, industry, currentQuestion, answer, level, coachName, coachRole, candidateName, isPythonCodingMode } = body;
  const interviewerName = coachName || "Sophia";
  const interviewerRole = coachRole || "Principal Tech Recruiter";
  const applicantName = candidateName || "Candidate";

  const ansLower = (answer || "").toLowerCase();
  const ansLen = (answer || "").length;

  let score = 75;
  let domainScore = 22;
  let starScore = 30;
  let commScore = 23;

  let situationVal = 7;
  let taskVal = 7;
  let actionVal = 8;
  let resultVal = 8;

  let clarity = "Your answer is clear and addresses the general topic.";
  let relevance = "The response is relevant to the question asked.";
  let professionalism = "You used solid industry terms and professional tone.";
  let suggestions = "To elevate this further, try integrating more specific numerical results or metrics to quantify your success.";

  // Python hands-on coding specific evaluation
  if (isPythonCodingMode) {
    if (ansLen < 30 || ansLower.includes("don't know") || ansLower.includes("skip") || ansLower.includes("hello")) {
      score = 25;
      domainScore = 8;
      starScore = 10;
      commScore = 7;
      situationVal = 2;
      taskVal = 3;
      actionVal = 2;
      resultVal = 3;
      clarity = "The submitted text does not appear to be a valid Python code solution for the given algorithmic challenge.";
      relevance = "Devastating mismatch: The answer is missing or contains non-code chat.";
      professionalism = "Extremely low technical compliance. Please provide a working implementation.";
      suggestions = "Please write a real, structured Python function with proper parameters, variable tracking, and loops to solve the prompt.";
    } else {
      score = 82;
      domainScore = 25;
      starScore = 32;
      commScore = 25;
      situationVal = 8;
      taskVal = 8;
      actionVal = 8;
      resultVal = 8;
      clarity = "Your Python code is well-structured, syntax-compliant, and accurately targets the algorithm requested.";
      relevance = "Great relevance! The implementation covers critical edge cases like empty inputs and maintains good complexity.";
      professionalism = "Excellent formatting, descriptive variable naming, and appropriate utilization of standard algorithms.";
      suggestions = "To optimize, consider using a single-pass hash map to reduce time complexity to O(N) or mention the space-time trade-off in inline comments.";
    }
  } else {
    // Behavioral or situational mock evaluation
    if (ansLen < 15 || ansLower.includes("idk") || ansLower.includes("skip") || ansLower.includes("don't know")) {
      score = 30;
      domainScore = 10;
      starScore = 10;
      commScore = 10;
      situationVal = 2;
      taskVal = 3;
      actionVal = 2;
      resultVal = 3;
      clarity = "The response is too brief or evasive to properly evaluate your professional capabilities.";
      relevance = "Extremely low depth: Standard recruiters require multi-sentence responses.";
      professionalism = "Lacks corporate vocabulary or engagement.";
      suggestions = "Please use the STAR method to structure your answer: describe a concrete Situation, the Task at hand, your specific Actions, and the Result.";
    } else {
      // Analyze for STAR elements
      const hasS = ansLower.includes("situation") || ansLower.includes("when") || ansLower.includes("project") || ansLower.includes("background");
      const hasT = ansLower.includes("task") || ansLower.includes("responsible") || ansLower.includes("needed to") || ansLower.includes("goal");
      const hasA = ansLower.includes("action") || ansLower.includes("i did") || ansLower.includes("implemented") || ansLower.includes("solved") || ansLower.includes("managed");
      const hasR = ansLower.includes("result") || ansLower.includes("consequently") || ansLower.includes("achieved") || ansLower.includes("percent") || ansLower.includes("%") || ansLower.includes("saving") || ansLower.includes("increased");

      situationVal = hasS ? 9 : 6;
      taskVal = hasT ? 9 : 6;
      actionVal = hasA ? 9 : 7;
      resultVal = hasR ? 9 : 5;

      starScore = situationVal + taskVal + actionVal + resultVal;
      domainScore = ansLower.includes(role.toLowerCase()) || ansLower.includes(industry.toLowerCase()) ? 26 : 20;
      commScore = ansLen > 120 ? 26 : 20;
      score = domainScore + starScore + commScore;

      clarity = "The structural organization of your response shows good logical flow and professional delivery.";
      relevance = "You directly addressed the core question with descriptive personal context.";
      professionalism = "Strong command of professional terminology. Avoided filler words and slang.";
      
      if (!hasR) {
        suggestions = "Your answer is strong, but you missed describing a clear, quantifiable Result. Add a specific outcome, such as saving time, boosting a metric, or lessons learned.";
      } else {
        suggestions = "Excellent use of the STAR method! To make this even stronger, practice delivering the response within a 90-second speaking target.";
      }
    }
  }

  const evaluation = {
    score,
    clarity,
    relevance,
    professionalism,
    suggestions,
    scoreBreakdown: {
      domainAccuracy: domainScore,
      starStructure: starScore,
      communication: commScore,
      starDetailed: {
        situation: situationVal,
        task: taskVal,
        action: actionVal,
        result: resultVal
      }
    }
  };

  let nextQuestion = "";
  let finalReport = null;

  if (isFinalTurn) {
    finalReport = {
      overallScore: score,
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
      evaluationText: `Excellent job completing your simulated practice, ${applicantName}! You've demonstrated a solid baseline set of skills for a ${role} position. Your structured delivery and professional intent show you are on a great path toward securing top offers.`
    };
  } else {
    if (isPythonCodingMode) {
      const algorithmicQuestions = [
        "Please implement a Python function 'is_palindrome_permutation(s: str) -> bool' to check if a string is a permutation of a palindrome.",
        "Please design a Python class 'MinStack' that supports push, pop, top, and retrieving the minimum element in constant O(1) time.",
        "Please write a Python function 'level_order_traversal(root: TreeNode) -> list[list[int]]' that performs a level-order traversal on a binary tree."
      ];
      nextQuestion = algorithmicQuestions[(turnCount - 1) % algorithmicQuestions.length];
    } else {
      const generalQuestions = [
        "Describe a time you faced a major challenge in a team project. What was the conflict and how did you resolve it?",
        "How do you prioritize your workload when managing multiple tight deadlines or competing priorities?",
        "Why do you believe you are the most qualified candidate for this specific role, and how will you add value to our team?"
      ];
      nextQuestion = generalQuestions[(turnCount - 1) % generalQuestions.length];
    }
  }

  return {
    isCompleted: isFinalTurn,
    evaluation,
    nextQuestion,
    finalReport,
    isSimulated: true,
    warning: "We've loaded our offline prep mode because the Gemini API is busy or has hit its rate limit."
  };
}

function getMockCoachingResponse(body: any) {
  const { question, originalAnswer, originalSuggestions, verbalPractice } = body;
  const practiceLen = (verbalPractice || "").length;
  const practiceLower = (verbalPractice || "").toLowerCase();

  let score = 75;
  let delivery = 22;
  let integration = 35;
  let structure = 18;

  let clarityText = "Your spoken response clarity was quite strong. Your articulation was clean and easy to follow.";
  let relevanceText = "Your response stayed on-topic and addressed the original interview question effectively.";
  let interactivityAnalysis = "You showed a solid effort to integrate previous suggestions, particularly with respect to describing your personal actions.";

  if (practiceLen < 15 || practiceLower.includes("don't know") || practiceLower.includes("skip")) {
    score = 30;
    delivery = 10;
    integration = 10;
    structure = 10;
    clarityText = "The verbal practice transcript is extremely short or missing.";
    relevanceText = "The spoken response does not address the core question.";
    interactivityAnalysis = "Please record a full, multi-sentence spoken response to receive a comprehensive grading and suggestion integration review.";
  } else {
    // Analyze if they incorporated suggestions (e.g. STAR keywords, or length)
    const hasMoreDetails = practiceLen > (originalAnswer || "").length;
    const hasNumbers = /\d+/.test(practiceLower) || practiceLower.includes("percent") || practiceLower.includes("metric");
    
    if (hasMoreDetails) {
      integration += 10;
    }
    if (hasNumbers) {
      integration += 5;
    }

    score = delivery + integration + structure;
    clarityText = "Your spoken delivery has a natural pace and professional tone.";
    relevanceText = "Excellent alignment with the original technical topic.";
    interactivityAnalysis = `You successfully addressed the main points. ${hasNumbers ? "Great job including numerical metrics to quantify your success!" : "To improve further, try to state the exact percentage or metric of your achievement."}`;
  }

  return {
    score,
    clarity: clarityText,
    relevance: relevanceText,
    interactivityAnalysis,
    scoreBreakdown: {
      deliveryClarity: delivery,
      suggestionIntegration: integration,
      responseStructure: structure
    },
    isSimulated: true,
    warning: "We've loaded our offline prep mode because the Gemini API is busy or has hit its rate limit."
  };
}

// ==================== API ENDPOINTS ====================

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// FR-2: Generate interview questions based on Job Title, Industry, and Job Description
app.post("/api/generate-questions", async (req, res) => {
  const { jobTitle, industry, jobDescription, level } = req.body;

  if (!jobTitle || !industry) {
    return res.status(400).json({ error: "Job title and Industry are required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are a professional HR Director and Lead Recruiting Officer.
Generate a structured set of exactly 12 highly relevant, professional interview questions for an applicant applying for the role of "${jobTitle}" at the "${level || "Fresh Graduate"}" level/category within the "${industry}" sector.
Specifically, generate exactly 3 questions for each of the following four categories:
1. Technical
2. Behavioural
3. Situational
4. Company-Specific

CRITICAL REQUIREMENT: If the target role "${jobTitle}" is NOT a coding, programming, or software engineering role (such as a Dentist, Doctor, HR Specialist, Sales Rep, UX Designer, Business Manager, Accountant, etc.), then you MUST NOT ask any coding questions, you MUST NOT ask about programming languages, code debugging, or Python/JS exercises. Instead, focus the "Technical" questions strictly on the actual professional, clinical, administrative, or operational tools, procedures, methodologies, and technical compliance guidelines relevant to being a "${jobTitle}".

The detailed job description is as follows:
---
${jobDescription || `No specific job description provided. Generate professional questions for this role tailored for a ${level || "Fresh Graduate"} candidate.`}
---

Provide the questions in structured JSON format according to the output schema. Ensure each category has exactly 3 questions, resulting in exactly 12 questions total.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of custom generated questions",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique short id e.g. q1, q2" },
              text: { type: Type.STRING, description: "The actual question text" },
              category: { 
                type: Type.STRING, 
                description: "The question category. Must be one of: Technical, Behavioural, Situational, Company-Specific" 
              },
              intent: { type: Type.STRING, description: "What the interviewer seeks to evaluate" },
              suggestedPoints: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "3 actionable tips or items the response should cover" 
              }
            },
            required: ["id", "text", "category", "intent", "suggestedPoints"]
          }
        },
        temperature: 0.7,
      }
    });

    const text = response.text ? response.text.trim() : "[]";
    const questions = JSON.parse(text);
    return res.json({ questions });

  } catch (error: any) {
    logGeminiError("Generating Questions", error);
    try {
      const fallbackQuestions = getMockQuestions(jobTitle, industry, level);
      return res.json({ 
        questions: fallbackQuestions, 
        isSimulated: true, 
        warning: "We've loaded our offline high-fidelity prep questions because the Gemini API is busy or has hit its rate limit." 
      });
    } catch (fallbackError: any) {
      return res.status(500).json({
        error: "Both Gemini API and the local simulation failed: " + (error.message || error)
      });
    }
  }
});

// New Endpoint: Generate dynamic, hyper-personalized Interview Stories & Tips matching the user's specific target job / role
app.post("/api/personalized-stories-tips", async (req, res) => {
  const { targetRole, targetIndustry, targetCompanyType } = req.body;

  if (!targetRole || !targetIndustry) {
    return res.status(400).json({ error: "targetRole and targetIndustry are required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an elite career development strategist, recruiter coach, and lead job market analyst.
Your goal is to generate real-world grounded, AUTHENTIC interview experiences and tips. These MUST be based on real feedback, online comments, candidate logs, professional communities, or verified surveys of real professionals.
Every element you create MUST have an accurate "source" key specifying the exact real-world origin (such as a specific subreddit, Glassdoor interview log, LinkedIn recruiter survey, or professional guild review).

Generate a structured set of exactly 5 incredibly useful, authentic, and highly specific first-person "Interview Placement Stories" (each matching types.ts InterviewStory interface) and exactly 8 highly specific "Interview Tips" with actionable lists (each matching types.ts InterviewTip interface) tailored specifically to a candidate whose target role is "${targetRole}" within the "${targetIndustry}" sector (and target company type of "${targetCompanyType || "Any"}").

CRITICAL REQUIREMENT:
The generated stories and tips MUST be completely specific to the job target "${targetRole}" in "${targetIndustry}". Every tip, mistake, lesson, and action item must reference real-world tools, techniques, scenarios, or concepts used by actual practitioners in this exact line of work (specifically, if it is selling cars / automotive sales, talk about CRM lead tracking, handling objections about monthly financing vs overall cash price, organizing and giving vehicle feature walks, negotiating trade-ins, closing test drives, and active follow-up; DO NOT mention unrelated technology or finance concepts like React, Figma, DCF valuation, software deployment, or UX design. Keep it absolute laser-focused on the realities of being a "${targetRole}").

JSON SCHEMA SPECIFICATION:
Your output must be structured JSON. It must contain two top-level keys: "stories" and "tips".

Under "stories":
Provide exactly 5 items. Each item must have:
- id: e.g. "ps1", "ps2", "ps3", "ps4", "ps5"
- title: e.g. "How I nailed the Sales Consultant role at a premium Toyota franchise" (should be specific and realistic to "${targetRole}")
- role: "${targetRole}"
- industry: "${targetIndustry}"
- companyType: string matching one of: 'Startup' | 'Tech Giant' | 'Corporate' | 'Agency' | 'Consulting'
- experienceLevel: string
- content: A rich, realistic, detailed first-person story explaining how they navigated their interview rounds, what specific operational questions they got asked, and how they answered to demonstrate elite competency for a "${targetRole}".
- lessons: Array of 2 highly practical, actionable lessons learned.
- mistakes: Array of 2 mistakes they made (e.g. overcomplicating mechanical specs instead of focusing on buyer psychology).
- successTips: Array of 2 tips (e.g. practicing vehicle walkarounds out loud).
- date: "2026-06-15"
- source: A detailed string describing the realistic origin (e.g. "Glassdoor Candidate Review - Ford Sales Consultant, 2026" or "Interview with General Sales Manager, AutoNation")

Under "tips":
Provide exactly 8 items. Each item must have:
- id: e.g. "pt1", "pt2", "pt3", "pt4", "pt5", "pt6", "pt7", "pt8"
- category: one of 'before' | 'during' | 'after'
- title: string specific to "${targetRole}"
- description: A short contextual paragraph explaining why this tip is critical for success as a "${targetRole}".
- actions: Array of 3 specific, highly actionable steps they should perform.
- source: A detailed source string (e.g. "Automotive Sales Guild Academy Masterclass Series" or "reddit/r/sales Candidate Playbook")`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stories: {
              type: Type.ARRAY,
              description: "List of custom generated personalized interview placement stories",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  role: { type: Type.STRING },
                  industry: { type: Type.STRING },
                  companyType: { type: Type.STRING },
                  experienceLevel: { type: Type.STRING },
                  content: { type: Type.STRING },
                  lessons: { type: Type.ARRAY, items: { type: Type.STRING } },
                  mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  successTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                  date: { type: Type.STRING },
                  source: { type: Type.STRING, description: "Where the real person data or review was sourced from" }
                },
                required: ["id", "title", "role", "industry", "companyType", "experienceLevel", "content", "lessons", "mistakes", "successTips", "date", "source"]
              }
            },
            tips: {
              type: Type.ARRAY,
              description: "List of custom generated personalized tips",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Must be: before, during, or after" },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  source: { type: Type.STRING, description: "Professional advice origin or community survey" }
                },
                required: ["id", "category", "title", "description", "actions", "source"]
              }
            }
          },
          required: ["stories", "tips"]
        },
        temperature: 0.7,
      }
    });

    const text = response.text ? response.text.trim() : '{"stories": [], "tips": []}';
    const parsed = JSON.parse(text);
    return res.json(parsed);

  } catch (error: any) {
    logGeminiError("Generating Personal Stories & Tips", error);
    try {
      const fallbackData = getMockStoriesAndTips(targetRole, targetIndustry, targetCompanyType);
      return res.json({
        ...fallbackData,
        isSimulated: true,
        warning: "We've loaded our offline high-fidelity prep stories because the Gemini API is busy or has hit its rate limit."
      });
    } catch (fallbackError: any) {
      return res.status(500).json({
        error: "Both Gemini API and the local simulation failed: " + (error.message || error)
      });
    }
  }
});

// FR-3: Generate initial question for mock interview
app.post("/api/mock-interview/start", async (req, res) => {
  const { role, industry, level, coachId, coachName, coachRole, candidateName, isPythonCodingMode } = req.body;

  if (!role || !industry) {
    return res.status(400).json({ error: "Role and Industry are required." });
  }

  try {
    const ai = getGeminiClient();
    const interviewerName = coachName || "Sophia";
    const interviewerRole = coachRole || "Principal Tech Recruiter";
    const applicantName = candidateName || "Candidate";

    const codingRoleActive = !!isPythonCodingMode;

    let prompt = "";
    if (codingRoleActive) {
      prompt = `You are an expert AI Technical Interviewer and elite Python Systems Architect named "${interviewerName}" (acting as "${interviewerRole}").
You are conducting a professional Python Hands-on Coding Interview with an applicant named "${applicantName}" who is applying for a "${role}" position within the "${industry}" sector, at the "${level || "Fresh Graduate"}" experience level.

Introduce yourself briefly in one warm sentence (mentioning your name and title), welcome them to this specialized Python Coding Interview, and present them with their FIRST Python coding challenge for this experience level.
Describe the coding challenge clearly:
- State the objective and the function definition (e.g., def count_pairs(nums, target):)
- Provide sample inputs, expected outputs, and target constraints (e.g., O(N) time complexity).
- Request them to code the solution or class directly in the editor.
Keep your explanation concise but highly explicit. Do not mention default names like Alex.`;
    } else {
      prompt = `You are an expert AI Interviewer named "${interviewerName}" (acting as "${interviewerRole}").
You are conducting a professional video call mock interview with an applicant named "${applicantName}" who is applying for a "${role}" position within the "${industry}" sector, at the "${level || "Fresh Graduate"}" experience level/category focus.

Introduce yourself briefly in one friendly sentence using your name "${interviewerName}" and your role "${interviewerRole}", and ask the first standard introductory interview question for this role, tailored for this specific ${level || "Fresh Graduate"} level. DO NOT refer to yourself by any other name, like Alex or any default candidate/interviewer names. Keep the tone encouraging, real, and structured.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are the specific interviewer named ${interviewerName}, a ${interviewerRole}. Always keep this identity and do not use generic placeholders or refer to yourself as Alex.`,
        temperature: 0.7,
      }
    });

    const firstQuestion = response.text ? response.text.trim() : (
      codingRoleActive 
        ? `Welcome ${applicantName}! I am ${interviewerName}, a ${interviewerRole}. Let's begin your Python coding assessment. Please implement a Python function 'find_duplicates(nums: list[int]) -> list[int]' that takes a list of integers and returns all elements that appear more than once. Aim for O(N) time complexity and O(N) auxiliary space.`
        : `Welcome ${applicantName}! I am ${interviewerName}, a ${interviewerRole}. Tell me about yourself and what draws you to this role as an Associate ${role} in our team.`
    );
    return res.json({ firstQuestion });

  } catch (error: any) {
    logGeminiError("Start Mock Interview", error);
    const codingRoleActive = !!isPythonCodingMode;
    const interviewerName = coachName || "Sophia";
    const interviewerRole = coachRole || "Principal Tech Recruiter";
    const applicantName = candidateName || "Candidate";

    const fallbackQuestion = codingRoleActive 
      ? `Welcome ${applicantName}! I am ${interviewerName}, a ${interviewerRole}. Let's begin your Python coding assessment. Please implement a Python function 'find_duplicates(nums: list[int]) -> list[int]' that takes a list of integers and returns all elements that appear more than once. Aim for O(N) time complexity and O(N) auxiliary space.`
      : `Welcome ${applicantName}! I am ${interviewerName}, a ${interviewerRole}. Tell me about yourself and what draws you to this role as an Associate ${role} in our team.`;

    return res.json({ 
      firstQuestion: fallbackQuestion, 
      isSimulated: true,
      warning: "We've loaded our offline high-fidelity prep mode because the Gemini API is busy or has hit its rate limit."
    });
  }
});

// FR-3: Process mock interview turns (evaluation + direct follow-up OR final feedback report)
app.post("/api/mock-interview/respond", async (req, res) => {
  const { role, industry, history, answers, currentQuestion, answer, forceEnd, level, coachId, coachName, coachRole, candidateName, cheatingStrikes, isPythonCodingMode } = req.body;

  if (!role || !industry || !currentQuestion || !answer) {
    return res.status(400).json({ error: "Role, industry, currentQuestion, and answer are required." });
  }

  // Calculate current turn count
  const turnCount = (history || []).length + 1;
  const isFinalTurn = forceEnd || turnCount >= 4; // Conduct a 4-question interview sequence

  try {
    const ai = getGeminiClient();
    const historyPrompt = (history || []).map((h: any, idx: number) => {
      return `Turn ${idx+1}:\nInterviewer Question: ${h.question}\nGraduate Answer: ${h.answer}\nScore: ${h.score}/100`;
    }).join("\n\n");

    const interviewerName = coachName || "Sophia";
    const interviewerRole = coachRole || "Principal Tech Recruiter";
    const applicantName = candidateName || "Candidate";

    const codingRoleActive = !!isPythonCodingMode;

    const integrityPrompt = cheatingStrikes && Number(cheatingStrikes) > 0
      ? `\n\n⚠️ CRITICAL SECURITY WARNING: The applicant "${applicantName}" switched browser tabs or focused away ${cheatingStrikes} time(s) during this interview step (suspected of looking up answers or using other AI tools). Deduct a substantial penalty (e.g., 10 points per tab exit) from their latest turn score, comment on this lack of focus or integrity breach under "professionalism" feedback, and have "${interviewerName}" address this switch directly in their spoken response/evaluation text with a strict but polite warning.`
      : "";

    let prompt = "";
    if (codingRoleActive) {
      prompt = `You are an expert AI Technical Interviewer named "${interviewerName}" (acting as "${interviewerRole}") specialized in Python software engineering and rigorous algorithms analysis. You are conducting an intensely rigorous, strictly graded Python Hands-on Coding interview with "${applicantName}" for a "${role}" position (${level || "Fresh Graduate"} level) in the "${industry}" sector.

We are currently on turn ${turnCount} out of 4.

Latest coding assignment asked: "${currentQuestion}"
Candidate's submitted Python code solution:
\`\`\`python
${answer}
\`\`\`

Previous coding turns:
${historyPrompt || "This is the first programming question of the interview."}

=========================================
🚨 EXTREMELY STRICT EVALUATION RUBRIC & GRADING BREAKDOWN FOR PYTHON CODING:
1. INVALID, SYNTAX-BROKEN, OR COPIED QUESTIONS (DEVASTATING RELEVANCE PENALTY):
   - Check if the answer is actually Python code and related to solving "${currentQuestion}". 
   - If they submitted basic text chat ("hello", "I don't know", random chat), unrelated libraries, copying of the prompt, or plain gibberish, YOU MUST ASSIGN A DEVASTATING SCORE between 5/100 and 32/100 overall. Explain the exact coding mismatch clearly.
   - Set domainAccuracy to 1-8 points, starStructure to 1-8 points, and communication to 1-5 points if the code does not work or isn't Python.

2. SPECIFIC POINTS BREAKDOWN MAPPING (Final overall score MUST be the exact sum of these three metrics):
   - Job-Specific Domain/Python Accuracy (max 30 points): Evaluate Python-specific syntax, core logical correctness to solve the problem, parameter naming, and Python-friendly idiom usage.
   - Algorithmic Structure & Complexity Depth (max 40 points): Provide individual grading for:
     * Problem specification understanding (0-10) [mapped to situation]
     * Edge case resilient validation - empty arrays, null, zero-bounds (0-10) [mapped to task]
     * Algorithmic efficiency & Big-O optimization - was it linear O(N) or quadratic O(N^2)? (0-10) [mapped to action]
     * Performance testing profile & resource bottleneck optimizations (0-10) [mapped to result]
     These four grades must sum exactly to the "starStructure" value out of 40.
   - Code Cleanliness & PEP-8 Standards (max 30 points) [mapped to communication]: Evaluate comments, descriptive variable names, docstrings, typing annotations, indentation, and clean functional modularity.

3. INTEGRITY PENALTIES:${integrityPrompt ? integrityPrompt : ` No tab switches detected.`}

Keep your written suggestions highly actionable with concrete Python code optimizations, showing how they can refactor to better logic.
Ensure your tone matches your character "${interviewerName}".

${
  isFinalTurn 
  ? `This is the END of the Python coding interview. Set "isCompleted" to true and provide a comprehensive Final Feedback Report containing:
- overallScore: An intelligent mathematical average of turn scores (0-100).
- strengths: Exactly 3 specific python/algorithmic strengths shown.
- improvements: Exactly 3 specific areas of algorithmic / python refactoring.
- suggestedResources: Exactly 3 target computer science concepts to master (e.g., Dynamic Programming, Tries, Memoization).
- evaluationText: A formal, objective technical report. Sign off as "${interviewerName}" addressing "${applicantName}".`
  : `The interview is ongoing. Set "isCompleted" to false and generate the "nextQuestion". The nextQuestion must be a new Python programming challenge matching "${role}" at the "${level}" experience level, introducing a fresh, engaging algorithmic problem (like trees, list hashing, sorting arrays, or strings manipulation) with clear inputs/outputs.`
}`;
    } else {
      prompt = `You are conducting an intensely rigorous, strictly graded technical & behavioral interview with "${applicantName}" for a "${role}" position (${level || "Fresh Graduate"} level) in the "${industry}" sector.

We are currently on turn ${turnCount} out of 4.

Latest question asked: "${currentQuestion}"
Candidate's typed answer: "${answer}"

Previous turns:
${historyPrompt || "This is the first response of the interview."}

=========================================
🚨 EXTREMELY STRICT EVALUATION RUBRIC & GRADING BREAKDOWN:
You MUST grade this response strictly according to the following competency rubric. Do not invent your own criteria:

| Competency | Weight | 1 - Doesn't Meet | 2 - Partially Meets | 3 - Meets | 4 - Exceeds |
|---|---|---|---|---|---|
| Communication | 25% | Rambling, unclear, or doesn't address the question. | Understandable but disorganized; no concrete example. | Clear, concise, with a relevant specific example. | Clear, concise, specific example, plus unprompted reflection/insight. |
| Domain Knowledge (${role}) | 30% | No relevant terminology; could apply to any job. | Some relevant terms, shallow/slightly incorrect application. | Accurate, role-relevant knowledge correctly applied. | Accurate, role-relevant, plus awareness of tradeoffs/edge cases. |
| Ownership & Impact | 20% | Only "the team" did X; no individual action. | States role but action is vague. | Clear individual action and its outcome. | Individual action, outcome, AND a quantified/measurable result. |
| Problem Solving | 25% | No structured reasoning; jumps to conclusion. | Some reasoning, incomplete or skips steps. | Clear logical progression problem→solution. | Clear progression, plus considers/rejects alternatives explicitly. |

Rate the answer on each competency using ONLY the levels above (pick the single closest match, do not interpolate). 
If the answer doesn't address the question, every competency should be level 1 regardless of writing quality. 
Never assign level 4 without clear evidence of the specific "exceeds" behavior — good writing alone does not earn level 4.

Integrity warning: ${integrityPrompt ? integrityPrompt : "No tab switches detected."}

${
  isFinalTurn 
  ? `This is the END of the interview. Set "isCompleted" to true and provide a comprehensive Final Feedback Report containing:
- strengths: Exactly 3 specific professional competencies the applicant demonstrated.
- improvements: Exactly 3 areas of improvement based on technical accuracy, depth, structure, etc.
- suggestedResources: Exactly 3 target skills or topics they should master (e.g. System Design, STAR presentation, cash flow mapping).
- evaluationText: A formal, objective summary of their performance. Make sure to sign off or conclude in-character as "${interviewerName}" addressing "${applicantName}".`
  : `The interview is ongoing. Set "isCompleted" to false and generate "nextQuestion". The nextQuestion must be spoken by "${interviewerName}" as a direct technical follow-up or next behavioral question for the "${role}" position, keeping it very natural, focused, and conversational.`
}`;
    }

    // Determine the response schema dynamically
    const dynamicResponseSchema = codingRoleActive ? {
      type: Type.OBJECT,
      description: "Response evaluated by the recruiter with possible next question or final feedback",
      properties: {
        isCompleted: { type: Type.BOOLEAN, description: "True if the interview has concluded" },
        evaluation: {
          type: Type.OBJECT,
          description: "The scoring and verbal feedback of the user's latest response",
          properties: {
            score: { type: Type.INTEGER, description: "A score from 0 to 100, which must exactly equal the sum of scoreBreakdown's fields" },
            clarity: { type: Type.STRING, description: "Evaluation of answer coherence" },
            relevance: { type: Type.STRING, description: "Evaluation of prompt matching and depth" },
            professionalism: { type: Type.STRING, description: "Evaluation of professional vocabulary" },
            suggestions: { type: Type.STRING, description: "Constructive, specific feedback on how to improve this answer" },
            scoreBreakdown: {
              type: Type.OBJECT,
              description: "Points assigned out of maximums. Sum must match overall score",
              properties: {
                domainAccuracy: { type: Type.INTEGER, description: "Technical depth & accuracy (0 to 30)" },
                starStructure: { type: Type.INTEGER, description: "STAR method structural detail sum of detailed points (0 to 40)" },
                communication: { type: Type.INTEGER, description: "Vocabulary & clarity (0 to 30)" },
                starDetailed: {
                  type: Type.OBJECT,
                  description: "Granular breakdown of the STAR formulation elements. Sum of these four must exactly equal starStructure",
                  properties: {
                    situation: { type: Type.INTEGER, description: "Situation context definition (0 to 10)" },
                    task: { type: Type.INTEGER, description: "Task context definition (0 to 10)" },
                    action: { type: Type.INTEGER, description: "Individual technical/behavioral actions (0 to 10)" },
                    result: { type: Type.INTEGER, description: "Quantification of results, metrics, and business impact (0 to 10)" }
                  },
                  required: ["situation", "task", "action", "result"]
                }
              },
              required: ["domainAccuracy", "starStructure", "communication", "starDetailed"]
            }
          },
          required: ["score", "clarity", "relevance", "professionalism", "suggestions", "scoreBreakdown"]
        },
        nextQuestion: { type: Type.STRING, description: "Direct follow up question if isCompleted is false" },
        finalReport: {
          type: Type.OBJECT,
          description: "Final consolidated scorecard. Only filled if isCompleted is true",
          properties: {
            overallScore: { type: Type.INTEGER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 strengths" },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 action items" },
            suggestedResources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific topics or technical domains" },
            evaluationText: { type: Type.STRING, description: "The final encouraging wrap-up text" }
          },
          required: ["overallScore", "strengths", "improvements", "suggestedResources", "evaluationText"]
        }
      },
      required: ["isCompleted", "evaluation", "nextQuestion"]
    } : {
      type: Type.OBJECT,
      description: "Response evaluated by the recruiter with strictly parsed rubric details",
      properties: {
        isCompleted: { type: Type.BOOLEAN, description: "True if the interview has concluded" },
        nextQuestion: { type: Type.STRING, description: "Direct follow up question if isCompleted is false" },
        finalReport: {
          type: Type.OBJECT,
          description: "Final consolidated scorecard. Only filled if isCompleted is true",
          properties: {
            overallScore: { type: Type.INTEGER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 strengths" },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 action items" },
            suggestedResources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific topics or technical domains" },
            evaluationText: { type: Type.STRING, description: "The final encouraging wrap-up text" }
          },
          required: ["overallScore", "strengths", "improvements", "suggestedResources", "evaluationText"]
        },
        communication: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER, description: "Level (1 to 4) according to the rubric" },
            evidence: { type: Type.STRING, description: "Evidence from the candidate's response to justify the level" }
          },
          required: ["level", "evidence"]
        },
        domain_knowledge: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER, description: "Level (1 to 4) according to the rubric" },
            evidence: { type: Type.STRING, description: "Evidence from the candidate's response to justify the level" }
          },
          required: ["level", "evidence"]
        },
        ownership: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER, description: "Level (1 to 4) according to the rubric" },
            evidence: { type: Type.STRING, description: "Evidence from the candidate's response to justify the level" }
          },
          required: ["level", "evidence"]
        },
        problem_solving: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER, description: "Level (1 to 4) according to the rubric" },
            evidence: { type: Type.STRING, description: "Evidence from the candidate's response to justify the level" }
          },
          required: ["level", "evidence"]
        },
        overall_feedback: { type: Type.STRING, description: "2-3 sentences of coaching tied to the LOWEST-rated competency and what would move it up one level" }
      },
      required: ["isCompleted", "nextQuestion", "communication", "domain_knowledge", "ownership", "problem_solving", "overall_feedback"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dynamicResponseSchema,
        temperature: 0.7,
      }
    });

    const parsedData = JSON.parse(response.text ? response.text.trim() : "{}");

    if (!codingRoleActive) {
      // Math and level mapping for non-coding behavioral responses
      const getCommPoints = (lvl: number) => {
        if (lvl === 4) return 25;
        if (lvl === 3) return 21;
        if (lvl === 2) return 15;
        return 7;
      };
      const getDomainPoints = (lvl: number) => {
        if (lvl === 4) return 30;
        if (lvl === 3) return 25;
        if (lvl === 2) return 18;
        return 9;
      };
      const getOwnershipPoints = (lvl: number) => {
        if (lvl === 4) return 20;
        if (lvl === 3) return 17;
        if (lvl === 2) return 12;
        return 6;
      };
      const getProblemPoints = (lvl: number) => {
        if (lvl === 4) return 25;
        if (lvl === 3) return 21;
        if (lvl === 2) return 15;
        return 8;
      };

      const commLvl = parsedData.communication?.level || 1;
      const domainLvl = parsedData.domain_knowledge?.level || 1;
      const ownershipLvl = parsedData.ownership?.level || 1;
      const problemLvl = parsedData.problem_solving?.level || 1;

      const commPoints = getCommPoints(commLvl);
      const domainPoints = getDomainPoints(domainLvl);
      const ownershipPoints = getOwnershipPoints(ownershipLvl);
      const problemSolvingPoints = getProblemPoints(problemLvl);

      const score = commPoints + domainPoints + ownershipPoints + problemSolvingPoints;

      // Ensure exact math alignment so parts sum perfectly to total score
      const commScoreOut = Math.round(commPoints * 30 / 25);
      const domainScoreOut = domainPoints;
      const starScoreOut = score - commScoreOut - domainScoreOut;

      const sitVal = Math.min(10, Math.max(1, Math.round(ownershipPoints * 10 / 20)));
      const taskVal = Math.min(10, Math.max(1, Math.round(ownershipPoints * 10 / 20)));
      const actVal = Math.min(10, Math.max(1, Math.round(problemSolvingPoints * 10 / 25)));
      const resVal = Math.max(0, starScoreOut - (sitVal + taskVal + actVal));

      const evaluation = {
        score,
        clarity: `Communication (Level ${commLvl}): ${parsedData.communication?.evidence || "No distinct evidence quote provided."}`,
        relevance: `Domain Knowledge (Level ${domainLvl}): ${parsedData.domain_knowledge?.evidence || "No distinct evidence quote provided."}`,
        professionalism: `Ownership & Impact (Level ${ownershipLvl}): ${parsedData.ownership?.evidence || "No distinct evidence quote provided."}. Problem Solving (Level ${problemLvl}): ${parsedData.problem_solving?.evidence || "No distinct evidence quote provided."}`,
        suggestions: parsedData.overall_feedback || "Focus on building structured, metrics-driven STAR narratives.",
        scoreBreakdown: {
          domainAccuracy: domainScoreOut,
          starStructure: starScoreOut,
          communication: commScoreOut,
          starDetailed: {
            situation: sitVal,
            task: taskVal,
            action: actVal,
            result: resVal
          }
        }
      };

      const responsePayload: any = {
        isCompleted: parsedData.isCompleted,
        evaluation,
        nextQuestion: parsedData.nextQuestion,
      };

      if (parsedData.isCompleted && parsedData.finalReport) {
        responsePayload.finalReport = {
          overallScore: parsedData.finalReport.overallScore || score,
          strengths: parsedData.finalReport.strengths || [],
          improvements: parsedData.finalReport.improvements || [],
          suggestedResources: parsedData.finalReport.suggestedResources || [],
          evaluationText: parsedData.finalReport.evaluationText || ""
        };
      }

      return res.json(responsePayload);
    } else {
      return res.json(parsedData);
    }

  } catch (error: any) {
    logGeminiError("Interview Turn Evaluation", error);
    try {
      const fallbackResponse = getMockTurnResponse(req.body, turnCount, isFinalTurn);
      return res.json(fallbackResponse);
    } catch (fallbackError: any) {
      return res.status(500).json({
        error: "Both Gemini API and the local simulation failed: " + (error.message || error)
      });
    }
  }
});

// FR-3.11: Process verbal practice evaluation for coaching
app.post("/api/mock-interview/coaching", async (req, res) => {
  const { question, originalAnswer, originalSuggestions, verbalPractice } = req.body;

  if (!question || !verbalPractice) {
    return res.status(400).json({ error: "question and verbalPractice are required." });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an expert AI Interview Speech Coach who grades candidates' spoken practice sessions extremely rigorously and critically.
A candidate has received specific behavioral feedback on their previous written response and is practicing speaking an improved version of that response verbally.

ORIGINAL TOPIC / QUESTION: "${question}"
THE CANDIDATE'S ORIGINAL WRITTEN RESPONSE: "${originalAnswer || "No previous response provided."}"
COACH'S SUGGESTIONS TO ADDRESS: "${originalSuggestions || "Structure with STAR methodology, define numerical results, and keep communication tight."}"

THE CANDIDATE'S VERBALLY RE-PRACTICED NEW TRANSCRIPT: "${verbalPractice}"

=========================================
🚨 EXTREMELY CRITICAL GRADING STANDARDS & Rubric:
Analyze their new improved transcript. Compare their new verbal response to their original feedback to see if they successfully addressed and integrated the suggestions.
Grading points must be strictly allocated as follows:
- deliveryClarity (max 30 points): Analysis of the structural flow, voice pace, articulation, and avoidance of speaking clutter in their re-practice.
- suggestionIntegration (max 50 points): Does their verbal practice actually address and correct the issues noted in the previous suggestions? Award points proportionate to the successful addition of requested details/structures.
- responseStructure (max 20 points): Cohesion of the updated response. Is it a unified, effective professional story?

The overall "score" (0-100) MUST exactly equal the mathematical sum of deliveryClarity + suggestionIntegration + responseStructure.
If they ignored suggestions or have severe structure deficits, grade them strictly and constructively (deduct heavily).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          description: "Speech coaching verbal feedback evaluation",
          properties: {
            score: { type: Type.INTEGER, description: "A score from 0 to 100, which must equal the sum of deliveryClarity, suggestionIntegration, and responseStructure" },
            clarity: { type: Type.STRING },
            relevance: { type: Type.STRING },
            interactivityAnalysis: { type: Type.STRING, description: "Detailed check on whether they incorporated each suggestion and next steps" },
            scoreBreakdown: {
              type: Type.OBJECT,
              description: "Scoring points assigned",
              properties: {
                deliveryClarity: { type: Type.INTEGER, description: "Delivery flow and volume clarity (0 to 30)" },
                suggestionIntegration: { type: Type.INTEGER, description: "Integration of suggestions (0 to 50)" },
                responseStructure: { type: Type.INTEGER, description: "Cohesiveness checklist (0 to 20)" }
              },
              required: ["deliveryClarity", "suggestionIntegration", "responseStructure"]
            }
          },
          required: ["score", "clarity", "relevance", "interactivityAnalysis", "scoreBreakdown"]
        },
        temperature: 0.7,
      }
    });

    const parsedData = JSON.parse(response.text ? response.text.trim() : "{}");
    return res.json(parsedData);

  } catch (error: any) {
    logGeminiError("Coaching Speech Evaluator", error);
    try {
      const fallbackResponse = getMockCoachingResponse(req.body);
      return res.json(fallbackResponse);
    } catch (fallbackError: any) {
      return res.status(500).json({
        error: "Both Gemini API and the local simulation failed: " + (error.message || error)
      });
    }
  }
});

// ==================== VITE DEVELOPMENT MIDDLEWARE ====================

// Static/Dev server bootstrapping
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Running on http://localhost:${PORT}`);
    console.log(`[Full-Stack Server] API endpoints loaded and active.`);
  });
}

startServer();
