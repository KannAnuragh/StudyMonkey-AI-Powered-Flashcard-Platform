'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { message?: string } } };
      const msg = maybeAxios?.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-linear-to-br from-cyan-500 via-blue-600 to-indigo-600 lg:bg-none relative overflow-hidden">
      {/* Background gradient overlay for mobile/tablet */}
      <div className="absolute inset-0 lg:hidden bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%)]" />
      
      {/* Desktop Left Panel - Gradient */}
      <div className="relative hidden lg:flex items-center justify-center bg-linear-to-br from-cyan-500 via-blue-600 to-indigo-600 p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_35%)]" />
        <div className="relative max-w-md space-y-4">
          <div className="pill bg-white/20 text-white">Study flow</div>
          <h1 className="text-4xl font-bold leading-tight">Log in and keep your streak alive.</h1>
          <p className="text-white/80">Pick up where you left off. Flashcards, decks, and AI-generated prompts are synced to your account.</p>
          <div className="flex items-center gap-3 text-sm text-white/80">
            <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center"><Brain className="w-5 h-5" /></div>
            <span>StudyMonkey · Student-first spaced repetition</span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12 lg:bg-white z-10">
        <Card className="w-full max-w-md soft-card bg-white shadow-lg border border-slate-200/70">
          <CardHeader className="space-y-1 text-center pt-6">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-sm">
              Sign in to continue your study sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full h-12 bg-linear-to-r from-cyan-500 to-blue-600 shadow-lg hover:shadow-xl transition-all" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4 pb-6">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-cyan-700 font-semibold underline-offset-4 hover:underline">
                Sign up
              </Link>
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Brain className="w-4 h-4" />
              <span>StudyMonkey · Student-first learning</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}