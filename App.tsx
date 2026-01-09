
import React, { useState, useEffect } from 'react';
import { Document, Message, Folder } from './types';
import { geminiService } from './services/gemini';
import { storageService } from './services/storage';
import { extractTextFromPdf } from './services/pdf';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import DocumentManager from './components/DocumentManager';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat');

  useEffect(() => {
    const initStorage = async () => {
      try {
        if (navigator.storage && navigator.storage.persist) {
          await navigator.storage.persist();
        }
        
        // Check for URL parameter ?notebook=URL
        const params = new URLSearchParams(window.location.search);
        const remoteUrl = params.get('notebook');
        
        if (remoteUrl) {
          setIsLoading(true);
          try {
            const response = await fetch(remoteUrl);
            const data = await response.json();
            await importData(data);
          } catch (e) {
            console.error("Failed to load remote notebook:", e);
          } finally {
            setIsLoading(false);
          }
        } else {
          const storedDocs = await storageService.getAllDocuments();
          setDocuments(storedDocs);
          const savedFolders = localStorage.getItem('smart_folders');
          if (savedFolders) setFolders(JSON.parse(savedFolders));
        }
      } catch (error) {
        console.error("Storage init failed:", error);
      }
    };
    initStorage();
  }, []);

  useEffect(() => {
    localStorage.setItem('smart_folders', JSON.stringify(folders));
  }, [folders]);

  const importData = async (data: any) => {
    if (data.documents && Array.isArray(data.documents)) {
      await storageService.clearAllDocuments();
      for (const doc of data.documents) {
        await storageService.saveDocument(doc);
      }
      setDocuments(data.documents);
      if (data.folders) setFolders(data.folders);
      setMessages([{
        id: 'system',
        role: 'model',
        text: "✅ Workspace successfully imported! I'm ready to answer questions about these specific documents.",
        timestamp: new Date()
      }]);
    }
  };

  const handleImportFile = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
    } catch (error) {
      alert("Invalid backup file format.");
    } finally {
      setIsLoading(false);
    }
  };

  const addDocuments = async (files: FileList, folderId?: string) => {
    setIsLoading(true);
    const newDocs: Document[] = [];
    try {
      for (const file of Array.from(files)) {
        let content = '';
        try {
          if (file.type === 'application/pdf') content = await extractTextFromPdf(file);
          else content = await file.text();

          const newDoc: Document = {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            content: content,
            type: file.type,
            size: file.size,
            uploadedAt: new Date(),
            folderId: folderId
          };
          await storageService.saveDocument(newDoc);
          newDocs.push(newDoc);
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
        }
      }
      setDocuments(prev => [...prev, ...newDocs]);
    } finally {
      setIsLoading(false);
    }
  };

  const createFolder = (name: string) => {
    const newFolder: Folder = {
      id: Math.random().toString(36).substring(7),
      name,
      createdAt: new Date()
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const moveDocument = async (docId: string, folderId: string | undefined) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const updatedDoc = { ...doc, folderId };
    await storageService.saveDocument(updatedDoc);
    setDocuments(prev => prev.map(d => d.id === docId ? updatedDoc : d));
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setDocuments(prev => prev.map(d => d.folderId === id ? { ...d, folderId: undefined } : d));
  };

  const removeDocument = async (id: string) => {
    await storageService.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await geminiService.askAboutDocuments(text, documents, messages);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        sources: response.sources
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting to my brain. Please check your internet or API key.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportWorkspace = () => {
    const data = { documents, folders, exportedAt: new Date() };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-college-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out border-r border-slate-200 bg-white hidden md:block overflow-hidden`}>
        <Sidebar 
          documents={documents} 
          folders={folders}
          onAddFiles={addDocuments} 
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onMoveDocument={moveDocument}
          onRemove={removeDocument} 
          onExport={exportWorkspace}
          onImportFile={handleImportFile}
          onSummaryRequested={async (doc) => {
            setIsLoading(true);
            const summary = await geminiService.summarizeDocument(doc);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `### Summary: ${doc.name}\n\n${summary}`,
              timestamp: new Date(),
              sources: [doc.name]
            }]);
            setIsLoading(false);
            setActiveTab('chat');
          }}
          isLoading={isLoading}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate max-w-[150px] md:max-w-none">SMart College</h1>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl scale-90 md:scale-100">
            <button onClick={() => setActiveTab('chat')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Chat</button>
            <button onClick={() => setActiveTab('docs')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'docs' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Sources</button>
          </div>
          <div className="w-6 md:w-10"></div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' ? (
            <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} documentCount={documents.length} />
          ) : (
            <DocumentManager documents={documents} onRemove={removeDocument} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
