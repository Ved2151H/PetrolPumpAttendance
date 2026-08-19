"use client";

import { Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  noteDate: string;
}

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-purple-600 border-y border-r border-y-slate-200 border-r-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col h-full relative group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-purple-700 font-medium text-sm bg-purple-50 px-3 py-1 rounded-full">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(note.noteDate), "dd MMM yyyy")}</span>
        </div>
        
        <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(note)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit note"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{note.title}</h3>
      <div 
        className="text-slate-600 text-sm whitespace-pre-wrap flex-1 [&_img]:max-h-40 [&_img]:w-auto [&_img]:rounded-md [&_img]:my-2 [&_img]:border [&_img]:border-slate-200 overflow-hidden"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 6,
          WebkitBoxOrient: 'vertical'
        }}
        dangerouslySetInnerHTML={{ __html: note.content }}
      />
    </div>
  );
}
