
import React from 'react';
import { motion } from 'framer-motion';
import { playPop } from '../lib/audio';
import { useTheme } from './ThemeContext';

interface HeroProps {
  onUploadClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onUploadClick }) => {
  const { isDark } = useTheme();
  const handleUploadClick = () => {
    playPop();
    onUploadClick();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pt-40 pb-20 px-6 flex flex-col items-center text-center"
    >
      <motion.div 
        variants={itemVariants}
        className="flex items-center space-x-2 px-3 py-1 mb-6 text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
        <span>Secure Local Processing</span>
      </motion.div>

      <motion.h1 
        variants={itemVariants}
        className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight max-w-4xl leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}
      >
        Captions Made <br />
        <span className="text-blue-500">for Editors.</span>
      </motion.h1>

      <motion.p 
        variants={itemVariants}
        className={`text-lg md:text-xl mb-10 max-w-xl font-light leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
      >
        Stop manually typing subtitles. Generate short-line, perfectly timed SRT files ready for Premiere Pro & After Effects in seconds.
      </motion.p>

      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
      >
        <motion.button 
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUploadClick}
          className={`font-bold py-4 px-10 rounded-xl transition-all shadow-xl ${isDark ? 'bg-white text-black shadow-white/5' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'}`}
        >
          Get Started — Free
        </motion.button>
        <motion.button 
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { playPop(); window.open('https://github.com', '_blank'); }}
          className={`font-semibold py-4 px-10 rounded-xl transition-all border flex items-center justify-center space-x-2 ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800' : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'}`}
        >
          <svg className="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          <span>Open Source</span>
        </motion.button>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 0.4 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-16 flex flex-wrap justify-center items-center gap-8 text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase"
      >
        <span className="hover:text-blue-500 transition-colors cursor-default">Adobe Premiere</span>
        <span className="hover:text-blue-500 transition-colors cursor-default">After Effects</span>
        <span className="hover:text-blue-500 transition-colors cursor-default">DaVinci Resolve</span>
        <span className="hover:text-blue-500 transition-colors cursor-default">Final Cut Pro</span>
      </motion.div>
    </motion.section>
  );
};

export default Hero;
