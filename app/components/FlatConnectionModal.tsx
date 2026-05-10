'use client';

import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { X, Users, Key, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '../../lib/errorLogger';

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function FlatConnectionModal() {
  const { userProfile, setShowFlatModal } = useAuth();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const code = generateInviteCode();
      // Ensure code is unique
      const existing = await getDoc(doc(db, 'flats', code));
      if (existing.exists()) {
        // Collision — try again
        return handleCreate();
      }
      await setDoc(doc(db, 'flats', code), {
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString(),
        members: [userProfile.uid],
      });
      // Update current user's flatId
      await setDoc(doc(db, 'users', userProfile.uid), { flatId: code }, { merge: true });
      setGeneratedCode(code);
      toast.success('Flat created! Share the code with your roommates.');
    } catch (error) {
      logError(error, 'FlatConnection.create');
      toast.error('Failed to create flat');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userProfile?.uid) return;
    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) {
      toast.error('Enter a valid 6-character code');
      return;
    }
    setLoading(true);
    try {
      const flatDoc = await getDoc(doc(db, 'flats', code));
      if (!flatDoc.exists()) {
        toast.error('Flat not found. Check the code with your roommate.');
        return;
      }
      await setDoc(doc(db, 'users', userProfile.uid), { flatId: code }, { merge: true });
      toast.success('You joined the flat!');
      setShowFlatModal(false);
    } catch (error) {
      logError(error, 'FlatConnection.join');
      toast.error('Failed to join flat');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleClose = () => {
    setShowFlatModal(false);
  };

  if (generatedCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Flat Created!</h2>
          <p className="text-gray-400 mb-6">Share this code with your roommates so they can join:</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl font-mono font-bold tracking-widest text-amber-400">{generatedCode}</span>
            <button onClick={handleCopy} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-amber-400 text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-amber-300 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Set Up Your Flat</h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'create' ? 'bg-amber-400 text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Create Flat
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'join' ? 'bg-amber-400 text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            Join Flat
          </button>
        </div>

        {tab === 'create' ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              Create a new flat and get a code to share with your roommates.
            </p>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-amber-400 text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-amber-300 transition disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Flat'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-4">
              Enter the 6-character code your roommate shared with you.
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g., A3X9K2"
              maxLength={6}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-amber-400 outline-none mb-4"
            />
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 6}
              className="w-full bg-amber-400 text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-amber-300 transition disabled:opacity-60"
            >
              {loading ? 'Joining...' : 'Join Flat'}
            </button>
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-300 mt-4 transition"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
