import React, { useState, useEffect } from 'react';
import { getATSScore } from '../services/geminiService';
import { ATSScore, ATSFeedback } from '../types';
import Loader from './Loader';
import ScoreGauge from './ScoreGauge';
import { extractRawText } from 'mammoth';

const ATSChecker: React.FC<{ initialResumeText?: string }> = ({ initialResumeText }) => {
  const [resumeContent, setResumeContent] = useState<string | { data: string; mimeType: string }>(initialResumeText || '');
  const [isUsingBuilderResume, setIsUsingBuilderResume] = useState(!!initialResumeText);
  const [fileName, setFileName] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ATSScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if(initialResumeText) {
        setResumeContent(initialResumeText);
        setIsUsingBuilderResume(true);
    }
  }, [initialResumeText]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ];
      const fileNameLower = file.name.toLowerCase();
      const isAllowed =
        allowedMimeTypes.includes(file.type) ||
        fileNameLower.endsWith('.pdf') ||
        fileNameLower.endsWith('.doc') ||
        fileNameLower.endsWith('.docx') ||
        fileNameLower.endsWith('.txt');

      if (!isAllowed) {
        setError('Unsupported file type. Please upload a Word, PDF, or TXT file.');
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
                  setError("Failed to read Word document.");
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


  const handleAnalyze = async () => {
    if (!resumeContent || (typeof resumeContent === 'string' && !resumeContent.trim())) {
      setError('Please upload your resume to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await getATSScore(resumeContent);
      setAnalysisResult(result);
    } catch (e) {
      setError('An error occurred during analysis. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: ATSFeedback['severity']) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 border-red-500';
      case 'medium': return 'bg-yellow-100 border-yellow-500';
      case 'low': return 'bg-blue-100 border-blue-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">ATS Score Checker</h2>
        <p className="text-gray-600 mb-6">Upload your resume to analyze its compatibility with Applicant Tracking Systems (ATS).</p>
        
        {isUsingBuilderResume ? (
             <div className="w-full h-64 p-3 border rounded-md bg-gray-50 flex flex-col justify-center items-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500 mb-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-700 font-medium">Resume from builder is ready for analysis.</p>
                <button 
                  onClick={() => { 
                    setIsUsingBuilderResume(false); 
                    setResumeContent(''); 
                    setFileName(''); 
                  }} 
                  className="text-sm text-blue-600 hover:underline mt-4 font-medium"
                >
                  Upload a different file
                </button>
            </div>
        ) : (
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        {fileName ? (
                          <p className="mb-2 text-sm text-gray-700 font-semibold truncate">{fileName}</p>
                        ) : (
                          <>
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload resume</span></p>
                            <p className="text-xs text-gray-500">Word, PDF, or TXT files</p>
                          </>
                        )}
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf,.txt,text/plain" onChange={handleFileChange} />
                </label>
            </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center"
        >
          {isLoading ? <Loader /> : 'Analyze My Resume'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {analysisResult && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold mb-6 text-center">Analysis Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <ScoreGauge score={analysisResult.overallScore} />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-3">Score Breakdown</h4>
              <ul className="space-y-2">
                {analysisResult.breakdown.map((item, index) => (
                    <li key={index} className="flex justify-between">
                        <span>{item.category}</span>
                        <span className="font-medium">{item.score}/{item.maxScore}</span>
                    </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8">
            <h4 className="font-semibold text-xl mb-4 text-gray-800">Actionable Feedback</h4>
            <div className="space-y-4">
              {analysisResult.feedback.map((item, index) => (
                <div key={index} className={`p-4 border-l-4 rounded ${getSeverityColor(item.severity)}`}>
                  <p className="font-bold text-gray-800">{item.issue}</p>
                  <p className="text-gray-600">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATSChecker;