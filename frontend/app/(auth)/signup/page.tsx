'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Layers, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/signup', { email, password });
      router.push('/login');
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg = maybeAxios?.response?.data?.message || 'Signup failed. Email may be taken.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-linear-to-br from-amber-400 via-rose-400 to-cyan-400 lg:bg-none relative overflow-hidden">
      {/* Background gradient overlay for mobile/tablet */}
      <div className="absolute inset-0 lg:hidden bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.35),transparent_38%)]" />
      
      {/* Desktop Left Panel - Gradient */}
      <div className="relative hidden lg:flex items-center justify-center bg-linear-to-br from-amber-400 via-rose-400 to-cyan-400 p-12 text-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.35),transparent_38%)]" />
        <div className="relative max-w-md space-y-4">
          <div className="pill bg-white/60 text-slate-900">Join in minutes</div>
          <h1 className="text-4xl font-bold leading-tight">Create an account and auto-generate your first deck.</h1>
          <p className="text-slate-800">Upload notes, let AI draft the cards, and keep your study streak with calm, focused reviews.</p>
          <div className="flex items-center gap-3 text-sm text-slate-800">
            <div className="h-10 w-10 rounded-2xl bg-white/70 flex items-center justify-center"><Layers className="w-5 h-5" /></div>
            <span>Decks, streaks, and playlists in one place.</span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12 lg:bg-white z-10">
        <Card className="w-full max-w-md soft-card bg-white shadow-lg border border-slate-200/70">
          <CardHeader className="space-y-1 text-center pt-6">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold">Get Started</CardTitle>
            <CardDescription className="text-sm">
              Fill in your details to begin your study journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none text-slate-700">Email</label>
                <Input
                  id="email"
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none text-slate-700">Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
              <Button 
                className="w-full h-12 bg-linear-to-r from-amber-400 via-rose-400 to-cyan-400 text-slate-900 font-semibold shadow-lg hover:shadow-xl transition-all" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4 pb-6">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-cyan-700 font-semibold underline-offset-4 hover:underline">
                Login
              </Link>
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Layers className="w-4 h-4" />
              <span>Decks, streaks, and AI-powered reviews</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}