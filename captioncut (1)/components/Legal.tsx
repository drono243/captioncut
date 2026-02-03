
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playPop } from '../lib/audio';

interface LegalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

const Legal: React.FC<LegalProps> = ({ type, onClose }) => {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'May 2024',
      sections: [
        {
          h: 'Local Processing',
          p: 'CaptionCut processes your video and audio files locally within your browser. We do not store your original video content on our servers.'
        },
        {
          h: 'Data Transmission',
          p: 'Only extracted audio data is sent to the Google Gemini API for transcription. This data is used solely for generating subtitles and is not retained by us after processing.'
        },
        {
          h: 'Auto-Deletion',
          p: 'Temporary files created during processing (like Object URLs) are automatically revoked and cleared from your browser session once the task is complete or the tab is closed.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'May 2024',
      sections: [
        {
          h: 'Acceptable Use',
          p: 'You agree to use CaptionCut only for lawful purposes. You are responsible for any content you upload and must ensure you have the rights to use it.'
        },
        {
          h: 'Service Availability',
          p: 'As a beta service, CaptionCut is provided "as is" without warranties. We reserve the right to modify or discontinue features at any time.'
        },
        {
          h: 'Usage Limits',
          p: 'Currently, users are limited to files under 50MB and a reasonable number of daily generations to ensure service stability for all creators.'
        }
      ]
    }
  };

  const active = content[type];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col border border-zinc-800 shadow-2xl"
      >
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40">
          <div>
            <h2 className="text-2xl font-bold">{active.title}</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Last Updated: {active.lastUpdated}</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { playPop(); onClose(); }}
            className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
        <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
          {active.sections.map((s, i) => (
            <div key={i}>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">{s.h}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{s.p}</p>
            </div>
          ))}
          <div className="pt-8 border-t border-zinc-900 text-center">
            <p className="text-xs text-zinc-600 italic">CaptionCut: Built for editors, by editors.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Legal;
