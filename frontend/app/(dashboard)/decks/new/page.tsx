'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function CreateDeckPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/decks', { title, description });
      router.push('/dashboard');
    } catch {
      alert('Failed to create deck');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="soft-card bg-white/85 max-w-xl w-full p-8 space-y-6">
        <div className="space-y-2">
          <p className="pill bg-cyan-50 text-cyan-700">New deck</p>
          <h1 className="text-3xl font-bold">Design your study set</h1>
          <p className="text-slate-600">Give it a memorable title. Add a quick description so future you remembers the focus.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              placeholder="Neuroscience exam · Week 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              placeholder="Chapters 3-5, lecture highlights, and professor examples."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">AI can auto-generate cards after you create the deck.</p>
            <Button type="submit" isLoading={isLoading} className="bg-linear-to-r from-cyan-500 to-blue-600 px-5">
              Save deck
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
