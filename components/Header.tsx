
import React from 'react';
import { Module } from '../App';

interface HeaderProps {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
}

const NavItem: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm md:text-base font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700'
    }`}
  >
    {label}
  </button>
);

const Header: React.FC<HeaderProps> = ({ activeModule, setActiveModule }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm2 0v12h2V4H6zm5 0v12h2V4h-2z" clipRule="evenodd" />
            </svg>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">AI Resume Architect</h1>
          </div>
          <nav className="flex items-center space-x-1 md:space-x-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
            <NavItem label="Builder" isActive={activeModule === 'builder'} onClick={() => setActiveModule('builder')} />
            <NavItem label="ATS Checker" isActive={activeModule === 'ats'} onClick={() => setActiveModule('ats')} />
            <NavItem label="JD Matcher" isActive={activeModule === 'jd'} onClick={() => setActiveModule('jd')} />
            <NavItem label="Smart Rewriter" isActive={activeModule === 'rewriter'} onClick={() => setActiveModule('rewriter')} />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
