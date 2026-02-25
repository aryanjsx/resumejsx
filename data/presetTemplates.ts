import type { ResumeTemplateStyle } from '../types';

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  style: ResumeTemplateStyle;
}

export const presetTemplates: PresetTemplate[] = [
  {
    id: 'default',
    name: 'Default Professional',
    description: 'Clean single-column layout with traditional serif headings.',
    style: {
      layout: 'single-column',
      headerStyle: 'centered',
      colorScheme: {
        primary: '#000000',
        secondary: '#374151',
        accent: '#1f2937',
        background: '#ffffff',
        text: '#111827',
      },
      fontStyle: { headingFont: 'Georgia', bodyFont: 'system-ui', headingSize: 'medium' },
      sectionStyle: { dividerType: 'line', bulletStyle: 'circle', sectionSpacing: 'normal' },
      overallTheme: 'Default Professional',
      description: 'A clean, professional single-column layout with black text and traditional serif headings.',
    },
  },
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Contemporary design with blue accents and clean typography.',
    style: {
      layout: 'single-column',
      headerStyle: 'banner',
      colorScheme: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#3b82f6',
        background: '#ffffff',
        text: '#1e293b',
      },
      fontStyle: { headingFont: 'Inter', bodyFont: 'system-ui', headingSize: 'medium' },
      sectionStyle: { dividerType: 'thick-line', bulletStyle: 'arrow', sectionSpacing: 'normal' },
      overallTheme: 'Modern Blue',
      description: 'Contemporary design with blue banner header and arrow bullets.',
    },
  },
  {
    id: 'sidebar-left',
    name: 'Sidebar Left',
    description: 'Two-column layout with skills and education in a left sidebar.',
    style: {
      layout: 'sidebar-left',
      headerStyle: 'left-aligned',
      colorScheme: {
        primary: '#0f766e',
        secondary: '#475569',
        accent: '#14b8a6',
        background: '#ffffff',
        text: '#0f172a',
      },
      fontStyle: { headingFont: 'system-ui', bodyFont: 'system-ui', headingSize: 'small' },
      sectionStyle: { dividerType: 'line', bulletStyle: 'dash', sectionSpacing: 'compact' },
      overallTheme: 'Sidebar Left',
      description: 'Two-column layout with teal accents and compact spacing.',
    },
  },
  {
    id: 'sidebar-right',
    name: 'Sidebar Right',
    description: 'Two-column layout with skills and certifications on the right.',
    style: {
      layout: 'sidebar-right',
      headerStyle: 'centered',
      colorScheme: {
        primary: '#7c3aed',
        secondary: '#6b7280',
        accent: '#8b5cf6',
        background: '#ffffff',
        text: '#1f2937',
      },
      fontStyle: { headingFont: 'Georgia', bodyFont: 'system-ui', headingSize: 'medium' },
      sectionStyle: { dividerType: 'dots', bulletStyle: 'square', sectionSpacing: 'spacious' },
      overallTheme: 'Sidebar Right',
      description: 'Purple-accented layout with skills in a right sidebar.',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean design with minimal dividers and subtle styling.',
    style: {
      layout: 'single-column',
      headerStyle: 'minimal',
      colorScheme: {
        primary: '#374151',
        secondary: '#6b7280',
        accent: '#9ca3af',
        background: '#ffffff',
        text: '#374151',
      },
      fontStyle: { headingFont: 'system-ui', bodyFont: 'system-ui', headingSize: 'small' },
      sectionStyle: { dividerType: 'none', bulletStyle: 'dash', sectionSpacing: 'compact' },
      overallTheme: 'Minimal',
      description: 'Ultra-clean design with no section dividers.',
    },
  },
  {
    id: 'classic-academic',
    name: 'Classic Academic',
    description: 'Traditional academic style with formal typography.',
    style: {
      layout: 'single-column',
      headerStyle: 'centered',
      colorScheme: {
        primary: '#1e3a5f',
        secondary: '#4b5563',
        accent: '#1e40af',
        background: '#ffffff',
        text: '#111827',
      },
      fontStyle: { headingFont: 'Georgia', bodyFont: 'Georgia', headingSize: 'large' },
      sectionStyle: { dividerType: 'thick-line', bulletStyle: 'circle', sectionSpacing: 'spacious' },
      overallTheme: 'Classic Academic',
      description: 'Traditional academic style with navy blue and serif fonts.',
    },
  },
];
