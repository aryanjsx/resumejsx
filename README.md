# AI Resume Architect 🤖📄

### Your Personal AI-Powered Career Toolkit to Build, Analyze, and Optimize Your Resume for Success.

---

AI Resume Architect is an all-in-one, modern web application designed to empower job seekers in their career journey. Leveraging the power of Google's Gemini AI, this tool goes beyond a simple text editor, offering a suite of intelligent features to help you craft the perfect resume, pass through Applicant Tracking Systems (ATS), and tailor your application to specific job roles.

---

## ✨ Key Features

- **📝 Dynamic Resume Builder:**
  - Create a professional resume from scratch with dedicated sections for personal info, summary, experience, education, projects, skills, and certifications.
  - Enjoy a seamless experience with a live, real-time preview that updates as you type.
  - Your progress is automatically saved to your browser's local storage, so you'll never lose your work.

- **🔄 Smart Resume Rewriter:**
  - **Tailor to JD:** Automatically rewrite your entire resume to align perfectly with a specific job description.
  - **Optimized Formatting:** Converts experience and project descriptions into compelling **STAR-method paragraphs** for better readability and flow, while strictly formatting skills into clean **bullet points**.
  - **Keyword Integration:** Naturally weaves high-value keywords from the JD into your professional summary and experience.
  - **Strict Parsing:** Preserves your personal details, education history, and certifications exactly as they are.

- **📊 AI-Powered ATS Score Checker:**
  - Analyze your resume (supports **PDF**, **Word .docx**, and **TXT**) to get an instant ATS compatibility score from 0-100.
  - Receive a detailed score breakdown across key categories like **Format & Structure**, **Keywords & Content**, and **Clarity**.
  - Get actionable, prioritized feedback with clear suggestions to fix issues and improve your score.

- **🎯 Intelligent JD Matcher:**
  - Paste any job description and upload your resume to see how well you match the role.
  - Get a **Match Percentage** and a **JD-Specific ATS Score** to understand your alignment at a glance.
  - The AI identifies crucial **keywords to add** and irrelevant **keywords to remove**, helping you tailor your resume perfectly.
  - Receive high-impact suggestions to optimize each section of your resume for the target job.

- **📄 Multiple Export Options:**
  - Download your finished resume as a universally compatible **PDF**.
  - Export an editable **Microsoft Word (.docx)** document to make further tweaks offline.

- **✨ Sleek & Responsive UI:**
  - A clean, modern, and intuitive user interface built with **Tailwind CSS** that looks great on any device.

---

## 💻 Technology Stack

- **Frontend:** React, TypeScript
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`) for all AI-powered analysis.
- **Styling:** Tailwind CSS
- **Document Processing:**
  - `docx` for generating Word exports.
  - `mammoth.js` for robust text extraction from uploaded Word documents.
  - Browser Print API for PDF generation.
- **File Handling:** `file-saver`

---

# 🔐 Security Architecture (Production-Grade)

AI Resume Architect now implements full production-grade security.  
Since this project uses **Vite + React**, all security headers and controls are applied using a `vercel.json` file.

## 🔒 What’s Secured

### 1. Strong Security Headers
Implemented at the Vercel Edge:

- Strict-Transport-Security (HSTS)  
- X-Frame-Options  
- X-Content-Type-Options  
- Referrer-Policy  
- Permissions-Policy  
- Content-Security-Policy (CSP)

### 2. Protection Against:

- Clickjacking  
- Cross-Site Scripting (XSS)  
- Code Injection  
- Data Leakage via Referrer  
- Browser Feature Abuse  
- Unauthorized Framing  
- Mixed Content  
- MITM Attacks  

### 3. What This Means for Users
- Every request is HTTPS-only  
- No malicious iframes  
- No MIME-type spoofing  
- No browser permission misuse  
- No script injection  
- Better privacy & safer browsing  
- Enterprise-grade hardening

### 4. How It’s Implemented (vercel.json)
```
{
"headers": [
{
"source": "/(.*)",
"headers": [
{ "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
{ "key": "X-Frame-Options", "value": "DENY" },
{ "key": "X-Content-Type-Options", "value": "nosniff" },
{ "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
{ "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), usb=()" },
{
"key": "Content-Security-Policy",
"value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
}
]
}
]
}
```

---

## 🚀 Upcoming Features (Roadmap)

- **🤖 AI-Powered Content Suggestions**
- **✍️ Cover Letter Generator**
- **☁️ User Accounts & Cloud Storage**

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the issues page if you want to contribute.

---

## 📄 License

This project is licensed under the MIT License.