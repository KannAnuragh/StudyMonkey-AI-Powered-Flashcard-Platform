'use client';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, LogOut, Flame, BookOpen, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [decks, setDecks] = useState<Array<{ id: string; title: string; description?: string; cards?: Array<{ id: string }>; topic?: string }>>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get('/decks').then((res) => setDecks(res.data)).catch(() => null);
  }, []);

  const stats = useMemo(() => {
    const cardCount = decks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
    return [
      { label: 'Decks', value: decks.length, hint: 'Active sets' },
      { label: 'Cards', value: cardCount, hint: 'Total prompts' },
      { label: 'Focus time', value: '32m', hint: 'Today' },
    ];
  }, [decks]);

  const quickReviewHref = decks[0] ? `/study/${decks[0].id}` : '/decks/new';

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Delete this deck and all its cards? This cannot be undone.')) return;
    
    try {
      setDeletingId(deckId);
      await api.delete(`/decks/${deckId}`);
      setDecks(decks.filter(d => d.id !== deckId));
    } catch {
      alert('Failed to delete deck');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar - Icons only on mobile, text on desktop */}
      <nav className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur bg-white/70 border-b">
        <Link href="/dashboard" className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-600" />
          <span className="hidden sm:inline">StudyMonkey</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/premium" title="Go Premium">
            <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
              <span className="text-lg mr-1">👑</span>
              <span className="hidden sm:inline">Premium</span>
            </Button>
          </Link>
          <Link href="/decks/new" title="New Deck">
            <Button size="sm" className="bg-linear-to-r from-cyan-500 to-blue-600 text-white">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">New Deck</span>
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="text-slate-500 hover:text-red-600"
            title="Logout"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </nav>

      {/* Main Content - Better width utilization */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        <header className="soft-card bg-white/80 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-40 w-40 bg-linear-to-br from-cyan-400/25 to-indigo-500/20 blur-3xl" />
          <div className="absolute -left-14 bottom-0 h-32 w-32 bg-linear-to-tr from-amber-300/25 to-rose-300/20 blur-3xl" />
          <div className="relative space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <div className="pill bg-cyan-50 text-cyan-700 inline-flex text-xs sm:text-sm">Daily focus</div>
              <h1 className="text-2xl sm:text-3xl font-bold">Your study cockpit</h1>
              <p className="text-sm sm:text-base text-slate-600">Track progress, jump back into decks, and keep your streak warm. Cards update as your classes change.</p>
            </div>
            
            {/* Action buttons stacked vertically */}
            <div className="flex gap-3 sm:w-fit">
              <Link href={quickReviewHref} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-full px-2 py-2.5 bg-linear-to-r from-amber-400 to-rose-400 text-slate-900 font-semibold">
                  Start quick review
                </Button>
              </Link>
              <Link href="/analytics" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto rounded-full px-6 py-2.5">
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 sm:p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.hint}</p>
              </div>
            ))}
          </div>
        </header>

        {decks.length === 0 ? (
          <div className="soft-card p-8 sm:p-12 text-center bg-white/80 border-dashed border-slate-200">
            <div className="mx-auto mb-4 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">No decks yet</h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mt-2 mb-6">Create your first deck to start spaced repetition. You can import notes, paste a link, or start from scratch.</p>
            <Link href="/decks/new">
              <Button size="lg" className="bg-linear-to-r from-cyan-500 to-blue-600 w-full sm:w-auto">Create deck</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {decks.map((deck) => (
              <div key={deck.id} className="group h-full relative">
                <Card className="soft-card h-full bg-white/85 border border-slate-200/70 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
                  {/* Gradient background accent */}
                  <div className="absolute top-0 right-0 h-24 w-24 bg-linear-to-br from-cyan-400/20 to-blue-500/10 blur-2xl -z-10" />
                  
                  <CardHeader className="pb-2 p-4 sm:p-6">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg sm:text-xl group-hover:text-cyan-700 transition-colors flex-1">{deck.title}</CardTitle>
                      <button
                        onClick={() => handleDeleteDeck(deck.id)}
                        disabled={deletingId === deck.id}
                        className="p-1.5 sm:p-2 rounded-lg opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 hover:text-red-600"
                        title="Delete deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {deck.description && <CardDescription className="line-clamp-2 text-sm text-slate-600">{deck.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="pt-3 flex-1 px-4 sm:px-6">
                    <div className="flex items-center gap-3 sm:gap-4 text-sm text-slate-600 flex-wrap">
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        <span className="font-semibold text-blue-700">{deck.cards?.length || 0}</span>
                        <span className="text-xs text-blue-600">cards</span>
                      </div>
                      {(deck.cards?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                          <span className="font-semibold text-amber-700">+1</span>
                        </div>
                      )}
                    </div>
                    {deck.topic && (
                      <div className="mt-3 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded inline-block">
                        Topic: {deck.topic}
                      </div>
                    )}
                  </CardContent>
                  <div className="px-4 sm:px-6 pb-4 flex gap-2 border-t border-slate-200/50 pt-4">
                    <Link href={`/study/${deck.id}`} className="flex-1">
                      <Button className="w-full bg-linear-to-r from-cyan-500 to-blue-600 text-sm sm:text-base" size="sm">
                        Study
                      </Button>
                    </Link>
                    <Link href={`/decks/${deck.id}/cards`} className="flex-1">
                      <Button variant="outline" className="w-full text-sm sm:text-base" size="sm">
                        Cards
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
