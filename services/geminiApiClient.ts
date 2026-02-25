/**
 * Client for the Gemini proxy API. Keeps API key server-side.
 * Use `vercel dev` for local development so /api/gemini is available.
 */
const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

async function callGeminiApi<T>(body: object): Promise<T> {
  const res = await fetch(`${API_BASE}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data as T;
}

export const apiGetATSScore = (resume: string | { data: string; mimeType: string }) =>
  callGeminiApi({ type: 'ats', resume });

export const apiGetJDMatchAnalysis = (resume: string | { data: string; mimeType: string }, jdText: string) =>
  callGeminiApi({ type: 'jdMatch', resume, jdText });

export const apiGenerateContentSuggestions = (
  type: 'summary' | 'experience',
  context: { role?: string; company?: string; currentText?: string; resumeContext?: string }
) => callGeminiApi({ type: 'contentSuggestions', payload: { type, context } });

export const apiRewriteResume = (resume: string | { data: string; mimeType: string }, jdText: string) =>
  callGeminiApi({ type: 'rewrite', resume, jdText });

export const apiParseResumeWithTemplate = (resumeFile: { data: string; mimeType: string }) =>
  callGeminiApi({ type: 'parseResume', resumeFile });
