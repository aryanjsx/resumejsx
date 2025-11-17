import React, { useState, useEffect, ChangeEvent } from 'react';
import { ResumeData, PersonalInfo, WorkExperience, Education, CategorizedSkill, Project, Certification } from '../types';
import { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, TabStopPosition } from 'docx';
import saveAs from 'file-saver';

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

const ResumeBuilder: React.FC<{onAnalyze: (data: ResumeData) => void}> = ({onAnalyze}) => {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);

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

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const { personalInfo, summary, experience, education, projects, certifications, skills } = resumeData;

    const createSectionTitle = (text: string) => {
      return new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), bold: true, color: "1155cc", size: 24 })],
        border: {
          bottom: { color: "auto", space: 1, value: "single", size: 6 },
        },
        spacing: { after: 200 },
      });
    };
    
    const docChildren: Paragraph[] = [
      // Personal Info
      new Paragraph({
        children: [new TextRun({ text: personalInfo.name, bold: true, size: 52 })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: [ personalInfo.location, personalInfo.phone, personalInfo.email ].filter(Boolean).join(' | '),
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: [
            personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin}` : null,
            personalInfo.portfolio ? `Portfolio: ${personalInfo.portfolio}` : null
        ].filter(Boolean).join(' | '),
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];
    
    // Summary
    if (summary) {
        docChildren.push(createSectionTitle('Summary'));
        docChildren.push(new Paragraph({ text: summary, spacing: { after: 200 } }));
    }

    // Experience
    if (experience.length > 0) {
        docChildren.push(createSectionTitle('Experience'));
        experience.forEach(exp => {
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `${exp.role} | `, bold: true, size: 22 }),
                    new TextRun({ text: `${exp.company}, ${exp.location}`, size: 22 }),
                    new TextRun({ text: `\t${exp.startDate} – ${exp.endDate}` }),
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
            docChildren.push(new Paragraph("")); // Spacer
        });
    }
    
    // Education
    if (education.length > 0) {
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

    // Projects
    if (projects.length > 0) {
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
           proj.description.split('\n').filter(line => line.trim()).forEach(line => {
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

    // Certifications
    if (certifications.length > 0) {
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
        docChildren.push(new Paragraph(""));
    }

    // Skills
    if (skills.length > 0) {
        docChildren.push(createSectionTitle('Skills'));
        skills.forEach(skill => docChildren.push(new Paragraph({
          children: [
            new TextRun({ text: `${skill.category}: `, bold: true, size: 22 }),
            new TextRun({ text: skill.skills, size: 22 }),
          ],
        })));
    }


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
  
  const inputClasses = "p-2 border border-gray-300 rounded w-full focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition";
  const itemContainerClasses = "p-4 border border-gray-200 rounded mb-3";

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
  
  const ResumePreview = () => (
    <div className="p-4">
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 font-serif">{resumeData.personalInfo.name}</h1>
            <p className="text-sm text-gray-600 mt-2">
                {
                    [
                        resumeData.personalInfo.location,
                        resumeData.personalInfo.phone,
                        resumeData.personalInfo.email,
                        resumeData.personalInfo.linkedin ? `LinkedIn` : null,
                        resumeData.personalInfo.portfolio ? `Portfolio` : null
                    ].filter(Boolean).map((item, index, arr) => (
                        <React.Fragment key={index}>
                            {item.startsWith('LinkedIn') ? <a href={resumeData.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item}</a> : item.startsWith('Portfolio') ? <a href={resumeData.personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item}</a> : item}
                            {index < arr.length - 1 ? ' | ' : ''}
                        </React.Fragment>
                    ))
                }
            </p>
        </header>

        {renderSection('Summary', resumeData.summary, () => <></>)}
        
        {renderSection('Experience', resumeData.experience, (exp: WorkExperience) => (
            <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800">{exp.role} | <span className="font-semibold">{exp.company}, {exp.location}</span></h3>
                    <p className="text-sm text-gray-600 font-medium whitespace-nowrap">{exp.startDate} – {exp.endDate}</p>
                </div>
                <ul className="list-disc list-inside mt-1 text-gray-700 whitespace-pre-wrap">
                    {exp.description.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '').trim()}</li>)}
                </ul>
            </div>
        ))}
        
        {renderSection('Education', resumeData.education, (edu: Education) => (
            <div key={edu.id} className="mb-2">
                 <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800">{edu.institution}, {edu.location}</h3>
                    <p className="text-sm text-gray-600 font-medium">{edu.startDate} – {edu.endDate}</p>
                </div>
                <div className="flex justify-between items-start">
                   <p className="text-md text-gray-700">{edu.degree}</p>
                   {edu.gpa && <p className="text-sm text-gray-600">CGPA: {edu.gpa}</p>}
                </div>
            </div>
        ))}

        {renderSection('Projects', resumeData.projects, (proj: Project) => (
             <div key={proj.id} className="mb-4">
                <div className="flex justify-between items-start">
                     <h3 className="font-bold text-lg text-gray-800">{proj.title} | <span className="font-semibold text-sm">{proj.technologies}</span></h3>
                     <p className="text-sm text-gray-600 font-medium whitespace-nowrap">{proj.startDate} – {proj.endDate}</p>
                </div>
                 <ul className="list-disc list-inside mt-1 text-gray-700 whitespace-pre-wrap">
                    {proj.description.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '').trim()}</li>)}
                </ul>
            </div>
        ))}

        {renderSection('Certifications', resumeData.certifications, (cert: Certification) => (
            <div key={cert.id} className="mb-2">
                <div className="flex justify-between items-start">
                   <h3 className="font-bold text-lg text-gray-800">{cert.name} - <span className="font-semibold">{cert.issuer}</span></h3>
                   <p className="text-sm text-gray-600 font-medium">{cert.date}</p>
               </div>
            </div>
        ))}

        {renderSection('Skills', resumeData.skills, (skill: CategorizedSkill) => (
            <div key={skill.id} className="text-gray-700 mb-1 flex">
                <strong className="font-semibold w-48 flex-shrink-0">{skill.category}:</strong>
                <span>{skill.skills}</span>
            </div>
        ))}

    </div>
  );


  return (
    <>
      {/* Fullscreen Modal */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow-md no-print max-h-[85vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Resume Content</h2>
          {/* Personal Info */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" value={resumeData.personalInfo.name} onChange={handlePersonalInfoChange} placeholder="Full Name" className={inputClasses} />
              <input name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfoChange} placeholder="Email" className={inputClasses} />
              <input name="phone" value={resumeData.personalInfo.phone} onChange={handlePersonalInfoChange} placeholder="Phone" className={inputClasses} />
              <input name="location" value={resumeData.personalInfo.location} onChange={handlePersonalInfoChange} placeholder="Location" className={inputClasses} />
              <input name="linkedin" value={resumeData.personalInfo.linkedin} onChange={handlePersonalInfoChange} placeholder="LinkedIn URL" className={inputClasses} />
              <input name="portfolio" value={resumeData.personalInfo.portfolio} onChange={handlePersonalInfoChange} placeholder="Portfolio URL" className={inputClasses} />
            </div>
          </div>
          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Professional Summary</h3>
            <textarea value={resumeData.summary} onChange={handleSummaryChange} placeholder="Summary" className={`${inputClasses} h-24`} />
          </div>
          {/* Experience */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Work Experience</h3>
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
                  <textarea name="description" value={exp.description} onChange={(e) => handleItemChange('experience', exp.id, e)} placeholder="Description (use '-' for bullet points)" className={`${inputClasses} h-20`}/>
                  <button onClick={() => handleRemoveItem('experience', exp.id)} className="text-red-500 mt-2 text-sm hover:underline">Remove</button>
              </div>
            ))}
            <button onClick={() => handleAddItem<WorkExperience>('experience', {id: `exp${Date.now()}`, role: '', company: '', location: '', startDate: '', endDate: '', description: ''})} className="text-blue-600 font-medium">+ Add Experience</button>
          </div>
          {/* Education */}
          <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Education</h3>
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
                      <button onClick={() => handleRemoveItem('education', edu.id)} className="text-red-500 mt-2 text-sm hover:underline">Remove</button>
                  </div>
              ))}
              <button onClick={() => handleAddItem<Education>('education', {id: `edu${Date.now()}`, institution: '', degree: '', location: '', startDate: '', endDate: '', gpa: ''})} className="text-blue-600 font-medium">+ Add Education</button>
          </div>
          {/* Projects */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Projects</h3>
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
                    <button onClick={() => handleRemoveItem('projects', proj.id)} className="text-red-500 mt-2 text-sm hover:underline">Remove</button>
                </div>
            ))}
            <button onClick={() => handleAddItem<Project>('projects', {id: `proj${Date.now()}`, title: '', description: '', technologies: '', startDate: '', endDate: '', liveLink: '', githubLink: ''})} className="text-blue-600 font-medium">+ Add Project</button>
          </div>
          {/* Certifications */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Certifications</h3>
            {resumeData.certifications.map(cert => (
              <div key={cert.id} className={itemContainerClasses}>
                <input name="name" value={cert.name} onChange={(e) => handleItemChange('certifications', cert.id, e)} placeholder="Certification Name" className={`${inputClasses} mb-2`}/>
                <div className="grid grid-cols-2 gap-2">
                  <input name="issuer" value={cert.issuer} onChange={(e) => handleItemChange('certifications', cert.id, e)} placeholder="Issuing Organization" className={inputClasses}/>
                  <input name="date" value={cert.date} onChange={(e) => handleItemChange('certifications', cert.id, e)} placeholder="Date" className={inputClasses}/>
                </div>
                <button onClick={() => handleRemoveItem('certifications', cert.id)} className="text-red-500 mt-2 text-sm hover:underline">Remove</button>
              </div>
            ))}
            <button onClick={() => handleAddItem<Certification>('certifications', {id: `cert${Date.now()}`, name: '', issuer: '', date: ''})} className="text-blue-600 font-medium">+ Add Certification</button>
          </div>
          {/* Skills */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Skills</h3>
            {resumeData.skills.map(skill => (
              <div key={skill.id} className={itemContainerClasses}>
                  <input name="category" value={skill.category} onChange={(e) => handleItemChange('skills', skill.id, e)} placeholder="Skill Category (e.g., Backend)" className={`${inputClasses} mb-2`}/>
                  <input name="skills" value={skill.skills} onChange={(e) => handleItemChange('skills', skill.id, e)} placeholder="Skills (comma-separated)" className={inputClasses}/>
                  <button onClick={() => handleRemoveItem('skills', skill.id)} className="text-red-500 mt-2 text-sm hover:underline">Remove</button>
              </div>
            ))}
            <button onClick={() => handleAddItem<CategorizedSkill>('skills', {id: `skill${Date.now()}`, category: '', skills: ''})} className="text-blue-600 font-medium">+ Add Skill Category</button>
          </div>
        </div>
        {/* Preview and Controls Section */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 no-print">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Preview & Export</h2>
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">Export as PDF</button>
                    <button onClick={handleExportWord} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Export as Word</button>
                    <button onClick={() => setIsPreviewFullScreen(true)} className="p-2 text-gray-600 hover:text-blue-600" aria-label="Enlarge preview">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 1v-4m0 0h-4m4 0l-5 5" />
                        </svg>
                    </button>
                  </div>
                  <button onClick={() => onAnalyze(resumeData)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Check ATS Score</button>
              </div>
          </div>
          <div id="print-area" className="bg-white p-8 rounded-lg shadow-lg">
            <ResumePreview />
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumeBuilder;