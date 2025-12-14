'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GlowCard } from '@/components/ui/spotlight-card';
import { ArrowLeft, Trophy } from 'lucide-react';

interface CardType {
  id: string;
  front: string;
  back: string;
}

interface CardItem {
  card: CardType;
}

export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [deckTitle, setDeckTitle] = useState<string>('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!params.deckId) return;

    const loadData = async () => {
      try {
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
      // Fetch deck info to get the title
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
      setDirection(1);
      
      if (currentCardIndex < cards.length - 1) {
        setTimeout(() => {
          setCurrentCardIndex(currentCardIndex + 1);
          setIsFlipped(false);
          setDirection(0);
        }, 300);
      } else {
        setFinished(true);
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting review');
    }
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 text-center px-4 py-6 sm:p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
          >
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">Session Complete!</h2>
          <p className="text-slate-600 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
            You&apos;ve reviewed all scheduled cards for now. Great job keeping up with your streak! 🎉
          </p>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700" 
            size="lg"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (cards.length === 0) return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 px-4">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-48 w-full max-w-sm bg-slate-200 rounded-2xl mb-4"></div>
        <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );

  const currentItem = cards[currentCardIndex];
  const cardData = currentItem.card;
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-slate-50 via-white to-cyan-50 overflow-hidden">
      {/* Top bar - Improved mobile spacing */}
      <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard')}
          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> 
          <span className="hidden xs:inline">Quit</span>
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="px-2 sm:px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs sm:text-sm font-semibold">
            {deckTitle || 'Loading...'}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-700 min-w-12 text-right">
            {currentCardIndex + 1}/{cards.length}
          </span>
        </div>
      </div>

      {/* Card Area - Optimized for all screen sizes */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-6 min-h-0">
        <div className="relative w-full max-w-2xl" style={{ height: 'min(70vh, 500px)' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentCardIndex}
              custom={direction}
              initial={{ x: direction === 0 ? 300 : -300, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -300, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="w-full h-full cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: '1000px' }}
            >
              <motion.div
                className="relative w-full h-full"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 15 }}
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
                        <h3 className="text-lg sm:text-2xl md:text-3xl font-semibold text-center leading-relaxed text-slate-900 px-2 wrap-break-word">
                          {cardData.front}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 mt-4 shrink-0 animate-pulse">
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
                        <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-center leading-relaxed text-slate-900 px-2 wrap-break-word">
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

      {/* Controls - Enhanced mobile layout */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] z-10 px-3 sm:px-4 py-3 sm:py-4 safe-area-inset-bottom">
        <div className="max-w-5xl mx-auto flex flex-col gap-3">
          {/* Progress bar with percentage */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-cyan-500 via-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600 min-w-12 text-right">
              {Math.round(progress)}%
            </span>
          </div>
          
          {!isFlipped ? (
            <Button 
              onClick={() => setIsFlipped(true)} 
              size="lg" 
              className="w-full text-base sm:text-lg py-5 sm:py-6 rounded-xl sm:rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all font-semibold active:scale-[0.98]"
            >
              Show Answer
            </Button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
              <RatingButton 
                label="Again" 
                sublabel="< 1m"
                emoji="😰"
                color="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 hover:border-red-300" 
                onClick={() => handleRate('Again')} 
              />
              <RatingButton 
                label="Hard" 
                sublabel="< 10m"
                emoji="😅"
                color="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 hover:border-amber-300" 
                onClick={() => handleRate('Hard')} 
              />
              <RatingButton 
                label="Good" 
                sublabel="4d"
                emoji="🙂"
                color="bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200 hover:border-cyan-300 ring-2 ring-cyan-200" 
                onClick={() => handleRate('Good')} 
              />
              <RatingButton 
                label="Easy" 
                sublabel="7d"
                emoji="😎"
                color="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300" 
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
      className={`py-3 sm:py-4 px-2 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base border-2 transition-all transform active:scale-95 hover:scale-[1.02] flex flex-col items-center justify-center gap-0.5 ${color}`}
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