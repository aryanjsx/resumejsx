
import React, { useState, useEffect, ChangeEvent, useRef, DragEvent } from 'react';
import { ResumeData, PersonalInfo, WorkExperience, Education, CategorizedSkill, Project, Certification, ResumeTemplateStyle } from '../types';
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, TabStopPosition, BorderStyle, ExternalHyperlink } from 'docx';
import saveAs from 'file-saver';
import { generateContentSuggestions, parseResumeWithTemplate } from '../services/geminiService';
import Loader from './Loader';
import { useTheme } from '../contexts/ThemeContext';

const initialResumeData: ResumeData = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: ''
  },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
};

const defaultTemplateStyle: ResumeTemplateStyle = {
  layout: 'single-column',
  headerStyle: 'centered',
  colorScheme: {
    primary: '#000000',
    secondary: '#000000',
    accent: '#000000',
    background: '#ffffff',
    text: '#000000',
  },
  fontStyle: {
    headingFont: 'Georgia',
    bodyFont: 'system-ui',
    headingSize: 'medium',
  },
  sectionStyle: {
    dividerType: 'line',
    bulletStyle: 'circle',
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(defaultSectionOrder);
    sectionSpacing: 'normal',
  },
  overallTheme: 'Default Professional',
  description: 'A clean, professional single-column layout with black text and traditional serif headings.',
};

const ResumeBuilder: React.FC<{onAnalyze: (data: ResumeData) => void}> = ({onAnalyze}) => {
  const { isDark } = useTheme();
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  
  // AI Suggestion State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiTarget, setAiTarget] = useState<{ type: 'summary' | 'experience'; id?: string } | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  // Template Upload State
  const [templateStyle, setTemplateStyle] = useState<ResumeTemplateStyle>(defaultTemplateStyle);
  const [isUploading, setIsUploading] = useState(false);
  const [templateStyle, setTemplateStyle] = useState<ResumeTemplateStyle>(defaultTemplateStyle);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section Order State
  type SectionKey = 'summary' | 'experience' | 'education' | 'projects' | 'certifications' | 'skills';
  // Section Order State
  type SectionKey = 'summary' | 'experience' | 'education' | 'projects' | 'certifications' | 'skills';
  const defaultSectionOrder: SectionKey[] = ['summary', 'experience', 'education', 'projects', 'certifications', 'skills'];
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(defaultSectionOrder);

  const defaultSectionOrder: SectionKey[] = ['summary', 'experience', 'education', 'projects', 'certifications', 'skills'];
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(defaultSectionOrder);

  const sectionLabels: Record<SectionKey, string> = {
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    projects: 'Projects',
    certifications: 'Certifications',
    skills: 'Skills'
  };

  useEffect(() => {
    const savedData = localStorage.getItem('resumeData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.personalInfo) {
          setResumeData(parsedData);
        }
      } catch (e) {
        console.error("Could not parse resume data from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
  }, [resumeData]);
    setResumes(getAllResumes());

  // Load saved template style from localStorage
  useEffect(() => {
    const savedTemplateStyle = localStorage.getItem('templateStyle');
    const savedFileName = localStorage.getItem('uploadedFileName');
    if (savedTemplateStyle) {
  // Load section order from localStorage
  useEffect(() => {
    const savedSectionOrder = localStorage.getItem('sectionOrder');
    if (savedSectionOrder) {
      try {
        setSectionOrder(JSON.parse(savedSectionOrder));
      } catch (e) {
        console.error("Could not parse section order from localStorage", e);
      }
    }
  }, []);

  // Save section order to localStorage
  useEffect(() => {
    localStorage.setItem('sectionOrder', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

      try {
        setTemplateStyle(JSON.parse(savedTemplateStyle));
        if (savedFileName) setUploadedFileName(savedFileName);
      } catch (e) {
        console.error("Could not parse template style from localStorage", e);
      }
    }
  }, []);

  // Save template style to localStorage
  useEffect(() => {
    localStorage.setItem('templateStyle', JSON.stringify(templateStyle));
    if (uploadedFileName) {
      localStorage.setItem('uploadedFileName', uploadedFileName);
    }
  }, [templateStyle, uploadedFileName]);

  // Load section order from localStorage
  useEffect(() => {
    const savedSectionOrder = localStorage.getItem('sectionOrder');
    if (savedSectionOrder) {
      try {
        setSectionOrder(JSON.parse(savedSectionOrder));
      } catch (e) {
        console.error("Could not parse section order from localStorage", e);
      }
    }
  }, []);

  // Save section order to localStorage
  useEffect(() => {
    localStorage.setItem('sectionOrder', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  // Section reordering functions
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...sectionOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setSectionOrder(newOrder);
  };

  const moveSectionDown = (index: number) => {
    if (index === sectionOrder.length - 1) return;
    const newOrder = [...sectionOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setSectionOrder(newOrder);
  };

  const resetSectionOrder = () => {
    setSectionOrder(defaultSectionOrder);
  };

  // File upload handlers
  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document (.docx), or image file (PNG/JPEG).');
      return;
    }

    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      const base64Data = await fileToBase64(file);
      const result = await parseResumeWithTemplate({
        data: base64Data,
        mimeType: file.type
      });

      setResumeData(result.resumeData);
      setTemplateStyle(result.templateStyle);
    } catch (error) {
      console.error('Error parsing resume:', error);
      alert('Error parsing resume. Please try again or enter information manually.');
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleResetTemplate = () => {
    setTemplateStyle(defaultTemplateStyle);
    setUploadedFileName(null);
    localStorage.removeItem('uploadedFileName');
  };

  const handlePersonalInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [name]: value } }));
  };

  const handleSummaryChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setResumeData(prev => ({ ...prev, summary: e.target.value }));
  };

  const handleAddItem = <T,>(section: keyof ResumeData, newItem: T) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...(prev[section] as any[]), newItem],
    }));
  };

  const handleRemoveItem = (section: keyof ResumeData, id: string) => {
     setResumeData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter(item => item.id !== id),
    }));
  };

  const handleItemChange = <T extends {id: string}>(section: keyof ResumeData, id: string, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => ({
        ...prev,
        [section]: ((prev[section] as unknown) as T[]).map(item => item.id === id ? { ...item, [name]: value } : item)
    }));
  };

  // AI Generation Handlers
  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setAiTarget({ type: 'summary' });
    setIsAiModalOpen(true);
    setAiSuggestions([]);
    const element = printAreaRef.current ?? document.getElementById('print-area');
    if (!element) return;
    setSelectedSuggestions([]);

    try {
      // Construct context from existing resume data to help the AI
      const contextString = `Name: ${resumeData.personalInfo.name}, Role Title (if any): ${resumeData.experience?.[0]?.role || 'Professional'}. 
      Experience: ${resumeData.experience.map(e => `${e.role} at ${e.company}`).join(', ')}`;

      const response = await generateContentSuggestions('summary', {
        currentText: resumeData.summary,
        resumeContext: contextString
      });
      setAiSuggestions(response.suggestions);
    } catch (error) {
      console.error("Error generating summary:", error);
      setAiSuggestions(["Error generating suggestions. Please check your API connection."]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplySuggestions = () => {
      if (!aiTarget) return;

      if (aiTarget.type === 'summary') {
          // For summary, replace the text with the selected suggestion
          const newText = selectedSuggestions.join(' ');
          setResumeData(prev => ({ ...prev, summary: newText }));
      }
      setIsAiModalOpen(false);
  };

  const toggleSuggestionSelection = (suggestion: string) => {
      // Radio button behavior for summary (select only one)
      setSelectedSuggestions([suggestion]);
  };


  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const { personalInfo, summary, experience, education, projects, certifications, skills } = resumeData;

    // Convert hex color to Word format (remove #)
    const hexToWordColor = (hex: string): string => hex.replace('#', '');
    const primaryColor = hexToWordColor(templateStyle.colorScheme.primary);
    const secondaryColor = hexToWordColor(templateStyle.colorScheme.secondary);
    
    // Determine heading size based on template
    const getHeadingFontSize = (): number => {
      switch (templateStyle.fontStyle.headingSize) {
        case 'small': return 22;
        case 'medium': return 24;
        case 'large': return 28;
        default: return 24;
      }
    };

    // Determine border style based on template
    const getBorderStyleForSection = () => {
      switch (templateStyle.sectionStyle.dividerType) {
        case 'line': return BorderStyle.SINGLE;
        case 'thick-line': return BorderStyle.THICK;
        case 'dots': return BorderStyle.DOTTED;
        case 'none': return BorderStyle.NONE;
        default: return BorderStyle.SINGLE;
      }
    };

    const createSectionTitle = (text: string) => {
      return new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), bold: true, color: primaryColor, size: getHeadingFontSize() })],
        border: templateStyle.sectionStyle.dividerType !== 'none' ? {
          bottom: { color: primaryColor, space: 1, style: getBorderStyleForSection(), size: templateStyle.sectionStyle.dividerType === 'thick-line' ? 12 : 6 },
        } : undefined,
        spacing: { after: templateStyle.sectionStyle.sectionSpacing === 'compact' ? 100 : templateStyle.sectionStyle.sectionSpacing === 'spacious' ? 300 : 200 },
      });
    };

    const headerAlignment = templateStyle.headerStyle === 'centered' || templateStyle.headerStyle === 'banner' 
      ? AlignmentType.CENTER 
      : AlignmentType.LEFT;
    
    const docChildren: Paragraph[] = [
      // Personal Info
      new Paragraph({
        children: [new TextRun({ text: personalInfo.name, bold: true, size: 52, color: primaryColor })],
        alignment: headerAlignment,
      }),
      new Paragraph({
        children: [new TextRun({ text: [ personalInfo.location, personalInfo.phone, personalInfo.email ].filter(Boolean).join(' | '), color: secondaryColor })],
        alignment: headerAlignment,
      }),
      new Paragraph({
        children: [
          ...(personalInfo.linkedin ? [
            new ExternalHyperlink({
              children: [new TextRun({ text: 'LinkedIn', color: '0000FF', underline: {} })],
              link: personalInfo.linkedin,
            }),
          ] : []),
          ...(personalInfo.linkedin && personalInfo.portfolio ? [new TextRun({ text: ' | ' })] : []),
          ...(personalInfo.portfolio ? [
            new ExternalHyperlink({
              children: [new TextRun({ text: 'Portfolio', color: '0000FF', underline: {} })],
              link: personalInfo.portfolio,
            }),
          ] : []),
        ],
        alignment: headerAlignment,
        spacing: { after: 400 },
      }),
    ];
    
    // Helper functions for each section
    const addSummarySection = () => {
      if (summary) {
        docChildren.push(createSectionTitle('Summary'));
        docChildren.push(new Paragraph({ text: summary, spacing: { after: 200 } }));
      }
    };

    const addExperienceSection = () => {
      if (experience.length > 0) {
        docChildren.push(createSectionTitle('Experience'));
        experience.forEach(exp => {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({ text: `${exp.role} | `, bold: true, size: 22 }),
              new TextRun({ text: `${exp.company}, ${exp.location}`, size: 22, color: secondaryColor }),
              new TextRun({ text: `\t${exp.startDate} – ${exp.endDate}`, color: secondaryColor }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          }));
          exp.description.split('\n').filter(line => line.trim()).forEach(line => {
            docChildren.push(new Paragraph({
              text: line.replace(/^- /, '').trim(),
              bullet: { level: 0 },
              indent: { left: 720 },
              spacing: { before: 100 },
            }));
          });
          docChildren.push(new Paragraph(""));
        });
      }
    };

    const addEducationSection = () => {
      if (education.length > 0) {
        docChildren.push(createSectionTitle('Education'));
        education.forEach(edu => {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({ text: `${edu.institution}, ${edu.location}`, bold: true, size: 22 }),
              new TextRun({ text: `\t${edu.startDate} – ${edu.endDate}`, color: secondaryColor }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          }));
          docChildren.push(new Paragraph({
            children: [
              new TextRun({ text: edu.degree }),
              ...(edu.gpa ? [new TextRun({ text: `\tCGPA: ${edu.gpa}`, color: secondaryColor })] : []),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          }));
          docChildren.push(new Paragraph(""));
        });
      }
    };

    const addProjectsSection = () => {
      if (projects.length > 0) {
        docChildren.push(createSectionTitle('Projects'));
        projects.forEach(proj => {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({ text: `${proj.title} | `, bold: true, size: 22 }),
              new TextRun({ text: proj.technologies, size: 20, italics: true, color: primaryColor }),
              new TextRun({ text: `\t${proj.startDate} – ${proj.endDate}`, color: secondaryColor }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          }));
          proj.description.split('\n').filter(line => line.trim()).forEach(line => {
            docChildren.push(new Paragraph({
              text: line.replace(/^- /, '').trim(),
              bullet: { level: 0 },
              indent: { left: 720 },
              spacing: { before: 100 },
            }));
          });
          if (proj.liveLink || proj.githubLink) {
            const linkChildren: (TextRun | typeof ExternalHyperlink)[] = [];
            if (proj.liveLink) {
              linkChildren.push(new ExternalHyperlink({
                children: [new TextRun({ text: 'Live Demo', color: '0000FF', underline: {} })],
                link: proj.liveLink,
              }));
            }
            if (proj.liveLink && proj.githubLink) {
              linkChildren.push(new TextRun({ text: ' | ' }));
            }
            if (proj.githubLink) {
              linkChildren.push(new ExternalHyperlink({
                children: [new TextRun({ text: 'GitHub', color: '0000FF', underline: {} })],
                link: proj.githubLink,
              }));
            }
            docChildren.push(new Paragraph({
              children: linkChildren,
              indent: { left: 720 },
              spacing: { before: 100 },
            }));
          }
          docChildren.push(new Paragraph(""));
        });
      }
    };

    const addCertificationsSection = () => {
      if (certifications.length > 0) {
        docChildren.push(createSectionTitle('Certifications'));
        certifications.forEach(cert => {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({ text: `${cert.name} - `, bold: true, size: 22 }),
              new TextRun({ text: cert.issuer, size: 22 }),
              new TextRun({ text: `\t${cert.date}`, color: secondaryColor }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          }));
        });
        docChildren.push(new Paragraph(""));
      }
    };

    const addSkillsSection = () => {
      if (skills.length > 0) {
        docChildren.push(createSectionTitle('Skills'));
        skills.forEach(skill => docChildren.push(new Paragraph({
          children: [
            new TextRun({ text: `${skill.category}: `, bold: true, size: 22, color: secondaryColor }),
            new TextRun({ text: skill.skills, size: 22 }),
          ],
        })));
      }
    };

    // Add sections in dynamic order
    sectionOrder.forEach(section => {
      switch (section) {
        case 'summary': addSummarySection(); break;
        case 'experience': addExperienceSection(); break;
        case 'education': addEducationSection(); break;
        case 'projects': addProjectsSection(); break;
        case 'certifications': addCertificationsSection(); break;
        case 'skills': addSkillsSection(); break;
      }
    });


    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren,
        }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${personalInfo.name.replace(/\s+/g, '_') || 'resume'}.docx`);
    });
};
  
  const inputClasses = "p-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition";
  const itemContainerClasses = "p-4 border border-gray-200 dark:border-gray-600 rounded mb-3 bg-white dark:bg-gray-700";

  const renderSection = (title: string, data: any, renderItem: (item: any, index: number) => React.ReactNode) => {
      if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && data.trim() === '')) {
          return null;
      }
      return (
          <section className="mb-6">
              <h2 className="text-xl font-bold text-teal-600 border-b-2 border-teal-200 pb-1 mb-3 font-serif">{title}</h2>
              {Array.isArray(data) ? data.map(renderItem) : <p className="text-gray-700 whitespace-pre-wrap">{data}</p>}
          </section>
      );
  };
  
  // Get dynamic styles based on template
  const getHeaderAlignment = () => {
    switch (templateStyle.headerStyle) {
      case 'centered': return 'text-center';
      case 'left-aligned': return 'text-left';
      case 'banner': return 'text-center py-4';
      case 'minimal': return 'text-left';
      default: return 'text-center';
    }
  };

  const getHeadingSize = () => {
    switch (templateStyle.fontStyle.headingSize) {
      case 'small': return 'text-lg';
      case 'medium': return 'text-xl';
      case 'large': return 'text-2xl';
      default: return 'text-xl';
    }
  };

  const getSectionSpacing = () => {
    switch (templateStyle.sectionStyle.sectionSpacing) {
      case 'compact': return 'mb-4';
      case 'normal': return 'mb-6';
      case 'spacious': return 'mb-8';
      default: return 'mb-6';
    }
  };

  const getBulletStyle = () => {
    switch (templateStyle.sectionStyle.bulletStyle) {
      case 'circle': return 'list-disc';
      case 'square': return 'list-[square]';
      case 'dash': return 'list-["-_"]';
      case 'arrow': return 'list-["→_"]';
      case 'none': return 'list-none';
      default: return 'list-disc';
    }
  };

  const getDividerStyle = () => {
    switch (templateStyle.sectionStyle.dividerType) {
      case 'line': return 'border-b-2';
      case 'thick-line': return 'border-b-4';
      case 'dots': return 'border-b-2 border-dotted';
      case 'none': return '';
      default: return 'border-b-2';
    }
  };

  const ResumePreview = () => {
    const isTwoColumn = templateStyle.layout === 'two-column' || templateStyle.layout === 'sidebar-left' || templateStyle.layout === 'sidebar-right';
    
    // Dark mode color overrides
    const colors = isDark ? {
      primary: '#60a5fa', // blue-400
      secondary: '#9ca3af', // gray-400
      accent: '#818cf8', // indigo-400
      background: '#1f2937', // gray-800
      text: '#f3f4f6', // gray-100
    } : templateStyle.colorScheme;

    const customStyles = {
      '--primary-color': colors.primary,
      '--secondary-color': colors.secondary,
      '--accent-color': colors.accent,
      '--bg-color': colors.background,
      '--text-color': colors.text,
    } as React.CSSProperties;

    const renderTemplateSection = (title: string, data: any, renderItem: (item: any, index: number) => React.ReactNode) => {
      if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && data.trim() === '')) {
        return null;
      }
      return (
        <section className={getSectionSpacing()}>
          <h2 
            className={`${getHeadingSize()} font-bold ${getDividerStyle()} pb-1 mb-3`}
            style={{ 
              color: colors.primary,
              borderColor: colors.accent,
              fontFamily: templateStyle.fontStyle.headingFont
            }}
          >
            {title}
          </h2>
          {Array.isArray(data) ? data.map(renderItem) : <p className="whitespace-pre-wrap" style={{ color: colors.text }}>{data}</p>}
        </section>
      );
    };

    // Two-column layout for sidebar templates
    if (isTwoColumn) {
      const isLeftSidebar = templateStyle.layout === 'sidebar-left';
      
      const sidebarContent = (
        <div className="space-y-6">
          {/* Skills in sidebar */}
          {resumeData.skills.length > 0 && (
            <section>
              <h2 
                className={`${getHeadingSize()} font-bold ${getDividerStyle()} pb-1 mb-3`}
                style={{ color: colors.primary, borderColor: colors.accent, fontFamily: templateStyle.fontStyle.headingFont }}
              >
                Skills
              </h2>
              {resumeData.skills.map((skill: CategorizedSkill) => (
                <div key={skill.id} className="mb-2">
                  <strong className="text-sm" style={{ color: colors.secondary }}>{skill.category}</strong>
                  <p className="text-sm" style={{ color: colors.text }}>{skill.skills}</p>
                </div>
              ))}
            </section>
          )}
          
          {/* Certifications in sidebar */}
          {resumeData.certifications.length > 0 && (
            <section>
              <h2 
                className={`${getHeadingSize()} font-bold ${getDividerStyle()} pb-1 mb-3`}
                style={{ color: colors.primary, borderColor: colors.accent, fontFamily: templateStyle.fontStyle.headingFont }}
              >
                Certifications
              </h2>
              {resumeData.certifications.map((cert: Certification) => (
                <div key={cert.id} className="mb-2">
                  <p className="font-medium text-sm" style={{ color: colors.text }}>{cert.name}</p>
                  <p className="text-xs" style={{ color: colors.secondary }}>{cert.issuer} • {cert.date}</p>
                </div>
              ))}
            </section>
          )}

          {/* Education in sidebar for compact layouts */}
          {resumeData.education.length > 0 && (
            <section>
              <h2 
                className={`${getHeadingSize()} font-bold ${getDividerStyle()} pb-1 mb-3`}
                style={{ color: colors.primary, borderColor: colors.accent, fontFamily: templateStyle.fontStyle.headingFont }}
              >
                Education
              </h2>
              {resumeData.education.map((edu: Education) => (
                <div key={edu.id} className="mb-3">
                  <p className="font-medium text-sm" style={{ color: colors.text }}>{edu.degree}</p>
                  <p className="text-xs" style={{ color: colors.secondary }}>{edu.institution}</p>
                  <p className="text-xs" style={{ color: colors.secondary }}>{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      );

      const mainContent = (
        <div>
          {/* Summary */}
          {resumeData.summary && renderTemplateSection('Summary', resumeData.summary, () => <></>)}
          
          {/* Experience */}
          {renderTemplateSection('Experience', resumeData.experience, (exp: WorkExperience) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-start flex-wrap">
                <h3 className="font-bold" style={{ color: colors.text }}>{exp.role}</h3>
                <p className="text-sm whitespace-nowrap" style={{ color: colors.secondary }}>{exp.startDate} – {exp.endDate}</p>
              </div>
              <p className="text-sm" style={{ color: colors.secondary }}>{exp.company}, {exp.location}</p>
              <ul className={`${getBulletStyle()} list-inside mt-1 text-sm`} style={{ color: colors.text }}>
                {exp.description.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '').trim()}</li>)}
              </ul>
            </div>
          ))}
          
          {/* Projects */}
          {renderTemplateSection('Projects', resumeData.projects, (proj: Project) => (
            <div key={proj.id} className="mb-4">
              <div className="flex justify-between items-start flex-wrap">
                <h3 className="font-bold" style={{ color: colors.text }}>{proj.title}</h3>
                <p className="text-sm whitespace-nowrap" style={{ color: colors.secondary }}>{proj.startDate} – {proj.endDate}</p>
              </div>
              <p className="text-sm italic" style={{ color: colors.accent }}>{proj.technologies}</p>
              <ul className={`${getBulletStyle()} list-inside mt-1 text-sm`} style={{ color: colors.text }}>
                {proj.description.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '').trim()}</li>)}
              </ul>
              {(proj.liveLink || proj.githubLink) && (
                <p className="text-sm mt-1 flex gap-3 flex-wrap" style={{ color: colors.accent }}>
                  {proj.liveLink && <a href={proj.liveLink} target="_blank" rel="noopener noreferrer" className="hover:underline">Live Demo</a>}
                  {proj.githubLink && <a href={proj.githubLink} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>}
                </p>
              )}
            </div>
          ))}
        </div>
      );

      return (
        <div className="p-8" style={{ ...customStyles, backgroundColor: colors.background }}>
          {/* Header */}
          <header className={`${getHeaderAlignment()} mb-6 pb-4`} style={{ borderBottomColor: colors.accent, borderBottomWidth: templateStyle.headerStyle === 'banner' ? '3px' : '0' }}>
            <h1 
              className="text-3xl font-bold"
              style={{ color: colors.primary, fontFamily: templateStyle.fontStyle.headingFont }}
            >
              {resumeData.personalInfo.name}
            </h1>
            <p className="text-sm mt-2" style={{ color: colors.secondary }}>
              {[resumeData.personalInfo.location, resumeData.personalInfo.phone, resumeData.personalInfo.email].filter(Boolean).join(' • ')}
            </p>
            <p className="text-sm" style={{ color: colors.accent }}>
              {resumeData.personalInfo.linkedin && <a href={resumeData.personalInfo.linkedin} className="hover:underline mr-3">LinkedIn</a>}
              {resumeData.personalInfo.portfolio && <a href={resumeData.personalInfo.portfolio} className="hover:underline">Portfolio</a>}
            </p>
          </header>

          <div className="flex gap-6">
            {isLeftSidebar && <div className="w-1/3 pr-4 border-r" style={{ borderColor: colors.accent }}>{sidebarContent}</div>}
            <div className={isLeftSidebar ? 'w-2/3 pl-4' : 'w-2/3 pr-4'}>{mainContent}</div>
            {!isLeftSidebar && <div className="w-1/3 pl-4 border-l" style={{ borderColor: colors.accent }}>{sidebarContent}</div>}
          </div>
        </div>
      );
    }

    // Single column layout (default)
    return (
      <div className="p-8" style={{ ...customStyles, backgroundColor: colors.background, fontFamily: templateStyle.fontStyle.bodyFont }}>
        <header className={`${getHeaderAlignment()} mb-8 ${templateStyle.headerStyle === 'banner' ? 'py-4 px-6 rounded-lg' : ''}`} 
          style={templateStyle.headerStyle === 'banner' ? { backgroundColor: colors.primary } : {}}>
          <h1 
            className="text-4xl font-bold"
            style={{ 
              color: templateStyle.headerStyle === 'banner' ? '#ffffff' : colors.primary,
              fontFamily: templateStyle.fontStyle.headingFont 
            }}
          >
            {resumeData.personalInfo.name}
          </h1>
          <p className="text-sm mt-2" style={{ color: templateStyle.headerStyle === 'banner' ? 'rgba(255,255,255,0.9)' : colors.secondary }}>
            {
              [
                resumeData.personalInfo.location,
                resumeData.personalInfo.phone,
                resumeData.personalInfo.email,
                resumeData.personalInfo.linkedin ? 'LinkedIn' : null,
                resumeData.personalInfo.portfolio ? 'Portfolio' : null
              ].filter(Boolean).map((item, index, arr) => (
                <React.Fragment key={index}>
                  {item === 'LinkedIn' ? <a href={resumeData.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: templateStyle.headerStyle === 'banner' ? '#ffffff' : colors.accent }}>{item}</a> 
                   : item === 'Portfolio' ? <a href={resumeData.personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: templateStyle.headerStyle === 'banner' ? '#ffffff' : colors.accent }}>{item}</a> 
                   : item}
                  {index < arr.length - 1 ? ' | ' : ''}
                </React.Fragment>
              ))
            }
          </p>
        </header>

        {/* Render sections in dynamic order */}
        {sectionOrder.map((section) => {
          switch (section) {
            case 'summary':
              return resumeData.summary ? (
                <React.Fragment key="summary">
                  {renderTemplateSection('Summary', resumeData.summary, () => <></>)}
                </React.Fragment>
              ) : null;
            case 'experience':
              return (
                <React.Fragment key="experience">
                  {renderTemplateSection('Experience', resumeData.experience, (exp: WorkExperience) => (
                    <div key={exp.id} className="mb-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                          {exp.role} | <span className="font-semibold">{exp.company}, {exp.location}</span>
                        </h3>
                        <p className="text-sm font-medium whitespace-nowrap" style={{ color: colors.secondary }}>{exp.startDate} – {exp.endDate}</p>
                      </div>
                      <ul className={`${getBulletStyle()} list-inside mt-1 whitespace-pre-wrap`} style={{ color: colors.text }}>
                        {exp.description.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '').trim()}</li>)}
                      </ul>
                    </div>
                  ))}
                </React.Fragment>
              );
            case 'education':
              return (
                <React.Fragment key="education">
                  {renderTemplateSection('Education', resumeData.education, (edu: Education) => (
                    <div key={edu.id} className="mb-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg" style={{ color: colors.text }}>{edu.institution}, {edu.location}</h3>
                        <p className="text-sm font-medium" style={{ color: colors.secondary }}>{edu.startDate} – {edu.endDate}</p>
                      </div>
                      <div className="flex justify-between items-start">
                        <p style={{ color: colors.text }}>{edu.degree}</p>
                        {edu.gpa && <p className="text-sm" style={{ color: colors.secondary }}>CGPA: {edu.gpa}</p>}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              );
            case 'projects':
              return (
                <React.Fragment key="projects">
                  {renderTemplateSection('Projects', resumeData.projects, (proj: Project) => (
                    <div key={proj.id} className="mb-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg" style={{ color: colors.text }}>
                          {proj.title} | <span className="font-semibold text-sm" style={{ color: colors.accent }}>{proj.technologies}</span>
                        </h3>
                        <p className="text-sm font-medium whitespace-nowrap" style={{ color: colors.secondary }}>{proj.startDate} – {proj.endDate}</p>
                      </div>
                      <ul className={`${getBulletStyle()} list-inside mt-1 whitespace-pre-wrap`} style={{ color: colors.text }}>
                        {proj.description.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '').trim()}</li>)}
                      </ul>
                      {(proj.liveLink || proj.githubLink) && (
                        <p className="text-sm mt-1 flex gap-3 flex-wrap" style={{ color: colors.accent }}>
                          {proj.liveLink && <a href={proj.liveLink} target="_blank" rel="noopener noreferrer" className="hover:underline">Live Demo</a>}
                          {proj.githubLink && <a href={proj.githubLink} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>}
                        </p>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              );
            case 'certifications':
              return (
                <React.Fragment key="certifications">
                  {renderTemplateSection('Certifications', resumeData.certifications, (cert: Certification) => (
                    <div key={cert.id} className="mb-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg" style={{ color: colors.text }}>{cert.name} - <span className="font-semibold">{cert.issuer}</span></h3>
                        <p className="text-sm font-medium" style={{ color: colors.secondary }}>{cert.date}</p>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              );
            case 'skills':
              return (
                <React.Fragment key="skills">
                  {renderTemplateSection('Skills', resumeData.skills, (skill: CategorizedSkill) => (
                    <div key={skill.id} className="mb-1 flex" style={{ color: colors.text }}>
                      <strong className="font-semibold w-48 flex-shrink-0" style={{ color: colors.secondary }}>{skill.category}:</strong>
                      <span>{skill.skills}</span>
                    </div>
                  ))}
                </React.Fragment>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };


  return (
    <>
      {/* Fullscreen Preview Modal */}
      {isPreviewFullScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setIsPreviewFullScreen(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsPreviewFullScreen(false)} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              aria-label="Close fullscreen preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-8">
              <ResumePreview />
            </div>
          </div>
        </div>
      )}

      {/* AI Content Suggestion Modal */}
      {isAiModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={() => !aiLoading && setIsAiModalOpen(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 rounded-t-lg">
                      <div className="flex items-center gap-2">
                          <span className="text-2xl">✨</span>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI Suggestions</h3>
                      </div>
                      {!aiLoading && (
                          <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                          </button>
                      )}
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-grow">
                      {aiLoading ? (
                          <div className="flex flex-col items-center justify-center py-10">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                              <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Generating creative content...</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                  Select the option that best fits your profile:
                              </p>
                              {aiSuggestions.map((suggestion, idx) => (
                                  <div 
                                      key={idx} 
                                      className={`p-3 rounded-md border cursor-pointer transition-all ${selectedSuggestions.includes(suggestion) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                      onClick={() => toggleSuggestionSelection(suggestion)}
                                  >
                                      <div className="flex items-start gap-3">
                                          <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedSuggestions.includes(suggestion) ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white dark:bg-gray-700'}`}>
                                              {selectedSuggestions.includes(suggestion) && (
                                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                  </svg>
                                              )}
                                          </div>
                                          <p className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed">{suggestion}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end gap-3">
                      <button 
                          onClick={() => setIsAiModalOpen(false)} 
                          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
                          disabled={aiLoading}
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleApplySuggestions} 
                          disabled={aiLoading || selectedSuggestions.length === 0}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Use Selected
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md no-print max-h-[109vh] overflow-y-auto transition-colors duration-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Resume Content</h2>
          
          {/* Resume Upload Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import Resume
              </h3>
              {uploadedFileName && (
                <button
                  onClick={handleResetTemplate}
                  className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reset to Default
                </button>
              )}
            </div>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                  : uploadedFileName 
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/30' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,image/png,image/jpeg"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Analyzing resume and detecting template...</p>
                </div>
              ) : uploadedFileName ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-medium text-green-700 dark:text-green-400">{uploadedFileName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Template: {templateStyle.overallTheme}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Click to upload a different resume</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Drop your resume here or click to browse</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Supports PDF, Word (.docx), PNG, JPEG</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Your resume template will be preserved for export</p>
                </div>
              )}
            </div>
            
            {uploadedFileName && (
              <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: templateStyle.colorScheme.primary }}></span>
                  Template preserved: <strong>{templateStyle.overallTheme}</strong> — {templateStyle.layout} layout
                </p>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1">Your exported resume will match the original template style</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* Personal Info */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" value={resumeData.personalInfo.name} onChange={handlePersonalInfoChange} placeholder="Full Name" className={inputClasses} />
              <input name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfoChange} placeholder="Email" className={inputClasses} />
              <input name="phone" value={resumeData.personalInfo.phone} onChange={handlePersonalInfoChange} placeholder="Phone" className={inputClasses} />
              <input name="location" value={resumeData.personalInfo.location} onChange={handlePersonalInfoChange} placeholder="Location" className={inputClasses} />
              <input name="linkedin" value={resumeData.personalInfo.linkedin} onChange={handlePersonalInfoChange} placeholder="LinkedIn URL" className={inputClasses} />
              <input name="portfolio" value={resumeData.personalInfo.portfolio} onChange={handlePersonalInfoChange} placeholder="Portfolio URL" className={inputClasses} />
            </div>
          </div>

          {/* Section Order Control */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Section Order
              </h3>
              <button
                onClick={resetSectionOrder}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500"
              >
                Reset
              </button>
            </div>
            <div className="space-y-1">
              {sectionOrder.map((section, index) => (
                <div key={section} className="flex items-center justify-between bg-white dark:bg-gray-600 p-2 rounded border border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400 transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-4">{index + 1}.</span>
                    {sectionLabels[section]}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveSectionUp(index)}
                      disabled={index === 0}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveSectionDown(index)}
                      disabled={index === sectionOrder.length - 1}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Use arrows to reorder sections. Changes reflect in preview instantly.</p>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-3">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Professional Summary</h3>
                <button 
                    onClick={handleGenerateSummary} 
                    className="text-sm flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium px-3 py-1 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-full transition"
                >
                    <span>✨</span> AI Assist
                </button>
            </div>
            <textarea value={resumeData.summary} onChange={handleSummaryChange} placeholder="Summary" className={`${inputClasses} h-24`} />
          </div>
          {/* Experience */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Work Experience</h3>
            {resumeData.experience.map(exp => (
              <div key={exp.id} className={itemContainerClasses}>
                  <input name="role" value={exp.role} onChange={(e) => handleItemChange('experience', exp.id, e)} placeholder="Role" className={`${inputClasses} mb-2`}/>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                      <input name="company" value={exp.company} onChange={(e) => handleItemChange('experience', exp.id, e)} placeholder="Company" className={inputClasses}/>
                      <input name="location" value={exp.location} onChange={(e) => handleItemChange('experience', exp.id, e)} placeholder="Location" className={inputClasses}/>
                  </div>
                  <div className="flex gap-2 mb-2">
                      <input name="startDate" value={exp.startDate} onChange={(e) => handleItemChange('experience', exp.id, e)} placeholder="Start Date" className={`${inputClasses} w-1/2`}/>
                      <input name="endDate" value={exp.endDate} onChange={(e) => handleItemChange('experience', exp.id, e)} placeholder="End Date" className={`${inputClasses} w-1/2`}/>
                  </div>
                  <div className="relative">
                      <textarea name="description" value={exp.description} onChange={(e) => handleItemChange('experience', exp.id, e)} placeholder="Description (use '-' for bullet points)" className={`${inputClasses} h-24 mb-1`}/>
                  </div>
                  <button onClick={() => handleRemoveItem('experience', exp.id)} className="text-red-500 dark:text-red-400 mt-2 text-sm hover:underline">Remove</button>
              </div>
            ))}
            <button onClick={() => handleAddItem<WorkExperience>('experience', {id: `exp${Date.now()}`, role: '', company: '', location: '', startDate: '', endDate: '', description: ''})} className="text-blue-600 dark:text-blue-400 font-medium">+ Add Experience</button>
          </div>
          {/* Education */}
          <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Education</h3>
              {resumeData.education.map(edu => (
                  <div key={edu.id} className={itemContainerClasses}>
                      <input name="institution" value={edu.institution} onChange={(e) => handleItemChange('education', edu.id, e)} placeholder="Institution" className={`${inputClasses} mb-2`}/>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                          <input name="degree" value={edu.degree} onChange={(e) => handleItemChange('education', edu.id, e)} placeholder="Degree" className={inputClasses}/>
                          <input name="location" value={edu.location} onChange={(e) => handleItemChange('education', edu.id, e)} placeholder="Location" className={inputClasses}/>
                      </div>
                      <div className="flex gap-2">
                          <input name="startDate" value={edu.startDate} onChange={(e) => handleItemChange('education', edu.id, e)} placeholder="Start Date" className={`${inputClasses} w-1/3`}/>
                          <input name="endDate" value={edu.endDate} onChange={(e) => handleItemChange('education', edu.id, e)} placeholder="End Date" className={`${inputClasses} w-1/3`}/>
                          <input name="gpa" value={edu.gpa} onChange={(e) => handleItemChange('education', edu.id, e)} placeholder="GPA" className={`${inputClasses} w-1/3`}/>
                      </div>
                      <button onClick={() => handleRemoveItem('education', edu.id)} className="text-red-500 dark:text-red-400 mt-2 text-sm hover:underline">Remove</button>
                  </div>
              ))}
              <button onClick={() => handleAddItem<Education>('education', {id: `edu${Date.now()}`, institution: '', degree: '', location: '', startDate: '', endDate: '', gpa: ''})} className="text-blue-600 dark:text-blue-400 font-medium">+ Add Education</button>
          </div>
          {/* Projects */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Projects</h3>
            {resumeData.projects.map(proj => (
                <div key={proj.id} className={itemContainerClasses}>
                    <input name="title" value={proj.title} onChange={(e) => handleItemChange('projects', proj.id, e)} placeholder="Project Title" className={`${inputClasses} mb-2`}/>
                    <input name="technologies" value={proj.technologies} onChange={(e) => handleItemChange('projects', proj.id, e)} placeholder="Technologies (comma-separated)" className={`${inputClasses} mb-2`}/>
                    <div className="flex gap-2 mb-2">
                        <input name="startDate" value={proj.startDate} onChange={(e) => handleItemChange('projects', proj.id, e)} placeholder="Start Date" className={`${inputClasses} w-1/2`}/>
                        <input name="endDate" value={proj.endDate} onChange={(e) => handleItemChange('projects', proj.id, e)} placeholder="End Date" className={`${inputClasses} w-1/2`}/>
                    </div>
                    <textarea name="description" value={proj.description} onChange={(e) => handleItemChange('projects', proj.id, e)} placeholder="Description (use '-' for bullet points)" className={`${inputClasses} h-20 mb-2`}/>
                    <div className="flex gap-2 mb-2">
                        <input name="liveLink" value={proj.liveLink} onChange={(e) => handleItemChange('projects', proj.id, e)} placeholder="Live Link" className={`${inputClasses} w-1/2`}/>
                        <input name="githubLink" value={proj.githubLink} onChange={(e) => handleItemChange('projects', proj.id, e)} placeholder="GitHub Link" className={`${inputClasses} w-1/2`}/>
                    </div>
                    <button onClick={() => handleRemoveItem('projects', proj.id)} className="text-red-500 dark:text-red-400 mt-2 text-sm hover:underline">Remove</button>
                </div>
            ))}
            <button onClick={() => handleAddItem<Project>('projects', {id: `proj${Date.now()}`, title: '', description: '', technologies: '', startDate: '', endDate: '', liveLink: '', githubLink: ''})} className="text-blue-600 dark:text-blue-400 font-medium">+ Add Project</button>
          </div>
          {/* Certifications */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Certifications</h3>
            {resumeData.certifications.map(cert => (
              <div key={cert.id} className={itemContainerClasses}>
                <input name="name" value={cert.name} onChange={(e) => handleItemChange('certifications', cert.id, e)} placeholder="Certification Name" className={`${inputClasses} mb-2`}/>
                <div className="grid grid-cols-2 gap-2">
                  <input name="issuer" value={cert.issuer} onChange={(e) => handleItemChange('certifications', cert.id, e)} placeholder="Issuing Organization" className={inputClasses}/>
                  <input name="date" value={cert.date} onChange={(e) => handleItemChange('certifications', cert.id, e)} placeholder="Date" className={inputClasses}/>
                </div>
                <button onClick={() => handleRemoveItem('certifications', cert.id)} className="text-red-500 dark:text-red-400 mt-2 text-sm hover:underline">Remove</button>
              </div>
            ))}
            <button onClick={() => handleAddItem<Certification>('certifications', {id: `cert${Date.now()}`, name: '', issuer: '', date: ''})} className="text-blue-600 dark:text-blue-400 font-medium">+ Add Certification</button>
          </div>
          {/* Skills */}
          <div className="mb-auto">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Skills</h3>
            {resumeData.skills.map(skill => (
              <div key={skill.id} className={itemContainerClasses}>
                  <input name="category" value={skill.category} onChange={(e) => handleItemChange('skills', skill.id, e)} placeholder="Skill Category (e.g., Backend)" className={`${inputClasses} mb-2`}/>
                  <input name="skills" value={skill.skills} onChange={(e) => handleItemChange('skills', skill.id, e)} placeholder="Skills (comma-separated)" className={inputClasses}/>
                  <button onClick={() => handleRemoveItem('skills', skill.id)} className="text-red-500 dark:text-red-400 mt-2 text-sm hover:underline">Remove</button>
              </div>
            ))}
            <button onClick={() => handleAddItem<CategorizedSkill>('skills', {id: `skill${Date.now()}`, category: '', skills: ''})} className="text-blue-600 dark:text-blue-400 font-medium">+ Add Skill Category</button>
          </div>
        </div>
        {/* Preview and Controls Section */}
        <div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 no-print transition-colors duration-200">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Preview & Export</h2>
              

              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">Export as PDF</button>
                    <button onClick={handleExportWord} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Export as Word</button>
                    <button onClick={() => setIsPreviewFullScreen(true)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Enlarge preview">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 1v-4m0 0h-4m4 0l-5 5" />
                        </svg>
                    </button>
                  </div>
                  <button onClick={() => onAnalyze(resumeData)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Check ATS Score</button>
              </div>
          </div>
          <div id="print-area" className="rounded-lg shadow-lg overflow-hidden">
            <ResumePreview />
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumeBuilder;
