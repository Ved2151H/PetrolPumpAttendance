"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id?: string;
  title: string;
  content: string;
  noteDate: string;
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => Promise<void>;
  initialData?: Note | null;
}

export default function NoteModal({ isOpen, onClose, onSave, initialData }: NoteModalProps) {
  const [formData, setFormData] = useState<Note>({
    title: "",
    content: "",
    noteDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        id: initialData.id,
        title: initialData.title,
        content: initialData.content,
        noteDate: format(new Date(initialData.noteDate), "yyyy-MM-dd"),
      });
      if (editorRef.current) {
        editorRef.current.innerHTML = initialData.content;
      }
    } else if (isOpen) {
      setFormData({
        title: "",
        content: "",
        noteDate: format(new Date(), "yyyy-MM-dd"),
      });
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
    setError(null);
  }, [isOpen, initialData]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        setSavedRange(range);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, content: editorRef.current!.innerHTML }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      
      const data = await res.json();
      if (data.success) {
        insertImage(data.url);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const insertImage = (url: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      const imgHtml = `<br><img src="${url}" class="max-w-full rounded-lg my-2 border border-slate-200" alt="Note Image" /><br>`;
      let inserted = false;
      
      const selection = window.getSelection();
      if (savedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
        
        if (editorRef.current.contains(savedRange.commonAncestorContainer)) {
          inserted = document.execCommand('insertHTML', false, imgHtml);
        }
      }
      
      if (!inserted) {
        editorRef.current.innerHTML += imgHtml;
      }
      
      // Move cursor to the end
      if (selection && editorRef.current) {
        selection.selectAllChildren(editorRef.current);
        selection.collapseToEnd();
      }
      
      handleInput();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setError("Note content cannot be empty.");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? "Edit Note" : "Create Note"}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input 
              type="date" 
              required
              value={formData.noteDate}
              onChange={e => setFormData({...formData, noteDate: e.target.value})}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Pump Maintenance"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="input-field w-full"
            />
          </div>
          <div className="flex flex-col flex-1 min-h-[250px]">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Note Content *</label>
              
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md transition-colors border border-slate-200">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Take Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
                
                <label className="cursor-pointer text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md transition-colors border border-slate-200">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  Gallery
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
            
            <div 
              ref={editorRef}
              className="input-field w-full flex-1 overflow-y-auto min-h-[150px] whitespace-pre-wrap cursor-text"
              contentEditable
              onInput={handleInput}
              onBlur={saveSelection}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              suppressContentEditableWarning
              style={{ outline: 'none' }}
            />
          </div>
          
          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isSaving || isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving || isUploading}
              className="flex-1 btn-primary disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
