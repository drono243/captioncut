
import React from 'react';
import { motion } from 'framer-motion';
import { playPop } from '../lib/audio';
import { useTheme } from './ThemeContext';

interface FooterProps {
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onPrivacyClick, onTermsClick }) => {
  const { isDark } = useTheme();
  const handleClick = (fn: () => void) => {
    playPop();
    fn();
  };

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`py-12 px-8 border-t mt-20 transition-colors duration-500 ${isDark ? 'border-zinc-900 bg-black/40' : 'border-zinc-200 bg-zinc-50'}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
        <div className="flex items-center space-x-3">
          <svg width="28" height="16" viewBox="0 0 42 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDark ? "text-zinc-500" : "text-blue-600 opacity-60"}>
            <rect x="0" y="4.5" width="22" height="5" rx="1" fill="currentColor"/>
            <rect x="0" y="14.5" width="16" height="5" rx="1" fill="currentColor"/>
            <rect x="26" y="9" width="2" height="6" rx="1" fill="currentColor"/>
            <rect x="31" y="4" width="2" height="16" rx="1" fill="currentColor"/>
            <rect x="36" y="9" width="2" height="6" rx="1" fill="currentColor"/>
          </svg>
          <span className={`text-sm font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>CaptionCut &copy; 2024</span>
        </div>
        <div className="flex space-x-8 text-sm text-zinc-500">
          <button onClick={() => handleClick(onPrivacyClick)} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>Privacy</button>
          <button onClick={() => handleClick(onTermsClick)} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>Terms</button>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>Twitter</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>GitHub</a>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
