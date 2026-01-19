
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onDownloadSource: (name: string) => void;
  isLoading: boolean;
  documentCount: number;
  theme: 'light' | 'dark';
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, documentCount, onDownloadSource, theme }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const isArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-10 space-y-10 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Bot Avatar */}
              {msg.role === 'model' && (
                <div className={`hidden sm:flex w-10 h-10 rounded-full flex-shrink-0 items-center justify-center text-white shadow-md transition-colors ${theme === 'dark' ? 'bg-sc-orange' : 'bg-sc-navy'}`}>
                   <img src="images/logo.png" alt="SC" className="w-6 h-6 rounded-full" />
                </div>
              )}
              
              <div 
                className={`group relative rounded-2xl p-5 md:p-6 transition-all ${
                  msg.role === 'user' 
                    ? 'chat-bubble-user text-white rounded-tr-none' 
                    : `${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-100 text-slate-800'} border rounded-tl-none shadow-sm`
                }`}
                style={{ direction: isArabic(msg.text) ? 'rtl' : 'ltr' }}
              >
                <div className={`prose prose-sm md:prose-base max-w-none whitespace-pre-wrap leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                  {msg.text}
                </div>
                
                {/* Clickable Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className={`mt-6 pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Knowledge Base Reference</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map(source => (
                        <button 
                          key={source} 
                          onClick={() => onDownloadSource(source)}
                          className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all border ${
                            theme === 'dark' 
                            ? 'bg-slate-700 text-sc-orange border-slate-600 hover:bg-sc-orange hover:text-white' 
                            : 'bg-slate-50 text-sc-navy border-slate-200 hover:bg-sc-orange hover:text-white hover:border-sc-orange'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 px-1 font-semibold uppercase tracking-tighter">
              {msg.role === 'model' ? 'Smart Bot' : 'User'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-4">
            <div className="flex space-x-1">
              <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${theme === 'dark' ? 'bg-sc-orange' : 'bg-sc-navy'}`}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${theme === 'dark' ? 'bg-sc-orange' : 'bg-sc-navy'}`}></div>
              <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-sc-orange' : 'bg-sc-navy'}`}></div>
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-sc-orange' : 'text-sc-navy'}`}>Smart Bot is thinking...</span>
          </div>
        )}
      </div>

      <div className={`p-6 md:p-10 border-t transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Smart College Bot anything..."
            className={`w-full border-2 rounded-[2rem] py-5 pl-8 pr-16 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-lg shadow-sm ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-white focus:border-sc-orange' 
                : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-sc-navy'
            }`}
            style={{ direction: isArabic(input) ? 'rtl' : 'ltr' }}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white rounded-full transition-all shadow-lg active:scale-95 ${
              theme === 'dark' ? 'bg-sc-orange hover:bg-white hover:text-sc-orange' : 'bg-sc-navy hover:bg-sc-orange'
            } disabled:bg-slate-200 disabled:text-slate-400`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
