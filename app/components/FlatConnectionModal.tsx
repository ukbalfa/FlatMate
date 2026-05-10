'use client';

import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { Users, Key, Copy, Check } from 'lucide-react';
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
  const { t } = useI18n();
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
      toast.success(t('onboarding.flatCreated'));
    } catch (error) {
      logError(error, 'FlatConnection.create');
      toast.error(t('settings.toast.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userProfile?.uid) return;
    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) {
      toast.error(t('onboarding.invalidCode'));
      return;
    }
    setLoading(true);
    try {
      const flatDoc = await getDoc(doc(db, 'flats', code));
      if (!flatDoc.exists()) {
        toast.error(t('onboarding.flatNotFound'));
        return;
      }
      await setDoc(doc(db, 'users', userProfile.uid), { flatId: code }, { merge: true });
      toast.success(t('common.done'));
      setShowFlatModal(false);
    } catch (error) {
      logError(error, 'FlatConnection.join');
      toast.error(t('settings.toast.somethingWrong'));
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
          <h2 className="text-xl font-bold text-white mb-2">{t('onboarding.flatCreated')}</h2>
          <p className="text-gray-400 mb-6">{t('onboarding.shareCode')}</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl font-mono font-bold tracking-widest text-[#F97316]">{generatedCode}</span>
            <button onClick={handleCopy} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="w-full bg-[#F97316] text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-orange-500 transition"
          >
            {t('onboarding.goToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">{t('onboarding.title')}</h2>
          <p className="text-gray-400 text-sm mt-2">{t('onboarding.subtitle')}</p>
        </div>

        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'create' ? 'bg-[#F97316] text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('onboarding.createFlat')}
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'join' ? 'bg-[#F97316] text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            {t('onboarding.joinFlat')}
          </button>
        </div>

        {tab === 'create' ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">
              {t('onboarding.createDesc')}
            </p>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-[#F97316] text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-orange-500 transition disabled:opacity-60"
            >
              {loading ? t('onboarding.creating') : t('onboarding.createFlat')}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-4">
              {t('onboarding.joinDesc')}
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g., A3X9K2"
              maxLength={6}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-[#F97316] outline-none mb-4"
            />
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 6}
              className="w-full bg-[#F97316] text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-orange-500 transition disabled:opacity-60"
            >
              {loading ? t('onboarding.joining') : t('onboarding.joinFlat')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
