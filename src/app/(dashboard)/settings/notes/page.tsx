"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ChevronLeft, Calendar as CalendarIcon, Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import NoteCard from "@/components/notes/NoteCard";
import NoteModal from "@/components/notes/NoteModal";

interface Note {
  id: string;
  title: string;
  content: string;
  noteDate: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/notes';
      if (dateFilter) {
        url += `?date=${dateFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async (noteData: any) => {
    const isEdit = !!noteData.id;
    const url = isEdit ? `/api/notes/${noteData.id}` : '/api/notes';
    const method = isEdit ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to save note");
    }
    
    fetchNotes();
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/settings" 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Notes</h1>
          <p className="text-slate-500 text-sm mt-1">Manage notes and important information</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
          
          <div className="relative">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-40 text-slate-700"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => {
            setEditingNote(null);
            setIsModalOpen(true);
          }}
          className="btn-primary py-2 w-full md:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-md shadow-purple-200"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No notes found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            {dateFilter || searchQuery 
              ? "No notes match your current filters. Try adjusting them." 
              : "You haven't created any notes yet. Add your first note to keep track of important information."}
          </p>
          {!dateFilter && !searchQuery && (
            <button 
              onClick={() => {
                setEditingNote(null);
                setIsModalOpen(true);
              }}
              className="text-purple-600 font-medium hover:text-purple-700"
            >
              + Create a new note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteCard 
              key={note.id} 
              note={note} 
              onEdit={(note) => {
                setEditingNote(note);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}

      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        initialData={editingNote}
      />
    </div>
  );
}
