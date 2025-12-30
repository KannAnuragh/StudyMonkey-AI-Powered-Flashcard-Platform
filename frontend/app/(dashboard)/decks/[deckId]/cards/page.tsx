'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ImportModal } from '@/components/ui/import-modal';
import { Plus, Edit2, Trash2, Upload, Download, X, MoreVertical } from 'lucide-react';

interface Card {
  id: string;
  front: string;
  back: string;
  schedulerState?: Record<string, unknown>;
}

interface DeckInfo {
  id: string;
  title: string;
  mode?: string;
  languageCode?: string;
}

export default function DeckCardsPage() {
  const params = useParams();
  const deckId = params.deckId as string;
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [deckInfo, setDeckInfo] = useState<DeckInfo | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ front: '', back: '' });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const loadCards = async () => {
    try {
      setLoading(true);
      const deckRes = await api.get(`/decks/${deckId}`);
      setDeckInfo(deckRes.data);
      const res = await api.get(`/decks/${deckId}/cards`);
      setCards(res.data);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Create/Update card
  const handleSaveCard = async () => {
    try {
      if (!formData.front || !formData.back) {
        alert('Please fill in both front and back');
        return;
      }

      if (editingCard) {
        await api.patch(`/decks/${deckId}/cards/${editingCard.id}`, formData);
      } else {
        await api.post(`/decks/${deckId}/cards`, { ...formData, type: 'basic' });
      }

      setFormData({ front: '', back: '' });
      setEditingCard(null);
      setShowForm(false);
      loadCards();
    } catch {
      alert('Failed to save card');
    }
  };

  // Delete card
  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Delete this card?')) {
      try {
        await api.delete(`/decks/${deckId}/cards/${cardId}`);
        loadCards();
      } catch {
        alert('Failed to delete card');
      }
    }
  };

  // Export cards as CSV
  const handleExportCSV = () => {
    if (cards.length === 0) {
      alert('No cards to export');
      return;
    }

    const csv = [['Front', 'Back']].concat(cards.map((c) => [c.front, c.back]))
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cards-${new Date().getTime()}.csv`;
    a.click();
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen px-3 sm:px-6 py-4 sm:py-12 bg-linear-to-br from-slate-50 via-white to-cyan-50">
      <div className="max-w-4xl mx-auto">
        {/* Header Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">Cards</h1>
              {deckInfo?.mode === 'language' && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs">
                  <span>Language Mode</span>
                  {deckInfo.languageCode && <span className="font-semibold">({deckInfo.languageCode})</span>}
                </div>
              )}
              <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'} in this deck
              </p>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ml-2"
            >
              <MoreVertical className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex gap-3">
            <Button 
              onClick={handleExportCSV} 
              className="bg-slate-600 hover:bg-slate-700"
              size="default"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setImportModalOpen(true)} 
              className="bg-amber-600 hover:bg-amber-700"
              size="default"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button 
              onClick={() => setShowForm(!showForm)} 
              className="bg-linear-to-r from-cyan-500 to-blue-600"
              size="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Card
            </Button>
          </div>

          {/* Mobile Action Menu */}
          {showMobileMenu && (
            <div className="sm:hidden mt-3 space-y-2 animate-in slide-in-from-top-2">
              <Button 
                onClick={() => {
                  setShowForm(!showForm);
                  setShowMobileMenu(false);
                }}
                className="w-full bg-linear-to-r from-cyan-500 to-blue-600 justify-start"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Card
              </Button>
              <Button 
                onClick={() => {
                  setImportModalOpen(true);
                  setShowMobileMenu(false);
                }}
                className="w-full bg-amber-600 hover:bg-amber-700 justify-start"
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Cards
              </Button>
              <Button 
                onClick={handleExportCSV}
                className="w-full bg-slate-600 hover:bg-slate-700 justify-start"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}

          {/* Mobile FAB - Alternative approach */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center text-white hover:shadow-xl transition-all active:scale-95"
          >
            {showForm ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>

        {/* New/Edit Form - Mobile Optimized */}
        {showForm && (
          <div className="soft-card bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
                {editingCard ? 'Edit Card' : 'New Card'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCard(null);
                  setFormData({ front: '', back: '' });
                }}
                className="sm:hidden p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  Front (Question)
                </label>
                <textarea
                  className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="What is the capital of France?"
                  value={formData.front}
                  onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  Back (Answer)
                </label>
                <textarea
                  className="w-full rounded-lg border-2 border-slate-200 p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  placeholder="Paris"
                  value={formData.back}
                  onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button 
                  onClick={handleSaveCard} 
                  className="w-full sm:w-auto bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  size="lg"
                >
                  {editingCard ? 'Update Card' : 'Save Card'}
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCard(null);
                    setFormData({ front: '', back: '' });
                  }}
                  className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 text-slate-800"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cards List - Mobile Optimized */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-200 border-t-cyan-600 mb-4"></div>
              <p className="text-slate-500 text-sm sm:text-base">Loading cards...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="soft-card bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center border border-slate-200">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
                  No cards yet
                </h3>
                <p className="text-sm sm:text-base text-slate-500 mb-2">
                  Add your first card to get started!
                </p>
                <p className="text-xs sm:text-sm text-slate-400">
                  Or import cards using PDF or images and let AI generate them.
                </p>
              </div>
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className="soft-card bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg transition-all border border-slate-200 group"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Card Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">
                        Question
                      </span>
                      <p className="font-semibold text-slate-900 mt-1 text-sm sm:text-base break-words">
                        {card.front}
                      </p>
                    </div>

                    <div className="mb-2">
                      <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                        Answer
                      </span>
                      <p className="text-slate-600 mt-1 text-sm sm:text-base break-words">
                        {card.back}
                      </p>
                    </div>

                    {card.schedulerState && 'nextDueTs' in card.schedulerState && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                        <p className="text-xs text-slate-500">
                          Next review: {new Date(card.schedulerState.nextDueTs as string).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-row flex-col gap-1 sm:gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingCard(card);
                        setFormData({ front: card.front, back: card.back });
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 sm:p-2.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors active:scale-95"
                      aria-label="Edit card"
                    >
                      <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-2 sm:p-2.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors active:scale-95"
                      aria-label="Delete card"
                    >
                      <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom padding for FAB on mobile */}
        <div className="sm:hidden h-20"></div>

        <ImportModal 
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImportStart={(jobId: string) => {
            console.log('[Cards Page] Import started with job:', jobId);
            setTimeout(() => loadCards(), 2000);
          }}
          deckId={deckId}
        />
      </div>
    </div>
  );
}