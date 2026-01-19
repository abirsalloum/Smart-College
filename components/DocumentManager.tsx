
import React from 'react';
import { Document } from '../types';

interface DocumentManagerProps {
  documents: Document[];
  onRemove: (id: string) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, onRemove }) => {
  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Source Documents</h2>
            <p className="text-slate-500 mt-1">Manage the knowledge base for this notebook.</p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
            {documents.length} Total Documents
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No documents found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Upload text or PDF files from the sidebar to populate your notebook's database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doc.type === 'application/pdf' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 line-clamp-1 truncate">{doc.name}</h4>
                      <p className="text-xs text-slate-400">Added on {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(doc.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 h-32 overflow-hidden relative">
                  <p className="text-xs text-slate-600 line-clamp-5 leading-relaxed">
                    {doc.content}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent"></div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium">Type: {doc.name.split('.').pop()?.toUpperCase()}</span>
                  <span>{(doc.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
