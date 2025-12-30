'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function CreateDeckPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [languageMode, setLanguageMode] = useState(false);
  const [languageCode, setLanguageCode] = useState('');
  const [sourceText, setSourceText] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create deck with optional language mode
      const createRes = await api.post('/decks', {
        title,
        description,
        mode: languageMode ? 'language' : 'standard',
        languageCode: languageMode ? languageCode : undefined,
      });
      const deck = createRes.data;

      // If language mode and text provided, trigger language import
      if (languageMode && sourceText.trim()) {
        await api.post('/import/language', {
          deckId: deck.id,
          languageCode,
          text: sourceText,
          cardTypes: ['vocab','sentence','cloze','grammar'],
          level: 'beginner',
          topic: title,
        });
      }

      router.push('/dashboard');
    } catch {
      alert('Failed to create deck');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="soft-card bg-white/85 max-w-2xl w-full p-8 space-y-6">
        <div className="space-y-2">
          <p className="pill bg-cyan-50 text-cyan-700">New deck</p>
          <h1 className="text-3xl font-bold">Design your study set</h1>
          <p className="text-slate-600">Create a standard deck or enable Language Mode to extract vocabulary, sentences, cloze, and grammar cards from any text.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
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

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={languageMode} onChange={(e) => setLanguageMode(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700">Enable Language Mode</span>
            </label>
            {languageMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Language (ISO code)</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="e.g., es, fr, de"
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Paste text from any book/article</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    placeholder="Paste foreign language text here to generate vocabulary, sentences, cloze, and grammar cards."
                    rows={8}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">AI can auto-generate cards after you create the deck. Language Mode supports vocab, sentences, cloze, and grammar.</p>
            <Button type="submit" isLoading={isLoading} className="bg-linear-to-r from-cyan-500 to-blue-600 px-5">
              Save deck
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
