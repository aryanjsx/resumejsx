
import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import ResumeBuilder from './components/ResumeBuilder';
import ATSChecker from './components/ATSChecker';
import JDMatcher from './components/JDMatcher';
import ResumeRewriter from './components/ResumeRewriter';
import { ResumeData } from './types';

export type Module = 'builder' | 'ats' | 'jd' | 'rewriter';

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<Module>('builder');
  const [resumeForAnalysis, setResumeForAnalysis] = useState<string>('');

  const handleNavigateToChecker = (resumeData: ResumeData) => {
    let resumeText = `${resumeData.personalInfo.name}\n${resumeData.personalInfo.location} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.email}\nLinkedIn: ${resumeData.personalInfo.linkedin} | Portfolio: ${resumeData.personalInfo.portfolio}\n\n`;
    
    if (resumeData.summary) {
      resumeText += `SUMMARY\n${resumeData.summary}\n\n`;
    }

    if (resumeData.experience.length > 0) {
      resumeText += 'EXPERIENCE\n';
      resumeData.experience.forEach(exp => {
        resumeText += `${exp.role} | ${exp.company}, ${exp.location} (${exp.startDate} - ${exp.endDate})\n${exp.description}\n\n`;
      });
    }
    
    if (resumeData.education.length > 0) {
      resumeText += 'EDUCATION\n';
      resumeData.education.forEach(edu => {
        resumeText += `${edu.degree}, ${edu.institution}, ${edu.location} (${edu.startDate} - ${edu.endDate}) - GPA: ${edu.gpa}\n\n`;
      });
    }

    if (resumeData.projects.length > 0) {
      resumeText += 'PROJECTS\n';
      resumeData.projects.forEach(proj => {
          resumeText += `${proj.title} | ${proj.technologies} (${proj.startDate} - ${proj.endDate})\n${proj.description}\nLinks: ${proj.liveLink} ${proj.githubLink}\n\n`;
      });
    }

    if (resumeData.certifications.length > 0) {
        resumeText += 'CERTIFICATIONS\n';
        resumeData.certifications.forEach(cert => {
            resumeText += `${cert.name} - ${cert.issuer} (${cert.date})\n`;
        });
        resumeText += '\n';
    }

    if (resumeData.skills.length > 0) {
        resumeText += 'SKILLS\n';
        resumeData.skills.forEach(skillCat => {
          resumeText += `${skillCat.category}: ${skillCat.skills}\n`;
        });
    }

    setResumeForAnalysis(resumeText.trim());
    setActiveModule('ats');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <Header activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="p-4 md:p-8">
        {activeModule === 'builder' && <ResumeBuilder onAnalyze={handleNavigateToChecker} />}
        {activeModule === 'ats' && <ATSChecker initialResumeText={resumeForAnalysis} />}
        {activeModule === 'jd' && <JDMatcher initialResumeText={resumeForAnalysis} />}
        {activeModule === 'rewriter' && <ResumeRewriter initialResumeText={resumeForAnalysis} />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
