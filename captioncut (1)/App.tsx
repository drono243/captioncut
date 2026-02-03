
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UploadBox from './components/UploadBox';
import Footer from './components/Footer';
import Legal from './components/Legal';
import { AuthProvider } from './components/AuthContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';

const ParallaxBackground: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const { isDark } = useTheme();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const zoomFactor = 1 + scrollY * 0.00015;

  // Cinematic palette for high-end editor aesthetic
  const bgColor = isDark ? '#000000' : '#f8fafc';
  const deepBlue = isDark ? '#000c24' : '#dbeafe';
  const vividBlue = isDark ? '#1e40af' : '#60a5fa';
  
  const orb1Color = isDark ? 'rgba(29, 78, 216, 0.15)' : 'rgba(147, 197, 253, 0.3)';
  const orb2Color = isDark ? 'rgba(30, 58, 138, 0.2)' : 'rgba(191, 219, 254, 0.2)';
  const spotlightColor = isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)';

  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden transition-colors duration-1000" style={{ backgroundColor: bgColor }}>
      {/* LAYER 1: Vivid Blue & Black Gradient (The main atmospheric layer) */}
      <div 
        className="absolute inset-0 translate-z-0 will-change-transform transition-all duration-1000"
        style={{ 
          transform: `translate3d(0, ${scrollY * 0.04}px, 0) scale(${zoomFactor})`,
          background: isDark 
            ? `radial-gradient(circle at 50% -20%, ${vividBlue} 0%, ${deepBlue} 45%, ${bgColor} 100%)`
            : `radial-gradient(circle at 50% -20%, ${deepBlue} 0%, ${bgColor} 100%)`
        }}
      />

      {/* LAYER 2: Kinetic Blue Blobs (Adding movement and texture) */}
      <div 
        className="absolute inset-0 opacity-60 will-change-transform"
        style={{ transform: `translate3d(0, ${scrollY * 0.12}px, 0)` }}
      >
        <div className="absolute top-[-15%] right-[-10%] w-[800px] h-[800px] blur-[220px] rounded-full transition-colors duration-1000" style={{ backgroundColor: orb1Color }} />
        <div className="absolute bottom-[10%] left-[-15%] w-[700px] h-[700px] blur-[200px] rounded-full transition-colors duration-1000" style={{ backgroundColor: orb2Color }} />
        <div 
          className="absolute top-[20%] left-[10%] w-[500px] h-[500px] blur-[160px] rounded-full will-change-transform transition-colors duration-1000"
          style={{ 
            transform: `translate3d(${scrollY * 0.03}px, ${scrollY * -0.04}px, 0)`,
            backgroundColor: spotlightColor 
          }}
        />
      </div>

      {/* LAYER 3: Detailed Depth Highlights */}
      <div 
        className="absolute inset-0 z-10 opacity-40 pointer-events-none will-change-transform"
        style={{ transform: `translate3d(0, ${scrollY * 0.22}px, 0)` }}
      >
         <div className={`absolute top-[250px] left-1/2 -translate-x-1/2 w-[900px] h-[450px] blur-[140px] rounded-full transition-colors duration-1000 ${isDark ? 'bg-blue-600/5' : 'bg-blue-400/5'}`} />
         <div className={`absolute top-[1000px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] blur-[120px] rounded-full transition-colors duration-1000 ${isDark ? 'bg-blue-500/10' : 'bg-blue-300/10'}`} />
      </div>

      {/* Cinematic Grain Overlay for texture */}
      <div 
        className="grain-overlay opacity-[0.03] mix-blend-screen" 
        style={{ filter: 'url(#noiseFilter)' }} 
      />
      
      {/* VIGNETTE for edge depth */}
      <div className="absolute inset-0 transition-opacity duration-1000 bg-[radial-gradient(circle_at_center,transparent_30%,var(--vignette-color)_110%)] opacity-70" 
           style={{ '--vignette-color': bgColor } as any} />
    </div>
  );
};

const AppContent: React.FC = () => {
  const [legalView, setLegalView] = useState<'privacy' | 'terms' | null>(null);
  const { isDark } = useTheme();

  const scrollToUpload = useCallback(() => {
    const element = document.getElementById('upload-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className={`min-h-screen flex flex-col selection:bg-blue-500/30 font-sans relative overflow-x-hidden transition-colors duration-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
      <ParallaxBackground />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow">
          <Hero onUploadClick={scrollToUpload} />
          <UploadBox />
        </main>

        <Footer 
          onPrivacyClick={() => setLegalView('privacy')} 
          onTermsClick={() => setLegalView('terms')} 
        />
      </div>

      <AnimatePresence>
        {legalView && (
          <Legal type={legalView} onClose={() => setLegalView(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
