import React, { useState } from 'react';
import { rewriteResume } from '../services/geminiService';
import { RewrittenResume } from '../types';
import Loader from './Loader';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle, TabStopType, TabStopPosition } from 'docx';
import saveAs from 'file-saver';
import { extractRawText } from 'mammoth';

const ResumeRewriter: React.FC<{ initialResumeText?: string }> = ({ initialResumeText }) => {
  const [jdText, setJdText] = useState('');
  const [resumeContent, setResumeContent] = useState<string | { data: string; mimeType: string }>(initialResumeText || '');
  const [isUsingBuilderResume, setIsUsingBuilderResume] = useState(!!initialResumeText);
  const [fileName, setFileName] = useState<string>('');
  const [rewrittenResult, setRewrittenResult] = useState<RewrittenResume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      const fileNameLower = file.name.toLowerCase();
      const isAllowed =
        allowedMimeTypes.includes(file.type) ||
        fileNameLower.endsWith('.pdf') ||
        fileNameLower.endsWith('.doc') ||
        fileNameLower.endsWith('.docx') ||
        fileNameLower.endsWith('.txt');

      if (!isAllowed) {
        setError('Unsupported file type. Please upload Word, PDF, or TXT.');
        setFileName('');
        return;
      }
      
      setFileName(file.name);
      setError(null);

      if (fileNameLower.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          try {
            const result = await extractRawText({ arrayBuffer });
            setResumeContent(result.value);
            setIsUsingBuilderResume(false);
          } catch (err) {
            console.error(err);
            setError('Failed to extract text from Word document.');
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'text/plain' || fileNameLower.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setResumeContent(e.target?.result as string);
          setIsUsingBuilderResume(false);
        };
        reader.readAsText(file);
      } else {
        // PDF
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const base64Data = dataUrl.split(',')[1];
          if (!base64Data) {
              setError('Failed to read file content.');
              setFileName('');
              return;
          }
          setResumeContent({ data: base64Data, mimeType: file.type || 'application/pdf' });
          setIsUsingBuilderResume(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRewrite = async () => {
    if (!jdText.trim() || !resumeContent || (typeof resumeContent === 'string' && !resumeContent.trim())) {
      setError('Please provide both the job description and your resume.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRewrittenResult(null);
    try {
      const result = await rewriteResume(resumeContent, jdText);
      setRewrittenResult(result);
    } catch (e) {
      setError('An error occurred during rewriting. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
      navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleExportWord = () => {
      if (!rewrittenResult) return;
      const { personalInfo, summary, experience, education, projects, certifications, skills } = rewrittenResult;
  
      const createSectionTitle = (text: string) => {
        return new Paragraph({
          children: [new TextRun({ text: text.toUpperCase(), bold: true, color: "1155cc", size: 24 })],
          border: {
            bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 },
          },
          spacing: { after: 200, before: 200 },
        });
      };
      
      const docChildren: Paragraph[] = [
        // Personal Info
        new Paragraph({
            children: [new TextRun({ text: personalInfo.name || "[Name]", bold: true, size: 48 })],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [new TextRun({ 
                text: [personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin].filter(Boolean).join(' | '), 
                size: 22 
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),
      ];
      
      // Summary
      if (summary?.content) {
        docChildren.push(createSectionTitle('Professional Summary'));
        docChildren.push(new Paragraph({ text: summary.content, spacing: { after: 200 } }));
      }
  
      // Skills (Bullet Points)
      if (skills?.finalList) {
        docChildren.push(createSectionTitle('Skills'));
        skills.finalList.split('\n').filter(line => line.trim()).forEach(line => {
            const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
             docChildren.push(new Paragraph({
                text: cleanLine,
                bullet: { level: 0 },
                indent: { left: 720 },
            }));
        });
        docChildren.push(new Paragraph(""));
      }
  
      // Experience (Paragraphs)
      if (experience && experience.length > 0) {
        docChildren.push(createSectionTitle('Work Experience'));
        experience.forEach(exp => {
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `${exp.role} | ${exp.company}${exp.location ? `, ${exp.location}` : ''}`, bold: true, size: 24 }),
                    new TextRun({ text: `\t${exp.date || ''}`, bold: true, size: 24 }),
                ],
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                spacing: { before: 100 },
            }));
            
            // Add description as a paragraph
            docChildren.push(new Paragraph({
                text: exp.rewrittenDescription,
                spacing: { before: 60, after: 60 },
                alignment: AlignmentType.BOTH
            }));
            
            docChildren.push(new Paragraph("")); // Spacer
        });
      }

      // Education
      if (education && education.length > 0) {
          docChildren.push(createSectionTitle('Education'));
          education.forEach(edu => {
              docChildren.push(new Paragraph({
                  children: [
                      new TextRun({ text: `${edu.institution}, ${edu.location}`, bold: true, size: 22 }),
                      new TextRun({ text: `\t${edu.startDate} – ${edu.endDate}` }),
                  ],
                  tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              }));
              docChildren.push(new Paragraph({
                  children: [
                      new TextRun({ text: edu.degree }),
                      ...(edu.gpa ? [new TextRun({ text: `\tCGPA: ${edu.gpa}` })] : []),
                  ],
                   tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              }));
              docChildren.push(new Paragraph(""));
          });
      }

      // Projects (Paragraphs)
      if (projects && projects.length > 0) {
          docChildren.push(createSectionTitle('Projects'));
          projects.forEach(proj => {
             docChildren.push(new Paragraph({
              children: [
                new TextRun({ text: `${proj.title} | `, bold: true, size: 22 }),
                new TextRun({ text: proj.technologies, size: 20 }),
                new TextRun({ text: `\t${proj.startDate} – ${proj.endDate}` }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
             }));
             
             if (proj.description) {
                 docChildren.push(new Paragraph({
                     text: proj.description,
                     spacing: { before: 60, after: 60 },
                     alignment: AlignmentType.BOTH
                 }));
             }
              docChildren.push(new Paragraph(""));
          });
      }

      // Certifications
      if (certifications && certifications.length > 0) {
          docChildren.push(createSectionTitle('Certifications'));
          certifications.forEach(cert => {
              docChildren.push(new Paragraph({
                  children: [
                      new TextRun({ text: `${cert.name} - `, bold: true, size: 22 }),
                      new TextRun({ text: cert.issuer, size: 22 }),
                      new TextRun({ text: `\t${cert.date}` }),
                  ],
                  tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              }));
          });
      }
  
      const doc = new Document({
          sections: [{
              properties: {},
              children: docChildren,
          }],
      });
  
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Optimized_Resume.docx`);
      });
  };

  // Simple clean preview component
  const CleanPreview = () => {
      if (!rewrittenResult) return null;
      const { personalInfo, summary, experience, education, projects, certifications, skills } = rewrittenResult;

      return (
          <div className="bg-white text-black p-8 max-w-[210mm] mx-auto font-sans">
              <div className="text-center mb-6 border-b pb-4 border-gray-300">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{personalInfo.name}</h1>
                  <p className="text-gray-600">
                      {[personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.portfolio].filter(Boolean).join(' | ')}
                  </p>
              </div>

              {summary?.content && (
                  <div className="mb-6">
                      <h2 className="text-lg font-bold text-blue-800 border-b border-gray-300 mb-2 uppercase tracking-wider">Professional Summary</h2>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{summary.content}</p>
                  </div>
              )}

              {skills?.finalList && (
                  <div className="mb-6">
                      <h2 className="text-lg font-bold text-blue-800 border-b border-gray-300 mb-2 uppercase tracking-wider">Skills</h2>
                      <ul className="list-disc list-outside ml-4 text-gray-800 leading-relaxed">
                          {skills.finalList.split('\n').map((line, i) => {
                              const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
                              return cleanLine ? <li key={i}>{cleanLine}</li> : null;
                          })}
                      </ul>
                  </div>
              )}

              {experience && experience.length > 0 && (
                  <div className="mb-6">
                      <h2 className="text-lg font-bold text-blue-800 border-b border-gray-300 mb-4 uppercase tracking-wider">Work Experience</h2>
                      {experience.map((exp, idx) => (
                          <div key={idx} className="mb-4">
                              <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-bold text-gray-800 text-md">
                                    {exp.role} | {exp.company}{exp.location ? `, ${exp.location}` : ''}
                                </h3>
                                <span className="text-gray-700 font-bold text-sm">{exp.date}</span>
                              </div>
                              {/* Render as Paragraph */}
                              <p className="text-gray-700 text-sm leading-relaxed mt-2 text-justify">
                                  {exp.rewrittenDescription}
                              </p>
                          </div>
                      ))}
                  </div>
              )}

              {education && education.length > 0 && (
                  <div className="mb-6">
                      <h2 className="text-lg font-bold text-blue-800 border-b border-gray-300 mb-4 uppercase tracking-wider">Education</h2>
                      {education.map((edu, idx) => (
                          <div key={idx} className="mb-2">
                              <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-gray-800">{edu.institution}, {edu.location}</h3>
                                  <span className="text-sm text-gray-600">{edu.startDate} – {edu.endDate}</span>
                              </div>
                              <div className="flex justify-between">
                                  <p className="text-gray-700">{edu.degree}</p>
                                  {edu.gpa && <span className="text-sm text-gray-600">GPA: {edu.gpa}</span>}
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {projects && projects.length > 0 && (
                  <div className="mb-6">
                      <h2 className="text-lg font-bold text-blue-800 border-b border-gray-300 mb-4 uppercase tracking-wider">Projects</h2>
                      {projects.map((proj, idx) => (
                          <div key={idx} className="mb-4">
                              <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-gray-800">{proj.title} <span className="font-normal text-gray-600 text-sm">| {proj.technologies}</span></h3>
                                  <span className="text-sm text-gray-600">{proj.startDate} – {proj.endDate}</span>
                              </div>
                              {proj.description && (
                                  /* Render as Paragraph */
                                  <p className="text-gray-700 text-sm leading-relaxed mt-2 text-justify">
                                      {proj.description}
                                  </p>
                              )}
                          </div>
                      ))}
                  </div>
              )}

              {certifications && certifications.length > 0 && (
                  <div className="mb-6">
                      <h2 className="text-lg font-bold text-blue-800 border-b border-gray-300 mb-4 uppercase tracking-wider">Certifications</h2>
                      {certifications.map((cert, idx) => (
                          <div key={idx} className="mb-1 flex justify-between">
                              <span className="font-bold text-gray-800">{cert.name} <span className="font-normal text-gray-600">- {cert.issuer}</span></span>
                              <span className="text-sm text-gray-600">{cert.date}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  return (
    <>
    {/* Full Screen Preview Modal */}
    {isPreviewOpen && rewrittenResult && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setIsPreviewOpen(false)}>
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="font-bold text-lg text-gray-800">Resume Preview</h3>
                    <div className="flex gap-3">
                        <button onClick={handleExportWord} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
                            Download .DOCX
                        </button>
                        <button onClick={() => setIsPreviewOpen(false)} className="text-gray-500 hover:text-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto bg-gray-100 p-8" id="print-area-rewritten">
                   <div className="shadow-lg bg-white">
                        <CleanPreview />
                   </div>
                </div>
            </div>
        </div>
    )}

    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 no-print">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Smart Resume Rewriter</h2>
                <p className="text-gray-600">Automatically rewrite your resume to target a specific job description for maximum ATS impact.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-2">Target Job Description (JD)</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full h-64 p-3 border rounded-md focus:ring-2 focus:ring-purple-500 transition"
              placeholder="Paste the full job description here..."
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Your Current Resume</label>
            {isUsingBuilderResume ? (
                 <div className="w-full h-64 p-3 border rounded-md bg-gray-50 flex flex-col justify-center items-center text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-500 mb-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-700 font-medium">Using resume from Builder</p>
                    <button 
                      onClick={() => { 
                        setIsUsingBuilderResume(false); 
                        setResumeContent(''); 
                        setFileName(''); 
                      }} 
                      className="text-sm text-purple-600 hover:underline mt-4 font-medium"
                    >
                      Upload a different file
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file-rewrite" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            {fileName ? (
                              <p className="mb-2 text-sm text-gray-700 font-semibold truncate">{fileName}</p>
                            ) : (
                              <>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                <p className="text-xs text-gray-500">PDF, DOCX, TXT</p>
                              </>
                            )}
                        </div>
                        <input id="dropzone-file-rewrite" type="file" className="hidden" accept=".doc,.docx,.pdf,.txt" onChange={handleFileChange} />
                    </label>
                </div>
            )}
          </div>
        </div>
        <button
          onClick={handleRewrite}
          disabled={isLoading}
          className="mt-6 w-full bg-purple-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-purple-700 disabled:bg-purple-300 transition-colors flex items-center justify-center shadow-lg"
        >
          {isLoading ? <Loader /> : 'Rewrite My Resume'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {rewrittenResult && (
        <div className="space-y-8 animate-fade-in no-print">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                <h3 className="text-lg font-bold text-gray-800">Optimization Complete</h3>
                <button 
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-medium transition shadow"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download / Preview
                </button>
            </div>

            {/* Summary Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Optimized Summary</h3>
                        <p className="text-sm text-gray-500 italic mt-1">{rewrittenResult.summary.reasoning}</p>
                    </div>
                    <button 
                        onClick={() => copyToClipboard(rewrittenResult.summary.content, 'summary')}
                        className="text-sm flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                    >
                        {copiedSection === 'summary' ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <div className="p-4 bg-gray-50 rounded text-gray-800 leading-relaxed whitespace-pre-wrap border border-gray-100">
                    {rewrittenResult.summary.content}
                </div>
            </div>

             {/* Skills Section */}
             <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Targeted Skills</h3>
                    <button 
                        onClick={() => copyToClipboard(rewrittenResult.skills.finalList, 'skills')}
                        className="text-sm flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                    >
                        {copiedSection === 'skills' ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <div className="mb-4">
                    <p className="font-medium text-gray-700 mb-2">Optimized List (Bullet Points):</p>
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 text-gray-800 whitespace-pre-wrap">
                        {rewrittenResult.skills.finalList}
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    {rewrittenResult.skills.added.length > 0 && (
                        <div className="flex-1">
                            <span className="text-xs font-bold text-green-600 uppercase">Added Keywords</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {rewrittenResult.skills.added.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {rewrittenResult.skills.removed.length > 0 && (
                         <div className="flex-1">
                            <span className="text-xs font-bold text-red-500 uppercase">Removed (Irrelevant)</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {rewrittenResult.skills.removed.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Experience Section */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">Rewritten Experience</h3>
                <div className="space-y-6">
                    {rewrittenResult.experience.map((exp, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800">{exp.role} | {exp.company}</h4>
                                    <p className="text-sm text-gray-600 font-medium">{exp.date || ''} {exp.location ? `• ${exp.location}` : ''}</p>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(exp.rewrittenDescription, `exp-${idx}`)}
                                    className="text-sm flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                                >
                                    {copiedSection === `exp-${idx}` ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                                        <p className="text-sm font-semibold text-blue-800 mb-2">Optimized Content (Paragraph):</p>
                                        <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed text-justify">
                                            {exp.rewrittenDescription}
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-1">
                                     <div className="p-4 bg-green-50 rounded border border-green-100 h-full">
                                        <p className="text-sm font-semibold text-green-800 mb-2">Improvements Made:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {exp.improvements.map((imp, i) => (
                                                <li key={i} className="text-xs text-gray-700">{imp}</li>
                                            ))}
                                        </ul>
                                     </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             {/* Projects Section */}
             <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 mt-8 px-2">Rewritten Projects</h3>
                <div className="space-y-6">
                    {rewrittenResult.projects.map((proj, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800">{proj.title}</h4>
                                    <p className="text-gray-600 font-medium">{proj.technologies}</p>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(proj.description, `proj-${idx}`)}
                                    className="text-sm flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                                >
                                    {copiedSection === `proj-${idx}` ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            
                             <div className="p-4 bg-blue-50 rounded border border-blue-100">
                                <p className="text-sm font-semibold text-blue-800 mb-2">Optimized Content (Paragraph):</p>
                                <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed text-justify">
                                    {proj.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ResumeRewriter;