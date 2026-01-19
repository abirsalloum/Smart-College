
import React, { useRef, useState } from 'react';
import { Document, Folder } from '../types';

interface SidebarProps {
  documents: Document[];
  folders: Folder[];
  onAddFiles: (files: FileList, folderId: string) => Promise<void>;
  onRemove: (id: string) => void;
  onSummaryRequested: (doc: Document) => void;
  isLoading: boolean;
  theme: 'light' | 'dark';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  documents, folders, onAddFiles, onRemove, onSummaryRequested, isLoading, theme
}) => {
  const generalInputRef = useRef<HTMLInputElement>(null);
  const confidentialInputRef = useRef<HTMLInputElement>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['general-dir', 'confidential-dir']));

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedFolders(newSet);
  };

  const renderDoc = (doc: Document) => (
    <div key={doc.id} className={`group relative border rounded-lg p-2 transition-all ml-4 mb-1 ${
      theme === 'dark' 
        ? 'bg-slate-900 border-slate-800 hover:border-sc-orange shadow-sm' 
        : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'
    }`}>
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0" title={doc.name}>
          <p className={`text-[12px] font-medium truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{doc.name}</p>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onRemove(doc.id)} className="p-1 text-slate-300 hover:text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <button onClick={() => onSummaryRequested(doc)} className={`text-[9px] font-bold hover:underline ${theme === 'dark' ? 'text-sc-orange' : 'text-sc-navy'}`}>Analyze Source</button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50/50'}`}>
      <div className={`p-4 border-b space-y-3 ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        
        {/* ADD GENERAL FILES BUTTON */}
        <button 
          onClick={() => generalInputRef.current?.click()}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 ${
            theme === 'dark' ? 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700' : 'bg-sc-navy hover:bg-blue-800 text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Add General Files
        </button>
        <input type="file" ref={generalInputRef} onChange={(e) => e.target.files && onAddFiles(e.target.files, 'general-dir')} className="hidden" accept=".txt,.md,.pdf,.xlsx,.xls" multiple />
        
        {/* ADD CONFIDENTIAL FILES BUTTON */}
        <button 
          onClick={() => confidentialInputRef.current?.click()}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 ${
            theme === 'dark' ? 'bg-sc-orange text-white hover:bg-white hover:text-sc-orange' : 'bg-sc-orange text-white hover:bg-amber-600'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Add Confidential Files
        </button>
        <input type="file" ref={confidentialInputRef} onChange={(e) => e.target.files && onAddFiles(e.target.files, 'confidential-dir')} className="hidden" accept=".txt,.md,.pdf,.xlsx,.xls" multiple />

      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {folders.map(folder => (
          <div key={folder.id} className="mb-4">
            <div className={`flex items-center justify-between group px-2 py-2 cursor-pointer rounded-xl hover:bg-slate-200/10`}>
              <div className="flex items-center gap-2 flex-1" onClick={() => toggleFolder(folder.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${folder.id === 'confidential-dir' ? 'text-sc-orange' : 'text-sc-navy'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <span className={`text-sm font-extrabold tracking-tight truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{folder.name}</span>
                <span className="text-[10px] font-bold text-slate-500">[{documents.filter(d => d.folderId === folder.id).length}]</span>
              </div>
            </div>
            {expandedFolders.has(folder.id) && (
              <div className="mt-1">
                {documents.filter(d => d.folderId === folder.id).map(renderDoc)}
              </div>
            )}
          </div>
        ))}

        {/* Display uncategorized files as a separate virtual dir if any exist */}
        {documents.some(d => !d.folderId || (d.folderId !== 'confidential-dir' && d.folderId !== 'general-dir')) && (
           <div className="mt-4">
            <div className="flex items-center gap-2 px-2 py-2 cursor-pointer" onClick={() => toggleFolder('legacy')}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedFolders.has('legacy') ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>Imported / Legacy</span>
            </div>
            {expandedFolders.has('legacy') && (
              <div className="mt-1">
                {documents.filter(d => !d.folderId || (d.folderId !== 'confidential-dir' && d.folderId !== 'general-dir')).map(renderDoc)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`p-6 border-t ${theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col items-center text-center gap-2">
           <p className={`text-[10px] font-bold uppercase tracking-tighter ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Sources Root Directory</p>
           <p className={`text-[9px] font-medium italic ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>/sources/workspace.json</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
