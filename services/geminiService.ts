import { GoogleGenAI, Type } from "@google/genai";
import { ATSScore, JDMatchAnalysis, ContentSuggestionResponse, RewrittenResume, ParsedResumeWithTemplate } from '../types';

// FIX: Initialize the GoogleGenAI client directly with the environment variable as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const atsSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER, description: "Overall ATS score from 0-100" },
    breakdown: {
      type: Type.ARRAY,
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
    const resumePart = typeof resume === 'string'
        ? { text: `Original Resume:\n---\n${resume}\n---` }
        : { inlineData: { data: resume.data, mimeType: resume.mimeType } };

1. **Extract ALL Resume Content:** Parse the resume completely and extract:
   - Personal Information (name, email, phone, location, LinkedIn URL, portfolio URL)
   - Professional Summary/Objective
   - Work Experience (each entry with company, role, location, start date, end date, and full description with bullet points preserved)
   - Education (each entry with institution, degree, location, dates, GPA if present)
   - Projects (title, description, technologies, dates, links if present)
   - Skills (categorized if the resume has categories, otherwise create logical categories)
   - Certifications (name, issuer, date)

2. **Analyze the Template Design:** Carefully examine the visual design and layout of the resume:
   - Layout: Is it single-column, two-column, sidebar-left, or sidebar-right?
   - Header Style: How is the name/contact displayed - centered, left-aligned, banner style, or minimal?
   - Color Scheme: Identify the primary, secondary, accent, background, and text colors (provide hex codes)
   - Font Style: What fonts are used for headings and body? Are headings small, medium, or large?
   - Section Styling: What type of dividers are used between sections? What bullet style? How much spacing?
   - Overall Theme: Give a descriptive name to this template style

Generate unique IDs for each experience, education, project, skill category, and certification using format like "exp_1", "edu_1", "proj_1", "skill_1", "cert_1".

For any missing fields, use empty strings. Be thorough in capturing all content exactly as it appears.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: resumeFile.data, mimeType: resumeFile.mimeType } }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: parsedResumeWithTemplateSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ParsedResumeWithTemplate;
}
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { text: prompt },
                { text: `Target Job Description:\n---\n${jdText}\n---` },
                resumePart,
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: rewrittenResumeSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as RewrittenResume;
}

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

const contentSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of suggested text content for the resume."
        }
    },
    required: ["suggestions"]
};

const rewrittenResumeSchema = {
    type: Type.OBJECT,
    properties: {
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                portfolio: { type: Type.STRING },
            },
            required: ["name"]
        },
        summary: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: "The completely rewritten professional summary." },
                reasoning: { type: Type.STRING, description: "Why this summary is better for the JD." }
            },
            required: ["content", "reasoning"]
        },
        experience: {
            type: Type.ARRAY,
            description: "List of rewritten work experience entries.",
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING, description: "Company name from original resume." },
                    role: { type: Type.STRING, description: "Role/Title." },
                    location: { type: Type.STRING, description: "Location of the company." },
                    date: { type: Type.STRING, description: "Employment period (e.g. 'June 2024 - Present')." },
                    rewrittenDescription: { type: Type.STRING, description: "The optimized description in paragraph format." },
                    improvements: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "List of specific improvements made (e.g. 'Added keyword X')."
                    }
                },
                required: ["company", "role", "location", "date", "rewrittenDescription", "improvements"]
            }
        },
        education: {
             type: Type.ARRAY,
             items: {
                 type: Type.OBJECT,
                 properties: {
                     institution: { type: Type.STRING },
                     degree: { type: Type.STRING },
                     location: { type: Type.STRING },
                     startDate: { type: Type.STRING },
                     endDate: { type: Type.STRING },
                     gpa: { type: Type.STRING }
                 },
                 required: ["institution", "degree"]
             }
        },
        projects: {
             type: Type.ARRAY,
             items: {
                 type: Type.OBJECT,
                 properties: {
                     title: { type: Type.STRING },
                     technologies: { type: Type.STRING },
                     startDate: { type: Type.STRING },
                     endDate: { type: Type.STRING },
                     description: { type: Type.STRING, description: "Rewritten description in paragraph format." },
                     liveLink: { type: Type.STRING },
                     githubLink: { type: Type.STRING }
                 },
                 required: ["title", "description"]
             }
        },
        certifications: {
             type: Type.ARRAY,
             items: {
                 type: Type.OBJECT,
                 properties: {
                     name: { type: Type.STRING },
                     issuer: { type: Type.STRING },
                     date: { type: Type.STRING }
                 },
                 required: ["name"]
             }
        },
        skills: {
            type: Type.OBJECT,
            properties: {
                finalList: { type: Type.STRING, description: "The final optimized list of skills formatted as bullet points (e.g., '• Category: Skill 1, Skill 2')." },
                added: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills added based on JD." },
                removed: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Irrelevant skills removed." }
            },
            required: ["finalList", "added", "removed"]
        }
    },
    required: ["personalInfo", "summary", "experience", "education", "projects", "certifications", "skills"]
};

const parsedResumeWithTemplateSchema = {
    type: Type.OBJECT,
    properties: {
        resumeData: {
            type: Type.OBJECT,
            properties: {
                personalInfo: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        location: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        portfolio: { type: Type.STRING },
                    },
                    required: ["name", "email", "phone", "location", "linkedin", "portfolio"]
                },
                summary: { type: Type.STRING },
                experience: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            company: { type: Type.STRING },
                            role: { type: Type.STRING },
                            location: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["id", "company", "role", "location", "startDate", "endDate", "description"]
                    }
                },
                education: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            institution: { type: Type.STRING },
                            degree: { type: Type.STRING },
                            location: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            gpa: { type: Type.STRING },
                        },
                        required: ["id", "institution", "degree", "location", "startDate", "endDate", "gpa"]
                    }
                },
                projects: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            technologies: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            liveLink: { type: Type.STRING },
                            githubLink: { type: Type.STRING },
                        },
                        required: ["id", "title", "description", "technologies", "startDate", "endDate", "liveLink", "githubLink"]
                    }
                },
                skills: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            category: { type: Type.STRING },
                            skills: { type: Type.STRING },
                        },
                        required: ["id", "category", "skills"]
                    }
                },
                certifications: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            issuer: { type: Type.STRING },
                            date: { type: Type.STRING },
                        },
                        required: ["id", "name", "issuer", "date"]
                    }
                },
            },
            required: ["personalInfo", "summary", "experience", "education", "projects", "skills", "certifications"]
        },
        templateStyle: {
            type: Type.OBJECT,
            properties: {
                layout: { type: Type.STRING, description: "Layout type: single-column, two-column, sidebar-left, or sidebar-right" },
                headerStyle: { type: Type.STRING, description: "Header style: centered, left-aligned, banner, or minimal" },
                colorScheme: {
                    type: Type.OBJECT,
                    properties: {
                        primary: { type: Type.STRING, description: "Primary color in hex format (e.g., #2563eb)" },
                        secondary: { type: Type.STRING, description: "Secondary color in hex format" },
                        accent: { type: Type.STRING, description: "Accent color in hex format" },
                        background: { type: Type.STRING, description: "Background color in hex format" },
                        text: { type: Type.STRING, description: "Text color in hex format" },
                    },
                    required: ["primary", "secondary", "accent", "background", "text"]
                },
                fontStyle: {
                    type: Type.OBJECT,
                    properties: {
                        headingFont: { type: Type.STRING, description: "Font family for headings (e.g., Georgia, Arial, Playfair Display)" },
                        bodyFont: { type: Type.STRING, description: "Font family for body text" },
                        headingSize: { type: Type.STRING, description: "Heading size: small, medium, or large" },
                    },
                    required: ["headingFont", "bodyFont", "headingSize"]
                },
                sectionStyle: {
                    type: Type.OBJECT,
                    properties: {
                        dividerType: { type: Type.STRING, description: "Section divider: line, dots, none, or thick-line" },
                        bulletStyle: { type: Type.STRING, description: "Bullet style: circle, square, dash, arrow, or none" },
                        sectionSpacing: { type: Type.STRING, description: "Section spacing: compact, normal, or spacious" },
                    },
                    required: ["dividerType", "bulletStyle", "sectionSpacing"]
                },
                overallTheme: { type: Type.STRING, description: "Theme name like 'Modern Professional', 'Classic Academic', 'Creative Designer'" },
                description: { type: Type.STRING, description: "Detailed description of the template's visual style and characteristics" },
            },
            required: ["layout", "headerStyle", "colorScheme", "fontStyle", "sectionStyle", "overallTheme", "description"]
        }
    },
    required: ["resumeData", "templateStyle"]
};

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

const contentSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of suggested text content for the resume."
        }
    },
    required: ["suggestions"]
};

const rewrittenResumeSchema = {
    type: Type.OBJECT,
    properties: {
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                portfolio: { type: Type.STRING },
            },
            required: ["name"]
        },
        summary: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING, description: "The completely rewritten professional summary." },
                reasoning: { type: Type.STRING, description: "Why this summary is better for the JD." }
            },
            required: ["content", "reasoning"]
        },
        experience: {
            type: Type.ARRAY,
            description: "List of rewritten work experience entries.",
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING, description: "Company name from original resume." },
                    role: { type: Type.STRING, description: "Role/Title." },
                    location: { type: Type.STRING, description: "Location of the company." },
                    date: { type: Type.STRING, description: "Employment period (e.g. 'June 2024 - Present')." },
                    rewrittenDescription: { type: Type.STRING, description: "The optimized description in paragraph format." },
                    improvements: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "List of specific improvements made (e.g. 'Added keyword X')."
                    }
                },
                required: ["company", "role", "location", "date", "rewrittenDescription", "improvements"]
            }
        },
        education: {
             type: Type.ARRAY,
             items: {
                 type: Type.OBJECT,
                 properties: {
                     institution: { type: Type.STRING },
                     degree: { type: Type.STRING },
                     location: { type: Type.STRING },
                     startDate: { type: Type.STRING },
                     endDate: { type: Type.STRING },
                     gpa: { type: Type.STRING }
                 },
                 required: ["institution", "degree"]
             }
        },
        projects: {
             type: Type.ARRAY,
             items: {
                 type: Type.OBJECT,
                 properties: {
                     title: { type: Type.STRING },
                     technologies: { type: Type.STRING },
                     startDate: { type: Type.STRING },
                     endDate: { type: Type.STRING },
                     description: { type: Type.STRING, description: "Rewritten description in paragraph format." },
                     liveLink: { type: Type.STRING },
                     githubLink: { type: Type.STRING }
                 },
                 required: ["title", "description"]
             }
        },
        certifications: {
             type: Type.ARRAY,
             items: {
                 type: Type.OBJECT,
                 properties: {
                     name: { type: Type.STRING },
                     issuer: { type: Type.STRING },
                     date: { type: Type.STRING }
                 },
                 required: ["name"]
             }
        },
        skills: {
            type: Type.OBJECT,
            properties: {
                finalList: { type: Type.STRING, description: "The final optimized list of skills formatted as bullet points (e.g., '• Category: Skill 1, Skill 2')." },
                added: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills added based on JD." },
                removed: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Irrelevant skills removed." }
            },
            required: ["finalList", "added", "removed"]
        }
    },
    required: ["personalInfo", "summary", "experience", "education", "projects", "certifications", "skills"]
};

const parsedResumeWithTemplateSchema = {
    type: Type.OBJECT,
    properties: {
        resumeData: {
            type: Type.OBJECT,
            properties: {
                personalInfo: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        location: { type: Type.STRING },
                        linkedin: { type: Type.STRING },
                        portfolio: { type: Type.STRING },
                    },
                    required: ["name", "email", "phone", "location", "linkedin", "portfolio"]
                },
                summary: { type: Type.STRING },
                experience: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            company: { type: Type.STRING },
                            role: { type: Type.STRING },
                            location: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ["id", "company", "role", "location", "startDate", "endDate", "description"]
                    }
                },
                education: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            institution: { type: Type.STRING },
                            degree: { type: Type.STRING },
                            location: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            gpa: { type: Type.STRING },
                        },
                        required: ["id", "institution", "degree", "location", "startDate", "endDate", "gpa"]
                    }
                },
                projects: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            technologies: { type: Type.STRING },
                            startDate: { type: Type.STRING },
                            endDate: { type: Type.STRING },
                            liveLink: { type: Type.STRING },
                            githubLink: { type: Type.STRING },
                        },
                        required: ["id", "title", "description", "technologies", "startDate", "endDate", "liveLink", "githubLink"]
                    }
                },
                skills: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            category: { type: Type.STRING },
                            skills: { type: Type.STRING },
                        },
                        required: ["id", "category", "skills"]
                    }
                },
                certifications: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            issuer: { type: Type.STRING },
                            date: { type: Type.STRING },
                        },
                        required: ["id", "name", "issuer", "date"]
                    }
                },
            },
            required: ["personalInfo", "summary", "experience", "education", "projects", "skills", "certifications"]
        },
        templateStyle: {
            type: Type.OBJECT,
            properties: {
                layout: { type: Type.STRING, description: "Layout type: single-column, two-column, sidebar-left, or sidebar-right" },
                headerStyle: { type: Type.STRING, description: "Header style: centered, left-aligned, banner, or minimal" },
                colorScheme: {
                    type: Type.OBJECT,
                    properties: {
                        primary: { type: Type.STRING, description: "Primary color in hex format (e.g., #2563eb)" },
                        secondary: { type: Type.STRING, description: "Secondary color in hex format" },
                        accent: { type: Type.STRING, description: "Accent color in hex format" },
                        background: { type: Type.STRING, description: "Background color in hex format" },
                        text: { type: Type.STRING, description: "Text color in hex format" },
                    },
                    required: ["primary", "secondary", "accent", "background", "text"]
                },
                fontStyle: {
                    type: Type.OBJECT,
                    properties: {
                        headingFont: { type: Type.STRING, description: "Font family for headings (e.g., Georgia, Arial, Playfair Display)" },
                        bodyFont: { type: Type.STRING, description: "Font family for body text" },
                        headingSize: { type: Type.STRING, description: "Heading size: small, medium, or large" },
                    },
                    required: ["headingFont", "bodyFont", "headingSize"]
                },
                sectionStyle: {
                    type: Type.OBJECT,
                    properties: {
                        dividerType: { type: Type.STRING, description: "Section divider: line, dots, none, or thick-line" },
                        bulletStyle: { type: Type.STRING, description: "Bullet style: circle, square, dash, arrow, or none" },
                        sectionSpacing: { type: Type.STRING, description: "Section spacing: compact, normal, or spacious" },
                    },
                    required: ["dividerType", "bulletStyle", "sectionSpacing"]
                },
                overallTheme: { type: Type.STRING, description: "Theme name like 'Modern Professional', 'Classic Academic', 'Creative Designer'" },
                description: { type: Type.STRING, description: "Detailed description of the template's visual style and characteristics" },
            },
            required: ["layout", "headerStyle", "colorScheme", "fontStyle", "sectionStyle", "overallTheme", "description"]
        }
    },
    required: ["resumeData", "templateStyle"]
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
    model: "gemini-2.5-flash",
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
        model: "gemini-2.5-flash",
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

export const generateContentSuggestions = async (
    type: 'summary' | 'experience',
    context: { role?: string; company?: string; currentText?: string; resumeContext?: string }
): Promise<ContentSuggestionResponse> => {
    let prompt = "";

    if (type === 'summary') {
        prompt = `Act as a professional resume writer.
        Task: Write 3 distinct, impactful professional summaries for a resume.
        Context:
        ${context.resumeContext ? `Based on the following existing resume info: ${context.resumeContext}` : ''}
        ${context.currentText ? `Improve this existing summary: ${context.currentText}` : ''}

        The summaries should be concise (2-4 sentences), professional, and highlight key strengths.
        Return the result as a JSON object with a 'suggestions' array containing the 3 strings.`;
    } else {
        prompt = `Act as a professional resume writer.
        Task: Write 5 strong, quantifiable, action-oriented bullet points for a Work Experience section.
        Role: ${context.role || 'Professional'}
        Company: ${context.company || 'Company'}
        ${context.currentText ? `Context/Draft: ${context.currentText}` : ''}

        Use the STAR method (Situation, Task, Action, Result) where possible. Start with strong action verbs.
        Return the result as a JSON object with a 'suggestions' array containing the 5 strings.`;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: contentSuggestionSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ContentSuggestionResponse;
};

export const rewriteResume = async (resume: ResumeContent, jdText: string): Promise<RewrittenResume> => {
    const prompt = `Act as an expert Resume Rewriter and ATS Optimization Specialist.
    
    Your Task:
    1. **Strictly Preserve:** Parse the original resume and extract 'Personal Information', 'Education', and 'Certifications' EXACTLY as they appear. Do NOT change, summarize, or reformat these sections.
    2. **Rewrite & Optimize Core Sections:**
       - **Summary:** Write a powerful, hook-filled summary that immediately highlights experience relevant to the JD.
       - **Experience:** For each work experience entry found in the resume:
         - Keep the Company, Role, Location, and Dates (as a single string) the same.
         - REWRITE the description into a compelling, professional paragraph using the STAR method (Situation, Task, Action, Result). Do NOT use bullet points for description.
         - INTEGRATE keywords from the JD naturally.
         - Quantify achievements where possible.
       - **Projects:** For each project:
         - Keep the Title, Technologies, and Dates same.
         - REWRITE the description into a concise professional paragraph that highlights technical achievements and alignment with the JD. Do NOT use bullet points.
       - **Skills:** Curate a list of skills (categorized if possible) that combines the user's existing skills with relevant missing skills from the JD. Format the final list as bullet points (e.g., "• Category: Skill 1, Skill 2").
    
    Return the output as a JSON object containing all sections.
    `;

    const resumePart = typeof resume === 'string'
        ? { text: `Original Resume:\n---\n${resume}\n---` }
        : { inlineData: { data: resume.data, mimeType: resume.mimeType } };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { text: prompt },
                { text: `Target Job Description:\n---\n${jdText}\n---` },
                resumePart,
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: rewrittenResumeSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as RewrittenResume;
}

export const parseResumeWithTemplate = async (resumeFile: { data: string; mimeType: string }): Promise<ParsedResumeWithTemplate> => {
    const prompt = `You are an expert resume parser and design analyst. Analyze the uploaded resume document and:

1. **Extract ALL Resume Content:** Parse the resume completely and extract:
   - Personal Information (name, email, phone, location, LinkedIn URL, portfolio URL)
   - Professional Summary/Objective
   - Work Experience (each entry with company, role, location, start date, end date, and full description with bullet points preserved)
   - Education (each entry with institution, degree, location, dates, GPA if present)
   - Projects (title, description, technologies, dates, links if present)
   - Skills (categorized if the resume has categories, otherwise create logical categories)
   - Certifications (name, issuer, date)

2. **Analyze the Template Design:** Carefully examine the visual design and layout of the resume:
   - Layout: Is it single-column, two-column, sidebar-left, or sidebar-right?
   - Header Style: How is the name/contact displayed - centered, left-aligned, banner style, or minimal?
   - Color Scheme: Identify the primary, secondary, accent, background, and text colors (provide hex codes)
   - Font Style: What fonts are used for headings and body? Are headings small, medium, or large?
   - Section Styling: What type of dividers are used between sections? What bullet style? How much spacing?
   - Overall Theme: Give a descriptive name to this template style

Generate unique IDs for each experience, education, project, skill category, and certification using format like "exp_1", "edu_1", "proj_1", "skill_1", "cert_1".

For any missing fields, use empty strings. Be thorough in capturing all content exactly as it appears.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: resumeFile.data, mimeType: resumeFile.mimeType } }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: parsedResumeWithTemplateSchema,
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ParsedResumeWithTemplate;
}