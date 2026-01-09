
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  documentCount: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, isLoading, documentCount }) => {
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

  const exportChat = () => {
    const chatContent = messages.map(m => 
      `${m.role.toUpperCase()} (${m.timestamp.toLocaleString()}):\n${m.text}\n${m.sources ? `Sources: ${m.sources.join(', ')}` : ''}\n${'-'.repeat(20)}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-college-chat-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header for Desktop/Mobile with Export */}
      {messages.length > 0 && (
        <div className="px-6 py-2 border-b border-slate-50 bg-white/80 backdrop-blur-sm flex justify-end items-center sticky top-0 z-20">
          <button 
            onClick={exportChat}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors py-1 px-3 rounded-lg hover:bg-blue-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Conversation
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-6 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to your Notebook</h2>
            <p className="text-slate-500 mb-8">
              {documentCount > 0 
                ? "Your documents are indexed and ready. Ask anything about them in English or Arabic!" 
                : "Upload some documents on the left to start chatting with your private AI knowledge base."}
            </p>
            {documentCount > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {["Summarize all documents", "What are the key themes?", "List specific dates mentioned", "Explain this to a beginner"].map(suggest => (
                  <button 
                    key={suggest}
                    onClick={() => onSendMessage(suggest)}
                    className="p-3 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all text-left"
                  >
                    {suggest}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 md:p-5 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                }`}
                style={{ direction: isArabic(msg.text) ? 'rtl' : 'ltr' }}
              >
                <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
                    {msg.sources.map(source => (
                      <span key={source} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-2 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-sm text-slate-400 font-medium">SMart College is thinking...</span>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || documentCount === 0}
            placeholder={documentCount === 0 ? "Upload documents to start..." : "Ask a question about your documents..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
            style={{ direction: isArabic(input) ? 'rtl' : 'ltr' }}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim() || documentCount === 0}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-3">
          Powered by Gemini 3 Pro. It only answers using your sources.
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
