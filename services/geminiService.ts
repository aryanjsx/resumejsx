
import { GoogleGenAI, Type } from "@google/genai";
import { ATSScore, JDMatchAnalysis } from '../types';

// FIX: Initialize the GoogleGenAI client directly with the environment variable as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const atsSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER, description: "Overall ATS score from 0-100" },
    breakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "The name of the scoring category (e.g., 'Format & Structure')." },
          score: { type: Type.INTEGER, description: "The score achieved in this category." },
          maxScore: { type: Type.INTEGER, description: "The maximum possible score for this category." },
        },
        required: ["category", "score", "maxScore"],
      },
      description: "A list of scoring categories, their achieved scores, and max possible scores."
    },
    feedback: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING, description: "The specific issue found." },
          suggestion: { type: Type.STRING, description: "An actionable suggestion to fix the issue." },
          severity: { type: Type.STRING, description: "Severity of the issue (High, Medium, or Low)." },
        },
        required: ["issue", "suggestion", "severity"],
      },
    },
  },
  required: ["overallScore", "breakdown", "feedback"],
};

const jdMatchSchema = {
    type: Type.OBJECT,
    properties: {
        matchPercentage: { type: Type.INTEGER, description: "A percentage (0-100) of how well the resume aligns with the job description." },
        atsScoreAsPerJD: { type: Type.INTEGER, description: "An ATS score (0-100) indicating how well the resume is optimized for this specific job description." },
        missingKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of crucial keywords from the job description that should be added to the resume."
        },
        redundantKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of irrelevant or overused keywords/phrases that could be removed from the resume."
        },
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING, description: "The section of the resume to improve (e.g., 'Work Experience', 'Skills')." },
                    suggestion: { type: Type.STRING, description: "A specific, actionable suggestion for improvement, such as adding or removing a keyword, or rephrasing a bullet point." },
                    impact: { type: Type.STRING, description: "The potential impact of the change (High, Medium, or Low)." }
                },
                required: ["area", "suggestion", "impact"],
            },
            description: "A prioritized list of optimization suggestions."
        }
    },
    required: ["matchPercentage", "atsScoreAsPerJD", "missingKeywords", "redundantKeywords", "suggestions"],
};

type ResumeContent = string | { data: string; mimeType: string };

export const getATSScore = async (resume: ResumeContent): Promise<ATSScore> => {
  const prompt = `Act as an expert Applicant Tracking System (ATS) and a senior hiring manager. Analyze the following resume for ATS compatibility and overall quality. Provide a score out of 100, a breakdown of the score into relevant categories, and actionable feedback.

The score breakdown should consist of a list of objects, each containing a category name, the score for that category, and the maximum possible score. Use the following categories and points:
1.  **Format & Structure (Max: 30 pts):** Cleanliness, readability, standard section headers. Penalize for complex formatting.
2.  **Keywords & Content (Max: 40 pts):** Relevance of keywords, use of action verbs, quantifiable achievements.
3.  **Contact & Clarity (Max: 15 pts):** Easy-to-find and parse contact information.
4.  **Optimization (Max: 15 pts):** General best practices.

Return the entire analysis in the specified JSON format. The resume is provided either as text or a file.`;

  const resumePart = typeof resume === 'string'
    ? { text: `Resume Text:\n---\n${resume}\n---` }
    : { inlineData: { data: resume.data, mimeType: resume.mimeType } };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: {
      parts: [
        { text: prompt },
        resumePart
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: atsSchema,
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText) as ATSScore;
};

export const getJDMatchAnalysis = async (resume: ResumeContent, jdText: string): Promise<JDMatchAnalysis> => {
    const prompt = `Act as an expert AI career coach and a senior technical recruiter specializing in resume optimization. Analyze the provided resume against the specific job description below.

Your comprehensive analysis should include:
1.  **Match Percentage:** Calculate a percentage (0-100) representing how well the resume aligns with the key requirements of the job description.
2.  **JD-Specific ATS Score:** Evaluate the resume as an Applicant Tracking System would for this *specific job*. Provide a score from 0-100. A high score means the resume is well-optimized with relevant keywords and formatting for this role.
3.  **Keywords to Add (Missing Keywords):** Identify a list of critical keywords, skills, and technologies from the job description that are missing from the resume.
4.  **Keywords to Remove (Redundant Keywords):** Identify a list of irrelevant, generic, or overused keywords/phrases in the resume that could be removed or replaced to make space for more impactful content.
5.  **Actionable Suggestions:** Provide a prioritized list of specific, actionable suggestions to tailor the resume. These should go beyond just adding keywords. For example: "In your 'Software Engineer' role at Tech Corp, rephrase the bullet point '- Developed new features' to '- Developed and launched 3 new customer-facing features using React and TypeScript, resulting in a 15% increase in user engagement,' incorporating the keyword 'TypeScript'."

Return the entire analysis in the specified JSON format.`;

    const resumePart = typeof resume === 'string'
        ? { text: `Resume Text:\n---\n${resume}\n---` }
        : { inlineData: { data: resume.data, mimeType: resume.mimeType } };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: {
            parts: [
                { text: prompt },
                { text: `Job Description:\n---\n${jdText}\n---` },
                resumePart,
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: jdMatchSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as JDMatchAnalysis;
};
