/**
 * Gemini AI service - uses server-side API proxy to keep API key secure.
 * Run `vercel dev` for local development so /api/gemini is available.
 */
import { ATSScore, JDMatchAnalysis, ContentSuggestionResponse, RewrittenResume, ParsedResumeWithTemplate } from '../types';
import {
  apiGetATSScore,
  apiGetJDMatchAnalysis,
  apiGenerateContentSuggestions,
  apiRewriteResume,
  apiParseResumeWithTemplate,
} from './geminiApiClient';

type ResumeContent = string | { data: string; mimeType: string };

export const getATSScore = async (resume: ResumeContent): Promise<ATSScore> => {
  return apiGetATSScore(resume);
};

export const getJDMatchAnalysis = async (resume: ResumeContent, jdText: string): Promise<JDMatchAnalysis> => {
  return apiGetJDMatchAnalysis(resume, jdText);
};

export const generateContentSuggestions = async (
  type: 'summary' | 'experience',
  context: { role?: string; company?: string; currentText?: string; resumeContext?: string }
): Promise<ContentSuggestionResponse> => {
  return apiGenerateContentSuggestions(type, context);
};

export const rewriteResume = async (resume: ResumeContent, jdText: string): Promise<RewrittenResume> => {
  return apiRewriteResume(resume, jdText);
};

export const parseResumeWithTemplate = async (resumeFile: { data: string; mimeType: string }): Promise<ParsedResumeWithTemplate> => {
  return apiParseResumeWithTemplate(resumeFile);
};
