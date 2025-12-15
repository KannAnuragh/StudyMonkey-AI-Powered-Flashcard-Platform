'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/ui/spotlight-card';
import { ArrowLeft, Trophy, Sparkles, Loader2 } from 'lucide-react';

interface CardType {
  id: string;
  front: string;
  back: string;
}

interface CardItem {
  card: CardType;
}

interface GenerationResult {
  difficulty: string;
  count: number;
  generated: number;
  topics: string[];
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [deckTitle, setDeckTitle] = useState<string>('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<{
    generated: number;
    byDifficulty: GenerationResult[];
  } | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!params.deckId) return;

    const loadData = async () => {
      try {
        // Start study session
        const sessionRes = await api.post('/study/session/start', { 
          deckId: params.deckId 
        });
        setSessionId(sessionRes.data.sessionId);

        // Load cards
        const res = await api.get(`/study/next?deckId=${params.deckId}`);
        if (res.data.length === 0) {
          setFinished(true);
        } else {
          setCards(res.data);
          setCurrentCardIndex(0);
          setIsFlipped(false);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, [params.deckId]);

  useEffect(() => {
    if (params.deckId) {
      api.get(`/decks/${params.deckId}`)
        .then(res => setDeckTitle(res.data.title))
        .catch(() => setDeckTitle('Unknown Deck'));
    }
  }, [params.deckId]);

  const handleRate = async (response: string) => {
    const card = cards[currentCardIndex];
    const cardId = card.card.id;
    const latency = 1000;

    try {
      await api.post('/study/review', { cardId, response, latency });
      
      if (currentCardIndex < cards.length - 1) {
        setTimeout(() => {
          setCurrentCardIndex(currentCardIndex + 1);
          setIsFlipped(false);
        }, 200);
      } else {
        await endSessionAndGenerate();
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting review');
    }
  };

  const endSessionAndGenerate = async () => {
    if (!sessionId) {
      setFinished(true);
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.post('/study/session/end', { sessionId });
      setGenerationResults({
        generated: response.data.generated || 0,
        byDifficulty: response.data.byDifficulty || []
      });
    } catch (error) {
      console.error('Error generating cards:', error);
    } finally {
      setIsGenerating(false);
      setFinished(true);
    }
  };

  // Loading screen during card generation
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 text-center px-4 py-6">
        <div className="bg-white p-8 sm:p-12 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-linear-to-br from-cyan-400 to-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-slate-900">
            Generating New Cards
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            AI is analyzing your study session and creating personalized flashcards based on your performance...
          </p>
        </div>
      </div>
    );
  }

  // Completion screen
  if (finished) {
    const hasGeneratedCards = generationResults && generationResults.generated > 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 text-center px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl max-w-lg w-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">
            Session Complete!
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
            You&apos;ve reviewed all scheduled cards for now. Great job keeping up with your streak! 🎉
          </p>

          {hasGeneratedCards && (
            <div className="mb-6 p-4 sm:p-5 bg-linear-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {generationResults.generated} New Card{generationResults.generated !== 1 ? 's' : ''} Generated
                </h3>
              </div>
              
              <div className="space-y-2 text-left max-h-48 overflow-y-auto">
                {generationResults.byDifficulty.map((result, idx) => (
                  result.generated > 0 && (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className={`px-2 py-1 rounded-md font-semibold text-xs shrink-0 ${
                        result.difficulty === 'Again' ? 'bg-red-100 text-red-700' :
                        result.difficulty === 'Hard' ? 'bg-amber-100 text-amber-700' :
                        result.difficulty === 'Good' ? 'bg-cyan-100 text-cyan-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {result.difficulty}
                      </span>
                      <span className="text-slate-700 flex-1">
                        {result.generated} card{result.generated !== 1 ? 's' : ''} on: {result.topics.join(', ')}
                      </span>
                    </div>
                  )
                ))}
              </div>
              
              <p className="text-xs text-slate-500 mt-3 text-center">
                These cards have been added to your deck and will appear in future sessions.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={async () => {
                setInfoMsg(null);
                try {
                  const res = await api.get(`/study/next?deckId=${params.deckId}`);
                  if (res.data && res.data.length > 0) {
                    setCards(res.data);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setFinished(false);
                    const sessionRes = await api.post('/study/session/start', { deckId: params.deckId });
                    setSessionId(sessionRes.data.sessionId);
                  } else {
                    setInfoMsg('No cards due right now. New cards will appear when scheduled.');
                  }
                } catch (e) {
                  setInfoMsg('Could not load more cards. Please try again.');
                }
              }} 
              className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700" 
              size="lg"
            >
              Study More
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline"
              className="w-full" 
              size="lg"
            >
              Back to Dashboard
            </Button>
          </div>

          {infoMsg && (
            <p className="text-xs text-slate-500 mt-3 text-center">{infoMsg}</p>
          )}
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (cards.length === 0) return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 px-4">
      <div className="flex flex-col items-center">
        <div className="animate-pulse space-y-4">
          <div className="h-48 w-full max-w-sm bg-slate-200 rounded-2xl"></div>
          <div className="h-6 w-32 bg-slate-200 rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );

  const currentItem = cards[currentCardIndex];
  const cardData = currentItem.card;
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard')}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> 
          <span className="hidden sm:inline">Quit</span>
        </Button>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="px-2 sm:px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs sm:text-sm font-semibold max-w-[150px] sm:max-w-none truncate">
            {deckTitle || 'Loading...'}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-700 min-w-[3rem] text-right">
            {currentCardIndex + 1}/{cards.length}
          </span>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-6 min-h-0">
        <div className="relative w-full max-w-2xl" style={{ height: 'min(70vh, 500px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCardIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: '1000px' }}
            >
              <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ 
                  transformStyle: 'preserve-3d',
                  position: 'relative'
                }}
              >
                {/* Front - Question Card */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  <GlowCard 
                    glowColor="blue" 
                    customSize={true}
                    className="w-full h-full"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 md:p-10 bg-white rounded-2xl overflow-y-auto">
                      <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs sm:text-sm font-semibold mb-4 shrink-0 border border-amber-100">
                        Question
                      </span>
                      <div className="flex-1 flex items-center justify-center w-full">
                        <h3 className="text-lg sm:text-2xl md:text-3xl font-semibold text-center leading-relaxed text-slate-900 px-2 break-words">
                          {cardData.front}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 mt-4 shrink-0">
                        Tap to reveal answer
                      </p>
                    </div>
                  </GlowCard>
                </div>

                {/* Back - Answer Card */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  <GlowCard 
                    glowColor="blue" 
                    customSize={true}
                    className="w-full h-full"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 md:p-10 bg-linear-to-br from-cyan-50 to-white rounded-2xl overflow-y-auto">
                      <span className="px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-xs sm:text-sm font-semibold mb-4 shrink-0 border border-cyan-200">
                        Answer
                      </span>
                      <div className="flex-1 flex items-center justify-center w-full">
                        <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-center leading-relaxed text-slate-900 px-2 break-words">
                          {cardData.back}
                        </h3>
                      </div>
                    </div>
                  </GlowCard>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] z-10 px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-cyan-500 via-blue-500 to-blue-600"
                initial={{ width: `${((currentCardIndex) / cards.length) * 100}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 min-w-[3rem] text-right">
              {Math.round(progress)}%
            </span>
          </div>
          
          {!isFlipped ? (
            <Button 
              onClick={() => setIsFlipped(true)} 
              size="lg" 
              className="w-full text-base sm:text-lg py-5 sm:py-6 rounded-xl sm:rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all font-semibold"
            >
              Show Answer
            </Button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
              <RatingButton 
                label="Again" 
                sublabel="< 1m"
                emoji="😰"
                color="bg-red-50 text-red-700 hover:bg-red-100 border-red-200" 
                onClick={() => handleRate('Again')} 
              />
              <RatingButton 
                label="Hard" 
                sublabel="< 10m"
                emoji="😅"
                color="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" 
                onClick={() => handleRate('Hard')} 
              />
              <RatingButton 
                label="Good" 
                sublabel="4d"
                emoji="🙂"
                color="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200 ring-2 ring-cyan-200" 
                onClick={() => handleRate('Good')} 
              />
              <RatingButton 
                label="Easy" 
                sublabel="7d"
                emoji="😎"
                color="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" 
                onClick={() => handleRate('Easy')} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingButton({ 
  label, 
  sublabel,
  emoji,
  color, 
  onClick 
}: { 
  label: string;
  sublabel?: string;
  emoji?: string;
  color: string; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`py-3 sm:py-4 px-2 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base border-2 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 ${color}`}
    >
      <span className="text-lg sm:text-xl leading-none">{emoji}</span>
      <span className="leading-tight">{label}</span>
      {sublabel && (
        <span className="text-[10px] sm:text-xs opacity-60 font-normal leading-none">
          {sublabel}
        </span>
      )}
    </button>
  );
}