'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { Users, Key, Copy, Check, LogOut, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { logError } from '../../../lib/errorLogger';
import { motion } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function FlatPage() {
  const { userProfile } = useAuth();

  if (!userProfile?.flatId) {
    return <NoFlatView />;
  }

  return <FlatInfoView />;
}

function NoFlatView() {
  const { userProfile, refreshUserProfile } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (retryCount = 0) => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const code = generateInviteCode();
      const existing = await getDoc(doc(db, 'flats', code));
      if (existing.exists()) {
        return handleCreate(retryCount + 1);
      }
      await setDoc(doc(db, 'flats', code), {
        createdBy: userProfile.uid,
        createdAt: new Date().toISOString(),
        members: [userProfile.uid],
      });
      await setDoc(doc(db, 'users', userProfile.uid), { flatId: code }, { merge: true });
      await refreshUserProfile();
      setGeneratedCode(code);
      try { navigator.clipboard.writeText(code); } catch {}
      toast.success(`${t('onboarding.flatCreated')} — ${code}`, { duration: 8000 });
    } catch (error: unknown) {
      logError(error, 'FlatPage.create');
      const err = error as { code?: string };
      if (err.code === 'permission-denied' && retryCount === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        return handleCreate(retryCount + 1);
      }
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
      await updateDoc(doc(db, 'users', userProfile.uid), { flatId: code });
      const flatRef = doc(db, 'flats', code);
      const flatSnap = await getDoc(flatRef);
      if (flatSnap.exists()) {
        const flatData = flatSnap.data();
        const members = flatData.members || [];
        if (!members.includes(userProfile.uid)) {
          await updateDoc(flatRef, { members: [...members, userProfile.uid] });
        }
      }
      await refreshUserProfile();
      toast.success(t('common.done'));
    } catch (error) {
      logError(error, 'FlatPage.join');
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
    } catch {}
  };

  if (generatedCode) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('onboarding.flatCreated')}</h2>
          <p className="text-gray-400 mb-6">{t('onboarding.shareCode')}</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl font-mono font-bold tracking-widest text-accent">{generatedCode}</span>
            <button onClick={handleCopy} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('onboarding.title')}</h1>
        <p className="text-gray-400 mt-1">{t('onboarding.subtitle')}</p>
      </div>

      <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'create' ? 'bg-accent text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('onboarding.createFlat')}
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'join' ? 'bg-accent text-gray-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            {t('onboarding.joinFlat')}
          </button>
        </div>

        {tab === 'create' ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-6">{t('onboarding.createDesc')}</p>
            <button
              onClick={() => handleCreate()}
              disabled={loading}
              className="w-full bg-accent text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-orange-500 transition disabled:opacity-60"
            >
              {loading ? t('onboarding.creating') : t('onboarding.createFlat')}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 text-sm mb-4">{t('onboarding.joinDesc')}</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g., A3X9K2"
              maxLength={6}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-accent outline-none mb-4"
            />
            <button
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 6}
              className="w-full bg-accent text-gray-900 rounded-lg px-6 py-3 font-medium hover:bg-orange-500 transition disabled:opacity-60"
            >
              {loading ? t('onboarding.joining') : t('onboarding.joinFlat')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FlatInfoView() {
  const { userProfile, refreshUserProfile } = useAuth();
  const { t } = useI18n();
  const [flatData, setFlatData] = useState<{ createdBy: string; members: string[]; createdAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (!userProfile?.flatId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'flats', userProfile.flatId!));
        if (snap.exists()) {
          setFlatData(snap.data() as { createdBy: string; members: string[]; createdAt: string });
        }
      } catch (error) {
        logError(error, 'FlatPage.loadFlat');
      } finally {
        setLoading(false);
      }
    })();
  }, [userProfile?.flatId]);

  const handleCopyCode = () => {
    if (!userProfile?.flatId) return;
    try {
      navigator.clipboard.writeText(userProfile.flatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('common.copied'));
    } catch {}
  };

  const handleLeave = async () => {
    if (!userProfile?.uid || !userProfile?.flatId) return;
    setShowLeaveConfirm(true);
  };

  const confirmLeave = async () => {
    if (!userProfile?.uid || !userProfile?.flatId) return;
    setLeaving(true);
    try {
      const flatRef = doc(db, 'flats', userProfile.flatId);
      const snap = await getDoc(flatRef);
      if (snap.exists()) {
        const data = snap.data();
        const updatedMembers = (data.members || []).filter((id: string) => id !== userProfile.uid);
        await updateDoc(flatRef, { members: updatedMembers });
      }
      await updateDoc(doc(db, 'users', userProfile.uid), { flatId: deleteField() });
      await refreshUserProfile();
      toast.success(t('common.done'));
    } catch (error) {
      logError(error, 'FlatPage.leave');
      toast.error(t('settings.toast.somethingWrong'));
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">{t('common.loading')}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('nav.flat')}</h1>
        <p className="text-gray-400 mt-1">{t('flat.manageSubtitle') || 'Manage your flat membership'}</p>
      </div>

      <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">{t('flat.yourFlat') || 'Your Flat'}</h2>
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 mb-2">{t('flat.inviteCode') || 'Invite Code'}</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold tracking-widest text-accent">{userProfile?.flatId}</span>
            <button onClick={handleCopyCode} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">{t('flat.members') || 'Members'}</p>
          <p className="text-white text-lg font-medium">
            {flatData?.members.length || 1} {(flatData?.members.length || 1) === 1 ? (t('flat.member') || 'member') : (t('flat.members') || 'members')}
          </p>
        </div>

        {flatData?.createdBy === userProfile?.uid && (
          <p className="text-xs text-gray-500 mb-6">{t('flat.youAreCreator') || 'You are the flat creator'}</p>
        )}

        <button
          onClick={handleLeave}
          disabled={leaving}
          className="flex items-center gap-2 w-full justify-center px-4 py-2.5 border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {leaving ? (t('flat.leaving') || 'Leaving...') : (t('flat.leaveFlat') || 'Leave Flat')}
        </button>
      </div>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title={t('flat.leaveConfirm') || 'Leave Flat?'}
        message={t('flat.leaveConfirmMessage') || 'Are you sure you want to leave this flat? You will lose access to all shared data.'}
        confirmLabel={t('flat.leaveFlat') || 'Leave Flat'}
        onConfirm={confirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </motion.div>
  );
}
