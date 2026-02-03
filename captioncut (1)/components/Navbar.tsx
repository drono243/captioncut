
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playPop } from '../lib/audio';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const Navbar: React.FC = () => {
  const { user, login, logout, isLoggingIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogin = () => {
    playPop();
    login();
  };

  const handleLogout = () => {
    playPop();
    logout();
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    playPop();
    setShowDropdown(!showDropdown);
  };

  const handleThemeToggle = () => {
    playPop();
    toggleTheme();
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 py-6 px-8 flex justify-between items-center transition-all duration-300"
    >
      <div className="flex items-center space-x-3 group cursor-pointer">
        <motion.div 
          whileHover={{ rotate: -5, scale: 1.05 }}
          className="flex items-center"
        >
          <svg width="42" height="24" viewBox="0 0 42 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDark ? "text-white" : "text-blue-600"}>
            <rect x="0" y="4.5" width="22" height="5" rx="1" fill="currentColor"/>
            <rect x="0" y="14.5" width="16" height="5" rx="1" fill="currentColor"/>
            <rect x="26" y="9" width="2" height="6" rx="1" fill="currentColor"/>
            <rect x="31" y="4" width="2" height="16" rx="1" fill="currentColor"/>
            <rect x="36" y="9" width="2" height="6" rx="1" fill="currentColor"/>
          </svg>
        </motion.div>
        <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>CaptionCut</span>
      </div>
      
      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Theme Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleThemeToggle}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${isDark ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900' : 'border-zinc-200 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50'}`}
          aria-label="Toggle Theme"
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.svg key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </motion.svg>
            ) : (
              <motion.svg key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>

        {user ? (
          <div className="relative">
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col items-end">
                <span className={`text-[10px] font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{user.usageCount} Generations</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Creator Plan</span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDropdown}
                className={`w-10 h-10 rounded-full border p-0.5 transition-all active:scale-95 ${isDark ? 'border-zinc-800 hover:border-indigo-500/50' : 'border-zinc-200 hover:border-blue-500'}`}
              >
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full bg-zinc-800" />
              </motion.button>
            </div>

            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-3 w-48 glass rounded-2xl border p-2 shadow-2xl ${isDark ? 'border-zinc-800 bg-black/40' : 'border-zinc-200 bg-white/80 backdrop-blur-md'}`}
                >
                  <div className={`px-4 py-3 border-b mb-2 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{user.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-2 text-xs rounded-xl transition-colors ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-blue-600 hover:bg-zinc-50'}`}
                  >
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`text-sm font-semibold py-2.5 px-6 rounded-full border transition-all flex items-center space-x-2 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-blue-600'}`}
          >
            {isLoggingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.34-2.12 4.46-1.22 1.12-3.1 1.94-5.72 1.94-4.52 0-8.24-3.66-8.24-8.24s3.72-8.24 8.24-8.24c2.44 0 4.28.94 5.6 2.22l2.3-2.3C18.14 1.82 15.52.4 12.48.4 6.84.4 2.2 5.04 2.2 10.68s4.64 10.28 10.28 10.28c3.04 0 5.6-1.02 7.72-3.24 2.12-2.22 2.82-5.32 2.82-7.8 0-.46-.04-.92-.12-1.38H12.48z"/>
                </svg>
                <span>Google Log In</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
