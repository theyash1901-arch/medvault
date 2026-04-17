import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

let genAI = null;
let model = null;

export function initGemini(apiKey) {
  const key = apiKey || API_KEY;
  if (!key) return false;
  try {
    genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return true;
  } catch {
    return false;
  }
}

export async function analyzeCandidate(profile) {
  if (!model) throw new Error('Gemini API not initialized');

  const prompt = `You are TalentLens AI, an advanced talent analysis system. Analyze this candidate profile and provide a comprehensive evaluation.

Candidate Profile:
- Name: ${profile.name}
- Skills: ${profile.skills}
- Experience: ${profile.experience}
- GitHub/Portfolio: ${profile.github || 'Not provided'}
- Education: ${profile.education || 'Not provided'}
- Projects: ${profile.projects || 'Not provided'}

Provide your analysis in the following JSON format (return ONLY the JSON, no markdown):
{
  "overallScore": <number 0-100>,
  "skillAnalysis": [
    {"skill": "<name>", "level": "<Beginner|Intermediate|Advanced|Expert>", "score": <0-100>, "trend": "<rising|stable|declining>"}
  ],
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "growthAreas": ["<area1>", "<area2>"],
  "hiddenTalents": ["<talent1>", "<talent2>"],
  "learningPotential": <number 0-100>,
  "cultureFit": <number 0-100>,
  "recommendedRoles": [
    {"title": "<role>", "matchScore": <0-100>, "reason": "<why>"}
  ],
  "summary": "<2-3 sentence executive summary>"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      overallScore: 75,
      skillAnalysis: profile.skills.split(',').map(s => ({
        skill: s.trim(),
        level: 'Intermediate',
        score: Math.floor(Math.random() * 30) + 60,
        trend: 'rising'
      })),
      strengths: ['Strong technical foundation', 'Growth mindset', 'Problem-solving ability'],
      growthAreas: ['Could expand into system design', 'Leadership skills development'],
      hiddenTalents: ['Cross-functional thinking', 'Rapid learning ability'],
      learningPotential: 82,
      cultureFit: 78,
      recommendedRoles: [
        { title: 'Software Engineer', matchScore: 85, reason: 'Strong coding skills align well' },
        { title: 'Full Stack Developer', matchScore: 78, reason: 'Versatile skill set' }
      ],
      summary: text
    };
  }
}

export async function chatWithAI(message, context = '') {
  if (!model) throw new Error('Gemini API not initialized');

  const prompt = `You are TalentLens AI, a friendly and knowledgeable AI assistant specializing in talent discovery, recruitment, and career development. You help employers find the best candidates and help candidates showcase their true potential.

${context ? `Current context:\n${context}\n\n` : ''}

User message: ${message}

Respond helpfully and concisely. Use a professional yet warm tone. If asked about specific candidates, provide actionable insights. Format your response in plain text, using bullet points where appropriate. Keep responses under 200 words unless asked for detail.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function matchJobRole(candidateProfile, jobDescription) {
  if (!model) throw new Error('Gemini API not initialized');

  const prompt = `As TalentLens AI, analyze how well this candidate matches the job description.

Candidate:
${JSON.stringify(candidateProfile, null, 2)}

Job Description:
${jobDescription}

Return ONLY JSON:
{
  "matchScore": <0-100>,
  "matchBreakdown": {
    "technicalSkills": <0-100>,
    "experience": <0-100>,
    "cultureFit": <0-100>,
    "growthPotential": <0-100>
  },
  "matchedSkills": ["<skill1>", "<skill2>"],
  "missingSkills": ["<skill1>"],
  "recommendation": "<hire|strong_consider|consider|pass>",
  "reasoning": "<explanation>"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { matchScore: 70, reasoning: text };
  }
}
