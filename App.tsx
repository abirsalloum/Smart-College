
import React, { useState, useEffect, useRef } from 'react';
import { Document, Message, Folder } from './types';
import { geminiService } from './services/gemini';
import { storageService } from './services/storage';
import { extractTextFromPdf } from './services/pdf';
import { extractTextFromExcel } from './services/excel';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const pendingQueryRef = useRef<string | null>(null);

  const CONFIDENTIAL_FOLDER_ID = 'confidential-dir';
  const GENERAL_FOLDER_ID = 'general-dir';

  useEffect(() => {
    const savedTheme = localStorage.getItem('sc_theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const initWorkspace = async () => {
      try {
        let storedDocs = await storageService.getAllDocuments();
        
        const initialFolders = [
          { id: GENERAL_FOLDER_ID, name: 'General', createdAt: new Date() },
          { id: CONFIDENTIAL_FOLDER_ID, name: 'Confidential', createdAt: new Date() }
        ];
        setFolders(initialFolders);

        if (storedDocs.length === 0) {
          try {
            const response = await fetch('/workspace.json');
            const manifest = await response.json();
            
            for (const defDoc of manifest.default_documents) {
              const fileRes = await fetch(`/${defDoc.path}`);
              const content = await fileRes.text();
              const newDoc: Document = {
                id: Math.random().toString(36).substring(7),
                name: defDoc.name,
                content: content,
                type: 'text/plain',
                size: content.length,
                uploadedAt: new Date(),
                folderId: defDoc.folderId
              };
              await storageService.saveDocument(newDoc);
              storedDocs.push(newDoc);
            }
          } catch (e) {
            console.warn("Could not load default documents from /sources/ folder.", e);
          }
        }
        
        setDocuments(storedDocs);
        
        const savedMessages = localStorage.getItem('smart_chat_history');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        } else {
          setMessages([{
            id: 'welcome',
            role: 'model',
            text: "Welcome to Smart College Bot! How can I assist you today? I am here to help answer your questions in English and Arabic based on our project records in the /sources/ folder.",
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error("Project boot sequence failed:", error);
      }
    };
    initWorkspace();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('smart_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('sc_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const addDocumentsToVirtualProject = async (files: FileList, targetFolderId: string) => {
    setIsLoading(true);
    const newDocs: Document[] = [];
    try {
      for (const file of Array.from(files)) {
        let content = '';
        try {
          const ext = file.name.split('.').pop()?.toLowerCase();
          if (ext === 'pdf') content = await extractTextFromPdf(file);
          else if (ext === 'xlsx' || ext === 'xls') content = await extractTextFromExcel(file);
          else content = await file.text();

          const newDoc: Document = {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            content: content,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
            folderId: targetFolderId
          };
          await storageService.saveDocument(newDoc);
          newDocs.push(newDoc);
        } catch (err) {
          console.error(`Error writing file to /sources/:`, err);
        }
      }
      setDocuments(prev => [...prev, ...newDocs]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string, isAutoRetry = false) => {
    if (!text.trim() || isLoading) return;

    // EXPLICIT KEYWORD DETECTION for Manual Login
    const lowerInput = text.toLowerCase().trim();
    if (lowerInput === 'admin' || lowerInput === 'login' || lowerInput === 'verification') {
        if (!isAdminAuthenticated) {
            setIsLoginModalOpen(true);
            setLoginError(null);
            const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
            setMessages(prev => [...prev, userMsg, {
                id: Date.now().toString() + '-sys',
                role: 'model',
                text: "Opening administrator verification portal...",
                timestamp: new Date()
            }]);
            return;
        } else {
            const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
            setMessages(prev => [...prev, userMsg, {
                id: Date.now().toString() + '-sys',
                role: 'model',
                text: "You are already authenticated as an administrator.",
                timestamp: new Date()
            }]);
            return;
        }
    }

    if (!isAutoRetry) {
      const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
    }
    
    setIsLoading(true);
    pendingQueryRef.current = text;

    try {
      const response = await geminiService.askAboutDocuments(text, documents, folders, messages, isAdminAuthenticated);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        sources: response.sources
      }]);

      if (response.needsAdmin && !isAdminAuthenticated) {
        setTimeout(() => {
          setIsLoginModalOpen(true);
          setLoginError(null);
        }, 500);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Error accessing /sources/ context. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    // VALID CREDENTIALS: username: admin | password: Admin2025!
    if (loginForm.username === 'admin' && loginForm.password === 'Admin2025!') {
      setIsAdminAuthenticated(true);
      setIsLoginModalOpen(false);
      setLoginForm({ username: '', password: '' });
      
      if (pendingQueryRef.current && pendingQueryRef.current.toLowerCase() !== 'admin' && pendingQueryRef.current.toLowerCase() !== 'login') {
        const query = pendingQueryRef.current;
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: "Verification successful. Unlocking /sources/confidential/ records...",
          timestamp: new Date()
        }]);
        setTimeout(() => handleSendMessage(query, true), 800);
      } else {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "Welcome, Administrator. You now have full access to the project sources including confidential records.",
            timestamp: new Date()
          }]);
      }
    } else {
      setLoginError("Invalid credentials. Please verify your administrator details.");
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: "Environment refreshed. How can I help you today?",
      timestamp: new Date()
    }]);
    localStorage.removeItem('smart_chat_history');
    pendingQueryRef.current = null;
  };

  const downloadSourceFromVirtualProject = (sourceName: string) => {
    const doc = documents.find(d => d.name === sourceName);
    if (!doc) return;
    
    if (doc.folderId === CONFIDENTIAL_FOLDER_ID && !isAdminAuthenticated) {
      alert("Access Denied: This record is restricted to authorized administrators.");
      setIsLoginModalOpen(true);
      return;
    }

    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nameLower = doc.name.toLowerCase();
    const extension = (nameLower.endsWith('.pdf') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls')) ? '.txt' : '';
    a.download = `${doc.name}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 overflow-hidden font-sans ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      
      <div className={`${isAdminAuthenticated ? 'w-80' : 'w-0'} transition-all duration-500 ease-in-out border-r ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'} overflow-hidden flex flex-col`}>
        <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <h2 className={`font-bold ${theme === 'dark' ? 'text-sc-orange' : 'text-sc-navy'}`}>Source Manager</h2>
          <button onClick={() => setIsAdminAuthenticated(false)} className="text-slate-400 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar 
            documents={documents} 
            folders={folders}
            onAddFiles={addDocumentsToVirtualProject} 
            onRemove={async (id) => {
              if(confirm("Remove this source from the project?")) {
                await storageService.deleteDocument(id);
                setDocuments(p => p.filter(d => d.id !== id));
              }
            }} 
            onSummaryRequested={(doc) => handleSendMessage(`Analyze the file: "${doc.name}"`)}
            isLoading={isLoading}
            theme={theme}
          />
        </div>
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        <header className={`h-20 flex items-center justify-between px-8 border-b transition-all z-10 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <img src="images/logo.png" alt="Smart College Logo" className={`h-12 md:h-14 object-contain ${theme === 'dark' ? 'brightness-125 contrast-125' : ''}`} />
            <div className={`h-8 w-px hidden md:block ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <h1 className={`text-xl font-extrabold tracking-tight hidden md:block ${theme === 'dark' ? 'text-sc-orange' : 'text-sc-navy'}`}>Smart College Bot</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-sc-orange' : 'bg-slate-100 text-slate-500'}`}
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9 9 0 0012 21a9 9 0 008.354-5.646z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              )}
            </button>
            <button onClick={clearChat} className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative max-w-5xl mx-auto w-full">
          <ChatWindow 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            onClearChat={clearChat}
            onDownloadSource={downloadSourceFromVirtualProject}
            isLoading={isLoading} 
            documentCount={documents.length} 
            theme={theme}
          />
        </div>
        
        <div className={`h-12 border-t flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 px-4 py-2 transition-all ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Connected to: workspace.json manifest</p>
           <a href="https://www.smart-college.org" target="_blank" rel="noopener noreferrer" className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${theme === 'dark' ? 'text-sc-orange' : 'text-sc-navy'}`}>www.smart-college.org</a>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">+961 3 721 999</p>
        </div>
      </main>

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-300 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-start mb-2">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-sc-orange' : 'text-sc-navy'}`}>Verification Required</h2>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-6 font-medium">Accessing files in /sources/confidential/ requires an administrator token.</p>
            
            {loginError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-widest">Administrator User</label>
                <input 
                  type="text" 
                  autoFocus
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 outline-none focus:border-sc-orange transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-400 uppercase tracking-widest">Secret Key</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 outline-none focus:border-sc-orange transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsLoginModalOpen(false)}
                  className={`flex-1 py-4 font-bold rounded-xl hover:bg-slate-200 transition-all ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-sc-navy hover:bg-sc-orange text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Confirm Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
