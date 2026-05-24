'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Construction, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm glass-card rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto mb-3 flex items-center justify-center"><Construction className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join the AI COS platform</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div><label className="text-sm font-medium mb-1 block">Full Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={name} onChange={e => setName(e.target.value)} className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm" required /></div></div>
          <div><label className="text-sm font-medium mb-1 block">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm" required /></div></div>
          <div><label className="text-sm font-medium mb-1 block">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm" required /></div></div>
          <button type="submit" disabled={loading} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">{loading ? 'Creating...' : 'Create Account'} <ArrowRight className="w-4 h-4" /></button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-4">Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a></p>
      </div>
    </div>
  );
}
