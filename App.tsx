import React, { useState, useEffect, useRef } from 'react';
import { analyzeContent, checkApiKey, promptApiKeySelection } from './services/geminiService';
import { AnalysisResult, UploadedFile, HistoryItem } from './types';
import { TetBackground, Lantern, ApricotBlossom, PeachBlossom } from './components/TetDecorations';
import { Fireworks } from './components/Fireworks';
import { ChatAssistant } from './components/ChatAssistant';
import { ImageGenerator } from './components/ImageGenerator';

declare global {
  interface Window {
    MathJax: any;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'study' | 'history'>('study');
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('vipaii_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Trigger MathJax whenever result changes
  useEffect(() => {
    if (result && window.MathJax) {
      setTimeout(() => {
        window.MathJax.typesetPromise && window.MathJax.typesetPromise();
      }, 100);
    }
  }, [result, activeTab]);

  // Save history helper
  const saveToHistory = (res: AnalysisResult, p: string, f?: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      prompt: p || (f ? "Phân tích tài liệu" : "Không tiêu đề"),
      fileName: f,
      result: res
    };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem('vipaii_history', JSON.stringify(updated));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('vipaii_history', JSON.stringify(updated));
  };

  const loadFromHistory = (item: HistoryItem) => {
    // Reset inputs to avoid confusion with current upload
    setFile(null);
    
    // Load data from history
    setResult(item.result);
    setPrompt(item.prompt);
    
    // Switch tab and scroll
    setActiveTab('study');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Helper to read file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFile({
          data: base64String,
          mimeType: selectedFile.type,
          name: selectedFile.name
        });
        setResult(null); // Reset prev result
      };
      
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalysis = async () => {
    if (!prompt && !file) {
      setError("Vui lòng nhập nội dung hoặc tải file lên.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzeContent(file?.data || null, file?.mimeType || null, prompt);
      setResult(analysis);
      saveToHistory(analysis, prompt, file?.name);
    } catch (err: any) {
      console.error(err);
      setError("Có lỗi xảy ra khi phân tích. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const ensureKeyAndRun = async (action: () => Promise<void>) => {
    await action();
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-stone-50 font-sans text-slate-800">
      <TetBackground />
      <Fireworks />
      
      {/* Decorative Elements */}
      <Lantern className="absolute top-0 left-4 md:left-20 animate-bounce z-20" style={{ animationDuration: '3s' }} />
      <Lantern className="absolute top-[-10px] right-4 md:right-20 animate-bounce z-20" style={{ animationDuration: '4s' }} />
      <ApricotBlossom className="absolute top-32 left-[5%] opacity-90 w-16 h-16 animate-pulse" />
      <PeachBlossom className="absolute top-24 right-[8%] opacity-90 w-20 h-20 animate-pulse" />
      <PeachBlossom className="absolute bottom-40 left-[2%] opacity-80 w-12 h-12" />
      
      {/* Main Container */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-6xl md:text-7xl font-hand text-red-700 mb-2 drop-shadow-md tracking-wide">
            <span className="text-yellow-500 drop-shadow-sm">Vi</span>paii
          </h1>
          <p className="font-tet text-xl text-red-800 italic font-medium">
             ✨ Khai Xuân Trí Tuệ - Rạng Rỡ Tương Lai - Tết 2026 ✨
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/70 backdrop-blur-md rounded-full p-1.5 border-2 border-yellow-400 flex shadow-lg">
            <button
              onClick={() => setActiveTab('study')}
              className={`px-6 py-2 rounded-full font-bold transition-all text-sm md:text-base ${
                activeTab === 'study' 
                  ? 'bg-red-600 text-yellow-100 shadow-lg' 
                  : 'text-red-800 hover:bg-red-100'
              }`}
            >
              Phân Tích & Giải Bài
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-full font-bold transition-all text-sm md:text-base flex items-center gap-2 ${
                activeTab === 'history' 
                  ? 'bg-red-600 text-yellow-100 shadow-lg' 
                  : 'text-red-800 hover:bg-red-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lịch Sử
            </button>
          </div>
        </div>

        {/* Content Area */}
        <main className="transition-all duration-500 pb-20">
          {activeTab === 'history' ? (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-2 border-yellow-200 min-h-[400px]">
              <h2 className="text-2xl font-tet font-bold text-red-800 mb-6 flex items-center gap-2 border-b border-red-100 pb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Nhật Ký Học Tập
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-500 italic">
                  Chưa có lịch sử học tập nào. Hãy bắt đầu phân tích bài học đầu tiên!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => loadFromHistory(item)}
                      className="group relative bg-red-50 border border-red-100 p-4 rounded-xl hover:shadow-lg hover:border-yellow-400 cursor-pointer transition-all hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-red-400 bg-red-100 px-2 py-1 rounded-md">
                           {new Date(item.timestamp).toLocaleDateString('vi-VN') + ' ' + new Date(item.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                         </span>
                         <button 
                           onClick={(e) => deleteHistoryItem(item.id, e)}
                           className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                      </div>
                      <h3 className="font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-red-700">
                        {item.prompt.slice(0, 80) || "Phân tích tài liệu"}...
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {item.fileName && (
                           <span className="flex items-center gap-1">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                             {item.fileName}
                           </span>
                        )}
                        <span className="text-yellow-600 flex items-center gap-1 font-medium">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Xem lại
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {/* Upload & Input Section */}
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border-2 border-yellow-300 relative overflow-hidden">
                {/* Background Pattern for Input Box */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400 rounded-bl-full opacity-20 -z-0"></div>

                <div className="mb-6 relative z-10">
                  {/* File Upload - Full Width */}
                  <div>
                    <label className="block text-sm font-bold text-red-800 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      1. File Tài Liệu / Ảnh
                    </label>
                    <div className="relative border-2 border-dashed border-red-300 bg-red-50/50 rounded-xl p-4 text-center hover:bg-red-50 hover:border-red-500 transition-all group h-32 flex flex-col justify-center items-center">
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        accept="image/*,.txt,.md,.pdf,audio/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="space-y-1 group-hover:scale-105 transition-transform">
                         {file ? (
                           <>
                             <svg className="mx-auto h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                             <span className="text-red-700 font-bold bg-yellow-200 px-2 py-1 rounded text-sm block truncate max-w-[300px] mx-auto">{file.name}</span>
                           </>
                         ) : (
                           <>
                              <svg className="mx-auto h-8 w-8 text-red-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              <p className="text-gray-500 text-xs font-medium">Kéo thả hoặc chọn file (Ảnh, PDF, Audio)</p>
                           </>
                         )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 relative z-10">
                  <label className="block text-sm font-bold text-red-800 mb-2 uppercase tracking-wide">
                    2. Yêu cầu chi tiết
                  </label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full border-2 border-red-200 bg-white rounded-xl p-4 focus:ring-4 focus:ring-yellow-200 focus:border-red-500 outline-none transition-all placeholder-red-200 text-slate-700"
                    placeholder="Nhập câu hỏi, yêu cầu tóm tắt hoặc điểm cần làm rõ..."
                    rows={3}
                  />
                </div>

                <button
                  onClick={() => ensureKeyAndRun(handleAnalysis)}
                  disabled={loading}
                  className="relative z-10 w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-yellow-100 font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-3 text-lg border border-yellow-500 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Vipaii Đang Suy Luận...
                    </>
                  ) : (
                    <>
                      <span className="group-hover:animate-bounce">🧧</span> Phân Tích & Giải Bài
                    </>
                  )}
                </button>
                {error && <p className="mt-4 text-red-600 text-center bg-red-100 p-2 rounded-lg">{error}</p>}
              </div>

               {/* Image Generator Section */}
               <div className="mt-8">
                 <ImageGenerator />
               </div>

              {/* NEWS CARD RESULT DISPLAY */}
              {result && (
                <div className="relative animate-fade-in-up">
                   {/* Background Decor */}
                   <div className="absolute -inset-2 bg-gradient-to-b from-yellow-200 to-red-200 rounded-[2rem] opacity-50 blur-lg -z-10"></div>
                   
                   <div className="bg-[#fffdf5] rounded-3xl shadow-2xl border-4 border-double border-yellow-600 overflow-hidden relative">
                      {/* Oriental Pattern Overlay */}
                      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')] pointer-events-none"></div>

                      {/* Card Header */}
                      <div className="bg-red-800 p-6 text-center relative border-b-4 border-yellow-500">
                         <div className="absolute top-1/2 left-4 -translate-y-1/2 w-16 h-[2px] bg-yellow-400 hidden md:block"></div>
                         <div className="absolute top-1/2 right-4 -translate-y-1/2 w-16 h-[2px] bg-yellow-400 hidden md:block"></div>
                         <h2 className="text-3xl md:text-4xl font-tet font-bold text-yellow-100 uppercase tracking-widest drop-shadow-md">
                           Tổng Hợp Kiến Thức
                         </h2>
                         <p className="text-yellow-200/80 text-sm font-serif italic mt-2">Bản tin học tập Vipaii - Tết Bính Ngọ 2026</p>
                      </div>

                      {/* Card Body */}
                      <div className="p-6 md:p-10 space-y-10">
                        
                        {/* Summary Section - Highlighted */}
                        <section className="relative">
                           <div className="absolute -left-3 top-0 bottom-0 w-1 bg-red-500 rounded-full"></div>
                           <h3 className="text-2xl font-serif font-bold text-slate-800 mb-4 pl-4">
                             Tóm Tắt Nội Dung
                           </h3>
                           <div className="bg-orange-50/50 p-6 rounded-r-xl border border-orange-100 text-slate-700 text-lg leading-loose font-serif text-justify shadow-sm">
                              {result.summary}
                           </div>
                        </section>

                        {/* Keywords Section - Tags Style */}
                        <section>
                           <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm border-b border-red-100 pb-2">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                             Từ Khóa Cốt Lõi
                           </h3>
                           <div className="flex flex-wrap gap-3">
                             {result.keywords.map((kw, idx) => (
                               <span key={idx} className="bg-red-50 text-red-700 px-4 py-2 rounded-full font-bold border border-red-200 shadow-sm hover:bg-red-100 hover:scale-105 transition-transform cursor-default text-sm md:text-base">
                                 #{kw}
                               </span>
                             ))}
                           </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Explanation Section */}
                            <section className="bg-white p-6 rounded-2xl border border-stone-200 shadow-lg">
                               <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                                 Giải Thích Chi Tiết
                               </h3>
                               
                               {Array.isArray(result.explanation) ? (
                                 <div className="space-y-4">
                                   {result.explanation.map((item, idx) => (
                                     <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                                       <h4 className="font-bold text-red-700 mb-1">{item.title}</h4>
                                       <div className="text-slate-600 whitespace-pre-line text-base text-justify font-serif">
                                         {item.content}
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <div className="text-slate-600 leading-relaxed whitespace-pre-line text-base text-justify font-serif">
                                   {result.explanation}
                                 </div>
                               )}
                            </section>

                            {/* Examples Section */}
                            <section className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 shadow-lg">
                               <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                 Ví Dụ Thực Tế
                               </h3>
                               <ul className="space-y-4">
                                 {result.examples.map((ex, idx) => (
                                   <li key={idx} className="flex gap-3 text-slate-700 bg-white p-3 rounded-xl shadow-sm border border-yellow-100">
                                     <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs mt-0.5">{idx + 1}</span>
                                     <span className="text-base">{ex}</span>
                                   </li>
                                 ))}
                               </ul>
                            </section>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="bg-[#f0e6d2] p-4 text-center border-t border-yellow-300">
                         <p className="text-stone-500 text-xs uppercase tracking-widest">Được tạo bởi Trí tuệ nhân tạo Vipaii</p>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-red-800/60 text-sm pb-8 font-medium">
          <p>© 2026 Vipaii App. Vizt.vn - Chúc mừng năm mới!</p>
          <div className="mt-4 flex justify-center">
            <a 
              href="https://www.facebook.com/share/1Cknn8EkLX/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-white hover:bg-red-600 font-bold flex items-center gap-2 transition-all bg-white px-5 py-2.5 rounded-full shadow-md border-2 border-red-100 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="group-hover:fill-white transition-colors">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
              </svg>
              Liên hệ hỗ trợ: Vizt.vn
            </a>
          </div>
        </footer>
      </div>

      {/* Floating Chat Assistant */}
      <ChatAssistant />
    </div>
  );
};

export default App;