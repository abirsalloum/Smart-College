
import React, { useRef, useState } from 'react';
import { Document, Folder } from '../types';

interface SidebarProps {
  documents: Document[];
  folders: Folder[];
  onAddFiles: (files: FileList, folderId?: string) => Promise<void>;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveDocument: (docId: string, folderId: string | undefined) => void;
  onRemove: (id: string) => void;
  onSummaryRequested: (doc: Document) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  documents, folders, onAddFiles, onCreateFolder, onDeleteFolder, 
  onMoveDocument, onRemove, onSummaryRequested, onExport, onImportFile, isLoading 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['uncategorized']));

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedFolders(newSet);
  };

  const handleFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const renderDoc = (doc: Document) => (
    <div key={doc.id} className="group relative bg-white border border-slate-100 rounded-lg p-2 hover:border-blue-200 hover:shadow-sm transition-all ml-4 mb-1">
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0" title={doc.name}>
          <p className="text-[13px] font-medium text-slate-700 truncate">{doc.name}</p>
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
        <button onClick={() => onSummaryRequested(doc)} className="text-[9px] text-blue-500 hover:underline">Summary</button>
        <select 
          className="text-[9px] bg-slate-50 border-none text-slate-400 outline-none max-w-[80px]"
          onChange={(e) => onMoveDocument(doc.id, e.target.value || undefined)}
          value={doc.folderId || ''}
        >
          <option value="">Move...</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="p-4 border-b border-slate-200 bg-white">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl transition-all shadow-sm disabled:bg-slate-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Add Files
        </button>
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onAddFiles(e.target.files)} className="hidden" accept=".txt,.md,.pdf" multiple />
        
        <button 
          onClick={() => setIsAddingFolder(true)}
          className="w-full mt-2 flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 text-xs font-medium py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-300 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
          New Folder
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {isAddingFolder && (
          <form onSubmit={handleFolderSubmit} className="mb-4">
            <input 
              autoFocus
              className="w-full text-xs p-2 border border-blue-300 rounded-lg outline-none ring-2 ring-blue-50"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => !newFolderName && setIsAddingFolder(false)}
            />
          </form>
        )}

        {folders.map(folder => (
          <div key={folder.id} className="mb-2">
            <div className="flex items-center justify-between group px-1 py-1 cursor-pointer hover:bg-slate-200/50 rounded-lg">
              <div className="flex items-center gap-2 flex-1" onClick={() => toggleFolder(folder.id)}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                <span className="text-sm font-semibold text-slate-600 truncate">{folder.name}</span>
                <span className="text-[10px] text-slate-400">({documents.filter(d => d.folderId === folder.id).length})</span>
              </div>
              <button onClick={() => onDeleteFolder(folder.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            </div>
            {expandedFolders.has(folder.id) && (
              <div className="mt-1">
                {documents.filter(d => d.folderId === folder.id).map(renderDoc)}
              </div>
            )}
          </div>
        ))}

        <div className="mt-4">
          <div className="flex items-center gap-2 px-1 py-1 cursor-pointer" onClick={() => toggleFolder('uncategorized')}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedFolders.has('uncategorized') ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Uncategorized</span>
          </div>
          {expandedFolders.has('uncategorized') && (
            <div className="mt-1">
              {documents.filter(d => !d.folderId).map(renderDoc)}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
        <button 
          onClick={() => importInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-2 rounded-xl transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Import Notebook
        </button>
        <input type="file" ref={importInputRef} onChange={(e) => e.target.files?.[0] && onImportFile(e.target.files[0])} className="hidden" accept=".json" />

        <button 
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-xl transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Backup Notebook
        </button>
        <p className="text-[9px] text-slate-400 text-center px-2">Data is private. Use Import/Backup to move work between devices.</p>
      </div>
    </div>
  );
};

export default Sidebar;
