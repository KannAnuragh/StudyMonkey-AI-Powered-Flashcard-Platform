'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Layers, Zap, ArrowUpRight, CheckCircle, Clock, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Pricing } from '@/components/ui/pricing';
import { pricingPlans } from '@/lib/pricing-data';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="flex flex-col min-h-screen text-slate-900">
      {/* Navbar */}
      <header className="px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/60 border-b border-white/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Study that sticks</p>
            <p className="font-semibold text-lg">StudyMonkey</p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" className="px-4">Pricing</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="px-4">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="px-4 bg-linear-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              Join Free
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="sm:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg sm:hidden transition-all"
          >
            <div className="flex flex-col gap-2 p-4">
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="ghost" className="w-full justify-start h-11">Pricing</Button>
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="ghost" className="w-full justify-start h-11">Sign In</Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button className="w-full h-11 bg-linear-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                  Join Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 lg:py-10 px-6 lg:px-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -right-32 top-10 h-96 w-96 bg-linear-to-br from-cyan-400/30 to-sky-200/20 blur-3xl rounded-full" />
            <div className="absolute -left-16 bottom-0 h-96 w-96 bg-linear-to-tr from-amber-300/30 to-rose-200/40 blur-3xl rounded-full" />
          </div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 max-w-6xl mx-auto items-center relative">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-sm border border-slate-200/70">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Designed for busy students</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Turn textbooks into <span className="bg-clip-text text-transparent bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-600">ready-to-study</span> flashcards.
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-xl">
                Paste a link, upload a PDF, or drop your notes. StudyMonkey builds high-retention cards and schedules reviews so you can focus on learning, not organizing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-7 rounded-full bg-linear-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                    Start a study sprint
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-7 rounded-full border-slate-200 text-slate-700">
                    Browse the workspace
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'Avg. retention', value: '92%' },
                  { label: 'Cards generated', value: '2.1M' },
                  { label: 'Study streaks', value: '18 days' },
                  { label: 'Trusted students', value: '14k+' },
                ].map((stat) => (
                  <div key={stat.label} className="soft-card p-4 text-left">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="soft-card p-6 lg:p-8 bg-white/80">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">AI converts</p>
                    <p className="text-xl font-bold">Chapter 3 · Cognitive Psych</p>
                  </div>
                  <span className="pill bg-cyan-50 text-cyan-600">
                    <CheckCircle className="w-4 h-4" /> 24 cards ready
                  </span>
                </div>
                <div className="grid gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-200/70 bg-linear-to-r from-white via-white to-cyan-50/70 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Question</p>
                        <span className="text-xs text-slate-400">Neuro · 0{i}</span>
                      </div>
                      <p className="font-semibold text-slate-900">How do spaced reviews strengthen long-term memory formation?</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due in 8h</div>
                        <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> Confidence: steady</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">AI keeps adding fresh prompts as you read.</div>
                  <Button size="sm" className="w-full sm:w-auto rounded-full px-4 h-9 bg-linear-to-r from-amber-400 to-rose-400 text-slate-900 font-semibold whitespace-nowrap">
                    View sample deck
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 lg:px-12 py-20 bg-linear-to-b from-transparent via-slate-50/50 to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
              <div>
                <p className="pill bg-amber-50 text-amber-600">Built for study groups</p>
                <h2 className="text-3xl md:text-4xl font-bold mt-3">Everything you need to memorize faster</h2>
                <p className="text-slate-600 mt-2 max-w-2xl">AI cards, smart timing, clear analytics—study that sticks.</p>
              </div>
              <Link href="/signup" className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:gap-3 transition-all whitespace-nowrap">
                Explore the product <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <FeatureCard 
                icon={<Sparkles className="w-8 h-8 text-amber-500" />}
                title="AI drafts the cards"
                desc="Drop a URL, PDF, or notes. We pull key facts, definitions, diagrams, and examples into tight Q&A formats."
              />
              <FeatureCard 
                icon={<Layers className="w-8 h-8 text-cyan-500" />}
                title="Study playlists"
                desc="Decks become playlists with tags and streaks so your next 15-minute review is one tap away."
              />
              <FeatureCard 
                icon={<Zap className="w-8 h-8 text-indigo-500" />}
                title="Adaptive timing"
                desc="Smart intervals adjust based on confidence and speed so you don't waste reps on what you already know."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 lg:px-12 py-20">
          <div className="max-w-6xl mx-auto">
            <Pricing
              plans={pricingPlans}
              title="Plans for every learner"
              description={`Free, Study Beginners, and Experts tiers built for UPI payments and fast onboarding.`}
            />
            <div className="text-center">
              <Link href="/pricing" className="inline-flex items-center gap-2 text-cyan-700 font-semibold hover:gap-3 transition-all">
                View full pricing page <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 lg:px-12 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="soft-card bg-white/80 rounded-3xl p-8 md:p-10 flex flex-col items-center text-center gap-8">
              <div className="space-y-4 max-w-3xl">
                <p className="pill bg-cyan-50 text-cyan-700">Ready to retain more</p>
                <h3 className="text-3xl md:text-4xl font-bold">Start a smarter study habit today.</h3>
                <p className="text-slate-600 text-lg">Set a daily target, let AI build the cards, and keep your streak glowing. Works for exams, lectures, language vocab, and research summaries.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 rounded-full px-8 bg-linear-to-r from-cyan-500 to-blue-600 shadow-lg shadow-blue-500/30">Create my account</Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 rounded-full px-8">I already have one</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm">
        © 2024 StudyMonkey. Crafted for students who are actually a monkey.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Card className="soft-card h-full bg-white/80 hover:-translate-y-1 transition-all duration-300">
      <CardHeader>
        <div className="mb-3 h-12 w-12 rounded-2xl bg-linear-to-br from-cyan-500/15 via-blue-500/10 to-indigo-500/15 flex items-center justify-center">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  )
}