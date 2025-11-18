import React, { useState } from 'react';
import { getJDMatchAnalysis } from '../services/geminiService';
import { JDMatchAnalysis, JDOptimizationSuggestion } from '../types';
import Loader from './Loader';
import ScoreGauge from './ScoreGauge';
import { extractRawText } from 'mammoth';

const JDMatcher: React.FC<{ initialResumeText?: string }> = ({ initialResumeText }) => {
  const [jdText, setJdText] = useState('');
  const [resumeContent, setResumeContent] = useState<string | { data: string; mimeType: string }>(initialResumeText || '');
  const [isUsingBuilderResume, setIsUsingBuilderResume] = useState(!!initialResumeText);
  const [fileName, setFileName] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<JDMatchAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const fileNameLower = file.name.toLowerCase();
      const isAllowed =
        allowedMimeTypes.includes(file.type) ||
        fileNameLower.endsWith('.pdf') ||
        fileNameLower.endsWith('.doc') ||
        fileNameLower.endsWith('.docx');

      if (!isAllowed) {
        setError('Unsupported file type. Please upload a Word (.doc, .docx) or PDF file.');
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
    if (!jdText.trim() || !resumeContent || (typeof resumeContent === 'string' && !resumeContent.trim())) {
      setError('Please provide both the job description and your resume.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await getJDMatchAnalysis(resumeContent, jdText);
      setAnalysisResult(result);
    } catch (e) {
      setError('An error occurred during analysis. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getImpactColor = (impact: JDOptimizationSuggestion['impact']) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-100 border-red-500 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">AI Job Description Matcher</h2>
        <p className="text-gray-600 mb-6">Compare your resume against a job description to identify gaps and get optimization suggestions.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-2">Job Description</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full h-72 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Paste the job description here..."
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Your Resume</label>
            {isUsingBuilderResume ? (
                 <div className="w-full h-72 p-3 border rounded-md bg-gray-50 flex flex-col justify-center items-center text-center">
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
                    <label htmlFor="dropzone-file-jd" className="flex flex-col items-center justify-center w-full h-72 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            {fileName ? (
                              <p className="mb-2 text-sm text-gray-700 font-semibold truncate">{fileName}</p>
                            ) : (
                              <>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload resume</span></p>
                                <p className="text-xs text-gray-500">Word (.doc, .docx) or PDF files only</p>
                              </>
                            )}
                        </div>
                        <input id="dropzone-file-jd" type="file" className="hidden" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf" onChange={handleFileChange} />
                    </label>
                </div>
            )}
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center"
        >
          {isLoading ? <Loader /> : 'Find My Match Score'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>

      {analysisResult && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-2xl font-bold mb-6 text-center">Matching Report</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b pb-8 mb-8">
            <div className="text-center">
              <p className="text-lg text-gray-600">Match Percentage</p>
              <p className="text-6xl font-bold text-blue-600">{analysisResult.matchPercentage}%</p>
              <p className="text-sm text-gray-500 mt-1">How well your resume aligns with the job.</p>
            </div>
            <div className="flex flex-col items-center justify-center">
                <p className="text-lg text-gray-600 mb-2">JD-Specific ATS Score</p>
                <ScoreGauge score={analysisResult.atsScoreAsPerJD} />
                <p className="text-sm text-gray-500 mt-2">Your resume's effectiveness for this role's ATS.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-xl mb-4 text-gray-800">Keywords to Add</h4>
              {analysisResult.missingKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysisResult.missingKeywords.map((keyword, index) => (
                    <span key={index} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : <p className="text-gray-500">No critical keywords seem to be missing. Great job!</p>}
            </div>
            <div>
              <h4 className="font-semibold text-xl mb-4 text-gray-800">Keywords to Remove</h4>
              {analysisResult.redundantKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysisResult.redundantKeywords.map((keyword, index) => (
                     <span key={index} className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : <p className="text-gray-500">No redundant keywords found. Your resume is concise!</p>}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-xl mb-4 text-gray-800">Optimization Suggestions</h4>
            <div className="space-y-4">
              {analysisResult.suggestions.map((item, index) => (
                <div key={index} className={`p-4 border-l-4 rounded ${getImpactColor(item.impact)}`}>
                  <div className="flex items-center mb-1">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${getImpactColor(item.impact)}`}>{item.impact} IMPACT</span>
                    <span className="ml-2 font-semibold">{item.area}</span>
                  </div>
                  <p className="text-gray-700">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JDMatcher;