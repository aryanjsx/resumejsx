import type { ResumeData, ResumeTemplateStyle } from '../types';

export type SectionKey = 'summary' | 'experience' | 'education' | 'projects' | 'certifications' | 'skills';

export interface StoredResume {
  id: string;
  name: string;
  resumeData: ResumeData;
  templateStyle: ResumeTemplateStyle;
  sectionOrder: SectionKey[];
  uploadedFileName: string | null;
  updatedAt: number;
}

const STORAGE_KEY = 'resumejsx_resumes';
const ACTIVE_ID_KEY = 'resumejsx_activeId';

function loadAll(): StoredResume[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(resumes: StoredResume[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
}

export function getActiveResumeId(): string | null {
  return localStorage.getItem(ACTIVE_ID_KEY);
}

export function setActiveResumeId(id: string): void {
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

export function getAllResumes(): StoredResume[] {
  return loadAll();
}

export function getResumeById(id: string): StoredResume | null {
  return loadAll().find((r) => r.id === id) ?? null;
}

export function createResume(
  name: string,
  resumeData: ResumeData,
  templateStyle: ResumeTemplateStyle,
  sectionOrder: SectionKey[],
  uploadedFileName: string | null
): StoredResume {
  const resumes = loadAll();
  const id = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newResume: StoredResume = {
    id,
    name,
    resumeData,
    templateStyle,
    sectionOrder,
    uploadedFileName,
    updatedAt: Date.now(),
  };
  resumes.push(newResume);
  saveAll(resumes);
  setActiveResumeId(id);
  return newResume;
}

export function updateResume(
  id: string,
  updates: Partial<Omit<StoredResume, 'id' | 'updatedAt'>>
): StoredResume | null {
  const resumes = loadAll();
  const idx = resumes.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  resumes[idx] = { ...resumes[idx], ...updates, id, updatedAt: Date.now() };
  saveAll(resumes);
  return resumes[idx];
}

export function deleteResume(id: string): StoredResume | null {
  const resumes = loadAll();
  const deleted = resumes.find((r) => r.id === id) ?? null;
  const filtered = resumes.filter((r) => r.id !== id);
  saveAll(filtered);
  if (getActiveResumeId() === id && filtered.length > 0) {
    setActiveResumeId(filtered[0].id);
  } else if (filtered.length === 0) {
    localStorage.removeItem(ACTIVE_ID_KEY);
  }
  return deleted;
}

/** Migrate from legacy single-resume localStorage keys */
function migrateFromLegacy(
  defaultResumeData: ResumeData,
  defaultTemplateStyle: ResumeTemplateStyle,
  defaultSectionOrder: SectionKey[]
): boolean {
  if (loadAll().length > 0) return false;
  const resumeDataRaw = localStorage.getItem('resumeData');
  const templateStyleRaw = localStorage.getItem('templateStyle');
  const sectionOrderRaw = localStorage.getItem('sectionOrder');
  const uploadedFileName = localStorage.getItem('uploadedFileName');
  if (!resumeDataRaw && !templateStyleRaw) return false;

  let resumeData = defaultResumeData;
  let templateStyle = defaultTemplateStyle;
  let sectionOrder = defaultSectionOrder;

  try {
    if (resumeDataRaw) {
      const parsed = JSON.parse(resumeDataRaw);
      if (parsed?.personalInfo) resumeData = parsed;
    }
    if (templateStyleRaw) {
      const parsed = JSON.parse(templateStyleRaw);
      if (parsed?.colorScheme) templateStyle = parsed;
    }
    if (sectionOrderRaw) {
      const parsed = JSON.parse(sectionOrderRaw);
      if (Array.isArray(parsed)) sectionOrder = parsed;
    }
  } catch {
    /* ignore parse errors */
  }

  createResume('My Resume', resumeData, templateStyle, sectionOrder, uploadedFileName || null);
  localStorage.removeItem('resumeData');
  localStorage.removeItem('templateStyle');
  localStorage.removeItem('sectionOrder');
  localStorage.removeItem('uploadedFileName');
  return true;
}

export function exportAllResumes(): string {
  const data = { resumes: loadAll(), activeId: getActiveResumeId(), version: 1 };
  return JSON.stringify(data);
}

export function importResumes(json: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed?.resumes || !Array.isArray(parsed.resumes)) {
      return { success: false, error: 'Invalid backup format' };
    }
    saveAll(parsed.resumes);
    if (parsed.activeId && parsed.resumes.some((r: StoredResume) => r.id === parsed.activeId)) {
      setActiveResumeId(parsed.activeId);
    } else if (parsed.resumes.length > 0) {
      setActiveResumeId(parsed.resumes[0].id);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Parse error' };
  }
}

export function ensureAtLeastOne(
  defaultResumeData: ResumeData,
  defaultTemplateStyle: ResumeTemplateStyle,
  defaultSectionOrder: SectionKey[]
): StoredResume {
  migrateFromLegacy(defaultResumeData, defaultTemplateStyle, defaultSectionOrder);
  const resumes = loadAll();
  if (resumes.length === 0) {
    return createResume(
      'My Resume',
      defaultResumeData,
      defaultTemplateStyle,
      defaultSectionOrder,
      null
    );
  }
  const activeId = getActiveResumeId();
  const active = activeId ? getResumeById(activeId) : null;
  if (active) return active;
  setActiveResumeId(resumes[0].id);
  return resumes[0];
}
