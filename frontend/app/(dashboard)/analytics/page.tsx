'use client';
import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { TrendingUp, BookOpen, Brain, Zap, Target, Calendar } from 'lucide-react';

interface Card {
  schedulerState?: { repetitions?: number };
}

interface Deck {
  id: string;
  title: string;
  cards?: Card[];
}

export default function AnalyticsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/decks');
        setDecks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const analytics = useMemo(() => {
    const totalCards = decks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
    const totalDecks = decks.length;
    
    let mastered = 0;
    let learning = 0;
    let new_ = 0;

    decks.forEach((deck) => {
      deck.cards?.forEach((card) => {
        const reps = card.schedulerState?.repetitions || 0;
        if (reps >= 5) mastered++;
        else if (reps > 0) learning++;
        else new_++;
      });
    });

    const avgRetention = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;

    return {
      totalCards,
      totalDecks,
      mastered,
      learning,
      new: new_,
      avgRetention,
      currentStreak: 5,
    };
  }, [decks]);

  return (
    <div className="min-h-screen px-6 py-12 bg-linear-to-br from-cyan-50 to-indigo-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">Learning Analytics</h1>
          <p className="text-slate-600 mt-2">Track your progress and mastery across all decks</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading analytics...</div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                {
                  icon: BookOpen,
                  label: 'Total Cards',
                  value: analytics.totalCards,
                  color: 'from-cyan-400 to-blue-500',
                },
                {
                  icon: Target,
                  label: 'Active Decks',
                  value: analytics.totalDecks,
                  color: 'from-amber-400 to-orange-500',
                },
                {
                  icon: TrendingUp,
                  label: 'Retention Rate',
                  value: `${analytics.avgRetention}%`,
                  color: 'from-green-400 to-emerald-500',
                },
                {
                  icon: Brain,
                  label: 'Mastered',
                  value: analytics.mastered,
                  color: 'from-purple-400 to-pink-500',
                },
                {
                  icon: Zap,
                  label: 'Learning',
                  value: analytics.learning,
                  color: 'from-yellow-400 to-orange-500',
                },
                {
                  icon: Calendar,
                  label: 'Current Streak',
                  value: `${analytics.currentStreak} days`,
                  color: 'from-rose-400 to-red-500',
                },
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={idx}
                    className="soft-card bg-white/90 p-6 rounded-2xl border border-slate-200/70 hover:shadow-lg transition-shadow"
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${metric.color} mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-slate-600 text-sm font-medium">{metric.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Deck Breakdown */}
            <div className="soft-card bg-white/90 p-8 rounded-2xl border border-slate-200/70">
              <h2 className="text-2xl font-bold mb-6">Deck Breakdown</h2>
              {decks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No decks yet. Create one to start tracking!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {decks.map((deck) => {
                    const cardCount = deck.cards?.length || 0;
                    let mastered = 0;
                    let learning = 0;
                    let new_ = 0;

                    deck.cards?.forEach((card) => {
                      const reps = card.schedulerState?.repetitions || 0;
                      if (reps >= 5) mastered++;
                      else if (reps > 0) learning++;
                      else new_++;
                    });

                    const masteredPct = cardCount > 0 ? (mastered / cardCount) * 100 : 0;
                    const learningPct = cardCount > 0 ? (learning / cardCount) * 100 : 0;

                    return (
                      <div key={deck.id} className="p-4 rounded-xl border border-slate-200/50 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-900">{deck.title}</h3>
                            <p className="text-sm text-slate-500">{cardCount} cards</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{Math.round(masteredPct)}%</p>
                            <p className="text-xs text-slate-500">mastered</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200/30 rounded-full h-2 overflow-hidden">
                          <div className="flex h-full">
                            <div
                              style={{ width: `${masteredPct}%` }}
                              className="bg-linear-to-r from-green-400 to-emerald-500"
                            />
                            <div
                              style={{ width: `${learningPct}%` }}
                              className="bg-linear-to-r from-yellow-400 to-orange-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-6 mt-3 text-xs text-slate-500">
                          <span>🟢 Mastered: {mastered}</span>
                          <span>🟡 Learning: {learning}</span>
                          <span>⚫ New: {new_}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="mt-8 soft-card bg-linear-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-2xl border border-blue-200/30">
              <h2 className="text-xl font-bold mb-4 text-slate-900">Recommendations</h2>
              <ul className="space-y-2 text-slate-700">
                <li>✓ Review {analytics.learning} cards in &quot;Learning&quot; status to boost retention</li>
                <li>✓ Maintain your {analytics.currentStreak}-day streak by studying daily</li>
                <li>✓ Add more cards to reach 50+ cards per deck for better learning</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
