
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { playPop, playBell } from '../lib/audio';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

type ProcessStatus = 'idle' | 'extracting' | 'transcribing' | 'completed' | 'error';
type CaptionStyle = 'reels' | 'standard' | 'fast';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface Caption {
  id: number;
  startTime: string; 
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

const styles = [
  {
    id: 'reels' as CaptionStyle,
    label: 'Reels Style',
    description: '2-3 words per line. Ultra punchy for social media.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'standard' as CaptionStyle,
    label: 'Normal Subtitle',
    description: '5-8 words per line. Traditional, easy-to-read layout.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>,
  },
  {
    id: 'fast' as CaptionStyle,
    label: 'Fast-paced',
    description: 'Rapid-fire captions focused on high-energy speech.',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
];

const srtTimeToSeconds = (time: string): number => {
  const parts = time.split(':');
  const secondsParts = parts[2].split(',');
  return (
    parseInt(parts[0]) * 3600 +
    parseInt(parts[1]) * 60 +
    parseInt(secondsParts[0]) +
    parseInt(secondsParts[1]) / 1000
  );
};

const UploadBox: React.FC = () => {
  const { user, login, incrementUsage } = useAuth();
  const { isDark } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<ProcessStatus>('idle');
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle>('reels');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeCaptionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentCaption = useMemo(() => {
    return captions.find(cap => currentTime >= cap.startSeconds && currentTime <= cap.endSeconds);
  }, [captions, currentTime]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (activeCaptionRef.current && scrollContainerRef.current) {
      activeCaptionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime]);

  const validateAndProcess = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      playPop();
      setStatus('error');
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 50MB.`);
      return;
    }
    
    if (!user) {
      login();
      return;
    }

    setCurrentFile(file);
    processFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcess(file);
    }
  };

  const parseSRT = (srt: string): Caption[] => {
    const blocks = srt.trim().split(/\n\s*\n/);
    return blocks.map((block) => {
      const lines = block.split('\n');
      const id = parseInt(lines[0]);
      if (isNaN(id)) return null;
      const timeLine = lines[1];
      if (!timeLine) return null;
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      const text = lines.slice(2).join(' ');
      if (!timeMatch) return null;
      return { id, startTime: timeMatch[1], endTime: timeMatch[2], startSeconds: srtTimeToSeconds(timeMatch[1]), endSeconds: srtTimeToSeconds(timeMatch[2]), text };
    }).filter((c): c is Caption => c !== null);
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setCaptions([]);
    setErrorMessage('');
    
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } else {
      setVideoUrl(null);
    }
    
    try {
      setStatus('extracting');
      setProgress(10);
      setProgressMsg('Extracting local audio stream...');
      const audioBlob = await extractAudio(file);
      
      setStatus('transcribing');
      setProgress(40);
      setProgressMsg('Syncing with Gemini AI Engine...');
      const srtText = await transcribeAudio(audioBlob, selectedStyle);
      
      setProgress(80);
      setProgressMsg('Parsing frame-accurate timeline...');
      const parsed = parseSRT(srtText);
      setCaptions(parsed);
      
      setStatus('completed');
      setProgress(100);
      incrementUsage();
      playBell();
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Interrupted. Please check your connection and try again.');
    }
  };

  const extractAudio = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      return audioBufferToWav(audioBuffer);
    } catch (e) {
      if (file.type.startsWith('audio/')) return file;
      throw new Error("Unable to extract audio track. Ensure the file is not corrupted.");
    } finally {
      await audioCtx.close();
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels, length = buffer.length * numOfChan * 2 + 44, bufferArr = new ArrayBuffer(length), view = new DataView(bufferArr);
    const channels = [];
    let sample, offset = 0, pos = 0;
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); setUint32(length - pos - 4);
    for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([bufferArr], { type: 'audio/wav' });
  };

  const transcribeAudio = async (audioBlob: Blob, style: CaptionStyle): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(audioBlob);
    });
    
    const stylePrompts = {
      reels: "Break sentences into chunks of exactly 2-4 words. Each line should be punchy for TikTok/Reels.",
      standard: "Standard subtitle format. 5-8 words per line. Traditional pacing.",
      fast: "Rapid-fire captions, 2-5 words. Optimized for high-energy speech."
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [
          { inlineData: { mimeType: 'audio/wav', data: base64Data } },
          { text: `Transcribe this audio into a professional SRT file.\nRULES:\n1. Style: ${stylePrompts[style]}\n2. Maintain frame-accurate sync.\n3. Return valid SRT content only.` }
        ]}
      ]
    });
    return response.text || "";
  };

  const handleDownload = () => {
    playPop();
    const srtStr = captions.map(c => `${c.id}\n${c.startTime} --> ${c.endTime}\n${c.text}\n`).join('\n');
    const blob = new Blob([srtStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.[^/.]+$/, "") + "_CaptionCut.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      id="upload-section" 
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-24 px-6 max-w-6xl mx-auto min-h-[600px]"
    >
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' ? (
          <motion.div 
            key="upload-ui"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-12">
              <div className="flex flex-col items-center mb-10">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.3em] mb-4">01. Choose Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {styles.map((style) => (
                    <motion.button
                      key={style.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { playPop(); setSelectedStyle(style.id); }}
                      className={`flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all duration-300 glass
                        ${selectedStyle === style.id 
                          ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.15)]' 
                          : isDark ? 'border-transparent opacity-50 hover:opacity-100 hover:border-zinc-800' : 'border-zinc-100 opacity-60 hover:opacity-100 hover:border-zinc-200'
                        } ${!isDark && selectedStyle !== style.id ? 'bg-zinc-50/50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${selectedStyle === style.id ? 'bg-blue-500 text-white' : isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-200 text-zinc-400'}`}>
                        {style.icon}
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${!isDark && selectedStyle !== style.id ? 'text-zinc-600' : ''}`}>{style.label}</h4>
                      <p className="text-[10px] text-zinc-500 leading-tight uppercase tracking-wider">{style.description.split('.')[0]}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) validateAndProcess(e.dataTransfer.files[0]); }}
                className={`relative rounded-[2.5rem] border-2 border-dashed transition-all duration-500 min-h-[360px] flex flex-col items-center justify-center p-12 text-center
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-500/5' 
                    : isDark ? 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700' : 'border-zinc-200 bg-zinc-50/30 hover:border-zinc-300'
                  } ${status === 'error' ? 'border-red-500/30 bg-red-500/5' : ''}`}
              >
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: isDragging ? 1.1 : 1 }}
                  className={`w-20 h-20 mb-8 rounded-3xl flex items-center justify-center transition-all ${status === 'error' ? 'bg-red-500/10 text-red-400' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-400'}`}
                >
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {status === 'error' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />}
                  </svg>
                </motion.div>
                
                <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{status === 'error' ? 'Something went wrong' : 'Upload your sequence'}</h3>
                <p className="text-zinc-500 mb-10 max-w-sm text-sm leading-relaxed">
                  {status === 'error' ? errorMessage : 'Drop your video/audio file here. We process everything in-browser for 100% privacy.'}
                </p>

                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="video/*,audio/*" onChange={onFileChange} ref={fileInputRef} />
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`font-bold py-4 px-12 rounded-2xl transition-all shadow-xl inline-block ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                  >
                    {!user ? 'Log In to Begin' : 'Select File'}
                  </motion.span>
                </label>
              </motion.div>
            </div>
          </motion.div>
        ) : status === 'extracting' || status === 'transcribing' ? (
          <motion.div 
            key="processing-ui"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className={`glass rounded-[3rem] p-16 flex flex-col items-center justify-center text-center min-h-[450px] max-w-4xl mx-auto border shadow-2xl ${isDark ? 'border-zinc-800/30 bg-black/20 shadow-blue-500/5' : 'border-zinc-100 bg-white shadow-zinc-200/50'}`}
          >
            <div className="relative w-32 h-32 mb-10">
              <div className={`absolute inset-0 border-4 rounded-full opacity-20 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent"
              ></motion.div>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-400 text-lg">{progress}%</div>
            </div>
            <h3 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{status === 'extracting' ? 'Analyzing Timeline' : 'AI Processing'}</h3>
            <p className="text-zinc-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
              {progressMsg} <br /> <span className="text-[10px] uppercase tracking-widest mt-4 block opacity-40">Don't close this tab</span>
            </p>
            <div className={`w-full max-w-sm rounded-full h-1 overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
              <motion.div 
                className="bg-blue-500 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="completed-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
          >
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="lg:col-span-7 flex flex-col space-y-6"
            >
              <div className={`glass rounded-[2.5rem] overflow-hidden relative bg-black aspect-video flex items-center justify-center shadow-2xl border ${isDark ? 'border-zinc-800/20' : 'border-zinc-100'}`}>
                {videoUrl ? (
                  <>
                    <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} controls />
                    <AnimatePresence>
                      {currentCaption && (
                        <motion.div 
                          key={currentCaption.id}
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.9 }}
                          className="absolute bottom-16 left-0 right-0 px-10 text-center pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                        >
                          <span className="bg-black/80 backdrop-blur-xl text-white text-xl md:text-3xl font-black px-6 py-3 rounded-2xl inline-block border border-white/10 uppercase tracking-tighter">
                            {currentCaption.text}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-zinc-500 font-bold uppercase tracking-widest opacity-20">Audio Mode</div>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload} 
                  className={`flex-1 font-black py-5 px-8 rounded-[1.25rem] transition-all flex items-center justify-center space-x-3 shadow-2xl ${isDark ? 'bg-white text-black hover:bg-zinc-200 shadow-white/5' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <span>Download .SRT</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playPop(); setStatus('idle'); if(videoUrl) URL.revokeObjectURL(videoUrl); setVideoUrl(null); }} 
                  className={`font-bold py-5 px-10 rounded-[1.25rem] transition-all border ${isDark ? 'bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-900 border-zinc-800/50' : 'bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border-zinc-200'}`}
                >
                  Discard
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`lg:col-span-5 flex flex-col h-[650px] glass rounded-[2.5rem] overflow-hidden border shadow-2xl ${isDark ? 'border-zinc-800/30 bg-black/20' : 'border-zinc-100 bg-white/60'}`}
            >
              <div className={`p-8 border-b flex justify-between items-center ${isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-100 bg-zinc-50'}`}>
                <div>
                  <h3 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Timeline</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Refine your script</p>
                </div>
                <div className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-500/20">{selectedStyle}</div>
              </div>
              <div ref={scrollContainerRef} className={`flex-grow overflow-y-auto p-6 space-y-3 scrollbar-hide ${isDark ? 'bg-black/20' : 'bg-white/10'}`}>
                {captions.map((cap) => {
                  const isActive = currentTime >= cap.startSeconds && currentTime <= cap.endSeconds;
                  return (
                    <motion.div 
                      layout
                      key={cap.id} 
                      ref={isActive ? activeCaptionRef : null} 
                      onClick={() => { if (videoRef.current) { videoRef.current.currentTime = cap.startSeconds; videoRef.current.play(); }}} 
                      className={`group p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isActive 
                        ? (isDark ? 'bg-blue-600/15 border-blue-500/40' : 'bg-blue-50 border-blue-500/30') + ' scale-[1.02] shadow-xl shadow-blue-500/5' 
                        : (isDark ? 'bg-zinc-900/30 border-transparent hover:border-zinc-800 hover:bg-zinc-900/50' : 'bg-white border-transparent hover:border-zinc-200 hover:bg-zinc-50')}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-mono font-bold tracking-tighter ${isActive ? 'text-blue-500' : 'text-zinc-400'}`}>{cap.startTime.split(',')[0]}</span>
                        <span className="text-[9px] text-zinc-400 font-black opacity-40">#{cap.id}</span>
                      </div>
                      <AnimatePresence mode="wait">
                        {editingId === cap.id ? (
                          <motion.input 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            autoFocus 
                            className={`border rounded-xl w-full py-2 px-4 text-sm focus:outline-none font-medium ${isDark ? 'bg-black/60 border-blue-500/50 text-white' : 'bg-white border-blue-500/30 text-zinc-900'}`} 
                            value={cap.text} 
                            onChange={(e) => setCaptions(prev => prev.map(c => c.id === cap.id ? { ...c, text: e.target.value } : c))} 
                            onBlur={() => setEditingId(null)} 
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)} 
                          />
                        ) : (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={(e) => { e.stopPropagation(); setEditingId(cap.id); }} 
                            className={`text-sm leading-relaxed ${isActive ? (isDark ? 'text-white font-bold' : 'text-zinc-900 font-bold') : (isDark ? 'text-zinc-400 font-medium' : 'text-zinc-600 font-medium')}`}
                          >
                            {cap.text}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadBox;
