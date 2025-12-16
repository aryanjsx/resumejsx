
  export interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
  }

  export interface WorkExperience {
    id: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }

  export interface Education {
    id:string;
    institution: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }

  export interface CategorizedSkill {
    id: string;
    category: string;
    skills: string; // Comma-separated list
  }

  export interface Project {
    id: string;
    title: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate: string;
    liveLink: string;
    githubLink: string;
  }

  export interface Certification {
    id: string;
    name: string;
    issuer: string;
    date: string;
  }

  export interface ResumeData {
    personalInfo: PersonalInfo;
    summary: string;
    experience: WorkExperience[];
    education: Education[];
    skills: CategorizedSkill[];
    projects: Project[];
    certifications: Certification[];
  }

  export interface ATSFeedback {
      issue: string;
      suggestion: string;
      severity: 'High' | 'Medium' | 'Low';
  }

  export interface ScoreBreakdownItem {
      category: string;
      score: number;
      maxScore: number;
  }

  export interface ATSScore {
      overallScore: number;
      breakdown: ScoreBreakdownItem[];
      feedback: ATSFeedback[];
  }

  export interface JDOptimizationSuggestion {
      area: string;
      suggestion: string;
      impact: 'High' | 'Medium' | 'Low';
  }

  export interface JDMatchAnalysis {
      matchPercentage: number;
      atsScoreAsPerJD: number;
      missingKeywords: string[];
      redundantKeywords: string[];
      suggestions: JDOptimizationSuggestion[];
  }

  export interface ContentSuggestionResponse {
      suggestions: string[];
  }

  export interface RewrittenExperience {
      company: string;
      role: string;
      location: string;
      date: string;
      originalDescription: string; // Context only, might be empty if file uploaded
      rewrittenDescription: string;
      improvements: string[]; // List of specific changes made (e.g., "Added keyword X")
  }

  export interface RewrittenResume {
      personalInfo: PersonalInfo;
      summary: {
          content: string;
          reasoning: string;
      };
      experience: RewrittenExperience[];
      education: Omit<Education, 'id'>[];
      projects: Omit<Project, 'id'>[];
      certifications: Omit<Certification, 'id'>[];
      skills: {
          finalList: string;
          added: string[];
          removed: string[];
      };
  }

  export interface ResumeTemplateStyle {
      layout: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';
      headerStyle: 'centered' | 'left-aligned' | 'banner' | 'minimal';
      colorScheme: {
          primary: string;
          secondary: string;
          accent: string;
          background: string;
          text: string;
      };
      fontStyle: {
          headingFont: string;
          bodyFont: string;
          headingSize: 'small' | 'medium' | 'large';
      };
      sectionStyle: {
          dividerType: 'line' | 'dots' | 'none' | 'thick-line';
          bulletStyle: 'circle' | 'square' | 'dash' | 'arrow' | 'none';
          sectionSpacing: 'compact' | 'normal' | 'spacious';
      };
      overallTheme: string; // e.g., "Modern Professional", "Classic Academic", "Creative Designer"
      description: string; // AI-generated description of the template
  }

  export interface ParsedResumeWithTemplate {
      resumeData: ResumeData;
      templateStyle: ResumeTemplateStyle;
  }