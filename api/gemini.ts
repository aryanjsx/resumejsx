/**
 * Vercel Serverless Function: Proxies Gemini AI requests.
 * Keeps the API key server-side to prevent exposure in the browser.
 * Set GEMINI_API_KEY in Vercel environment variables.
 */
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Set it in Vercel environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Re-export schemas for use in handlers (minimal - we validate on client)
const atsSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER },
    breakdown: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, score: { type: Type.INTEGER }, maxScore: { type: Type.INTEGER } } } },
    feedback: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { issue: { type: Type.STRING }, suggestion: { type: Type.STRING }, severity: { type: Type.STRING } } } },
  },
  required: ["overallScore", "breakdown", "feedback"],
};

const jdMatchSchema = {
  type: Type.OBJECT,
  properties: {
    matchPercentage: { type: Type.INTEGER },
    atsScoreAsPerJD: { type: Type.INTEGER },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    redundantKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { area: { type: Type.STRING }, suggestion: { type: Type.STRING }, impact: { type: Type.STRING } } } },
  },
  required: ["matchPercentage", "atsScoreAsPerJD", "missingKeywords", "redundantKeywords", "suggestions"],
};

const contentSuggestionSchema = {
  type: Type.OBJECT,
  properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
  required: ["suggestions"],
};

const rewrittenResumeSchema = {
  type: Type.OBJECT,
  properties: {
    personalInfo: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, email: { type: Type.STRING }, phone: { type: Type.STRING }, location: { type: Type.STRING }, linkedin: { type: Type.STRING }, portfolio: { type: Type.STRING } } },
    summary: { type: Type.OBJECT, properties: { content: { type: Type.STRING }, reasoning: { type: Type.STRING } } },
    experience: { type: Type.ARRAY },
    education: { type: Type.ARRAY },
    projects: { type: Type.ARRAY },
    certifications: { type: Type.ARRAY },
    skills: { type: Type.OBJECT, properties: { finalList: { type: Type.STRING }, added: { type: Type.ARRAY }, removed: { type: Type.ARRAY } } },
  },
  required: ["personalInfo", "summary", "experience", "education", "projects", "certifications", "skills"],
};

const parsedResumeWithTemplateSchema = {
  type: Type.OBJECT,
  properties: {
    resumeData: { type: Type.OBJECT },
    templateStyle: { type: Type.OBJECT },
  },
  required: ["resumeData", "templateStyle"],
};

type RequestBody = 
  | { type: 'ats'; resume: string | { data: string; mimeType: string } }
  | { type: 'jdMatch'; resume: string | { data: string; mimeType: string }; jdText: string }
  | { type: 'contentSuggestions'; payload: { type: 'summary' | 'experience'; context: Record<string, string> } }
  | { type: 'rewrite'; resume: string | { data: string; mimeType: string }; jdText: string }
  | { type: 'parseResume'; resumeFile: { data: string; mimeType: string } };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!body || typeof body.type !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid "type" in request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const ai = getAI();
    let result: unknown;

    switch (body.type) {
      case 'ats': {
        const resume = body.resume;
        const prompt = `Act as an expert Applicant Tracking System (ATS) and a senior hiring manager. Analyze the following resume for ATS compatibility and overall quality. Provide a score out of 100, a breakdown of the score into relevant categories, and actionable feedback.
The score breakdown should consist of a list of objects, each containing a category name, the score for that category, and the maximum possible score. Use the following categories and points:
1. Format & Structure (Max: 30 pts): Cleanliness, readability, standard section headers. Penalize for complex formatting.
2. Keywords & Content (Max: 40 pts): Relevance of keywords, use of action verbs, quantifiable achievements.
3. Contact & Clarity (Max: 15 pts): Easy-to-find and parse contact information.
4. Optimization (Max: 15 pts): General best practices.
Return the entire analysis in the specified JSON format.`;
        const resumePart = typeof resume === 'string'
          ? { text: `Resume Text:\n---\n${resume}\n---` }
          : { inlineData: { data: resume.data, mimeType: resume.mimeType } };
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [{ text: prompt }, resumePart] },
          config: { responseMimeType: "application/json", responseSchema: atsSchema },
        });
        result = JSON.parse(response.text.trim());
        break;
      }

      case 'jdMatch': {
        const { resume, jdText } = body;
        const prompt = `Act as an expert AI career coach and a senior technical recruiter specializing in resume optimization. Analyze the provided resume against the specific job description below.
Your comprehensive analysis should include:
1. Match Percentage (0-100), 2. JD-Specific ATS Score (0-100), 3. Missing Keywords, 4. Redundant Keywords, 5. Actionable Suggestions.
Return the entire analysis in the specified JSON format.`;
        const resumePart = typeof resume === 'string'
          ? { text: `Resume Text:\n---\n${resume}\n---` }
          : { inlineData: { data: resume.data, mimeType: resume.mimeType } };
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [{ text: prompt }, { text: `Job Description:\n---\n${jdText}\n---` }, resumePart] },
          config: { responseMimeType: "application/json", responseSchema: jdMatchSchema },
        });
        result = JSON.parse(response.text.trim());
        break;
      }

      case 'contentSuggestions': {
        const { type, context } = body.payload;
        const prompt = type === 'summary'
          ? `Act as a professional resume writer. Write 3 distinct, impactful professional summaries. Context: ${context.resumeContext || ''} ${context.currentText || ''}. Return JSON with 'suggestions' array of 3 strings.`
          : `Act as a professional resume writer. Write 5 strong, quantifiable bullet points for Work Experience. Role: ${context.role || 'Professional'}, Company: ${context.company || 'Company'}. ${context.currentText || ''}. Return JSON with 'suggestions' array of 5 strings.`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [{ text: prompt }] },
          config: { responseMimeType: "application/json", responseSchema: contentSuggestionSchema },
        });
        result = JSON.parse(response.text.trim());
        break;
      }

      case 'rewrite': {
        const { resume, jdText } = body;
        const prompt = `Act as an expert Resume Rewriter and ATS Optimization Specialist.
Strictly preserve: Personal Information, Education, Certifications EXACTLY.
Rewrite: Summary, Experience (paragraph format, no bullets), Projects (paragraph format), Skills (bullet format).
Integrate JD keywords naturally. Return JSON with all sections.`;
        const resumePart = typeof resume === 'string'
          ? { text: `Original Resume:\n---\n${resume}\n---` }
          : { inlineData: { data: resume.data, mimeType: resume.mimeType } };
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [{ text: prompt }, { text: `Target Job Description:\n---\n${jdText}\n---` }, resumePart] },
          config: { responseMimeType: "application/json", responseSchema: rewrittenResumeSchema },
        });
        result = JSON.parse(response.text.trim());
        break;
      }

      case 'parseResume': {
        const { resumeFile } = body;
        const prompt = `You are an expert resume parser and design analyst. Extract ALL resume content (personal info, summary, experience, education, projects, skills, certifications) and analyze the template design (layout, header style, colors, fonts, section styling). Return JSON with resumeData and templateStyle. Use IDs like exp_1, edu_1, etc.`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: [{ text: prompt }, { inlineData: { data: resumeFile.data, mimeType: resumeFile.mimeType } }] },
          config: { responseMimeType: "application/json", responseSchema: parsedResumeWithTemplateSchema },
        });
        result = JSON.parse(response.text.trim());
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown request type: ${(body as { type: string }).type}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Gemini API error:', message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
