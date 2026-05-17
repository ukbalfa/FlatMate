'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { collection, getDocs, updateDoc, doc, setDoc, query, orderBy, where } from 'firebase/firestore';
import { Plus, Phone, ExternalLink, X, Edit2, Send, Trash2, Copy } from 'lucide-react';
import { SkeletonCard } from '../../components/Skeleton';
import { toast } from 'sonner';
import { useI18n } from '../../../context/I18nContext';
import { useAuth } from '../../../context/AuthContext';
import { logError } from '../../../lib/errorLogger';
import type { Roommate } from '../../../lib/types';
import { deleteRoommateAction } from '../../actions/deleteRoommate';



const COLORS = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Amber', value: 'amber', class: 'bg-amber-400' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Orange', value: 'teal', class: 'bg-[#F97316]' },
  { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
];

function getColorClass(color: string) {
  return COLORS.find(c => c.value === color)?.class || 'bg-gray-400';
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

function sanitizeSocialHandle(value: string): string {
  if (!value) return '';
  let cleaned = value.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/^t\.me\//i, '');
  cleaned = cleaned.replace(/^instagram\.com\//i, '');
  cleaned = cleaned.replace(/^@/, '');
  cleaned = cleaned.trim();
  return cleaned;
}

function formatMonth(val: unknown): string {
  if (!val) return 'Just joined';
  let date: Date;
  if (val instanceof Date) {
    date = val;
  } else if (typeof val === 'number') {
    date = new Date(val);
  } else if (typeof val === 'object') {
    const ts = val as FirestoreTimestamp;
    if (ts.toDate) {
      date = ts.toDate();
    } else if (ts.seconds) {
      date = new Date(ts.seconds * 1000);
    } else {
      date = new Date(String(val));
    }
  } else {
    date = new Date(String(val));
  }
  if (isNaN(date.getTime())) return 'Just joined';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function RoommatesPage() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const [users, setUsers] = useState<Roommate[]>([]);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [color, setColor] = useState('blue');
  const [occupation, setOccupation] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Roommate>>({});
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [roommateToDelete, setRoommateToDelete] = useState<Roommate | null>(null);

  const fetchUsers = async () => {
    if (!userProfile?.flatId) return;
    const snap = await getDocs(query(collection(db, 'users'), where('flatId', '==', userProfile.flatId), orderBy('createdAt', 'desc')));
    setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Roommate)));
  };

  useEffect(() => {
    if (!userProfile?.flatId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('flatId', '==', userProfile!.flatId), orderBy('createdAt', 'desc')));
        if (!mounted) return;
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Roommate)));
      } catch (error) {
        if (!mounted) return;
      logError(error, 'Roommates.fetchUsers');
        toast.error('Failed to load roommates. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.flatId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;
    setAdding(true);
    try {
      const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      const secondaryApp = getApps().find(a => a.name === 'Secondary')
        ?? initializeApp(config, 'Secondary');
      const secondaryAuth = getAuth(secondaryApp);
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, username, password);
      await signOut(secondaryAuth);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name, surname, username, role: 'roommate', color,
        occupation, phone,
        telegram: sanitizeSocialHandle(telegram),
        instagram: sanitizeSocialHandle(instagram),
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        flatId: userProfile?.flatId,
      });
      setName(''); setSurname(''); setUsername(''); setPassword('');
      setColor('blue'); setOccupation(''); setPhone(''); setTelegram(''); setInstagram('');
      setAdding(false);
      fetchUsers();
      toast.success('Roommate added successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add roommate';
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (u: Roommate) => {
    setEditingId(u.id ?? null);
    setEditForm({
      occupation: u.occupation || '', phone: u.phone || '',
      telegram: u.telegram || '', instagram: u.instagram || '',
      name: u.name || '', surname: u.surname || '', color: u.color || 'blue',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const sanitizedForm = {
        ...editForm,
        telegram: editForm.telegram ? sanitizeSocialHandle(editForm.telegram) : '',
        instagram: editForm.instagram ? sanitizeSocialHandle(editForm.instagram) : '',
      };
      await updateDoc(doc(db, 'users', editingId), sanitizedForm);
      setEditingId(null);
      setEditForm({});
      toast.success('Profile updated');
      fetchUsers();
    } catch (error) {
      logError(error, 'Roommates.saveEdit');
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!roommateToDelete) return;
    if (roommateToDelete.role === 'admin') {
      toast.error('You cannot remove an admin.');
      return;
    }

    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const result = await deleteRoommateAction(roommateToDelete.id ?? '', idToken);
      if (result.success) {
        setUsers(prev => prev.filter(r => r.id !== roommateToDelete.id));
        setRoommateToDelete(null);
        toast.success('Roommate completely removed');
      } else {
        toast.error(result.error || 'Failed to remove roommate');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove roommate';
      toast.error(message);
    }
  };

  const toTimestamp = (val: string | FirestoreTimestamp): number => {
    if (!val) return 0;
    if (typeof val === 'string') return new Date(val).getTime();
    if (val.toDate) return val.toDate().getTime();
    if (val.seconds) return val.seconds * 1000;
    return 0;
  };

const sortedRoommates = [...users].sort((a, b) =>
    sortBy === 'name'
      ? (a.name ?? '').localeCompare(b.name ?? '')
      : toTimestamp(b.joinedAt) - toTimestamp(a.joinedAt)
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 w-full gap-4">
          <h2 className="text-xl font-bold text-white">{t('roommates.title')}</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{t('roommates.sortBy')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="appearance-none bg-[#1a1d27] border border-white/10 text-white text-sm rounded-lg focus:ring-[#F97316] focus:border-[#F97316] block px-4 py-2 outline-none cursor-pointer hover:bg-white/5 transition-colors shadow-sm"
            >
              <option value="date">{t('roommates.dateJoined')}</option>
              <option value="name">{t('roommates.alphabetical')}</option>
            </select>
          </div>
        </div>

        {userProfile?.flatId && isAdmin && (
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Flat Invite Code</p>
              <p className="text-gray-400 text-sm">Share this code with new roommates so they can join your flat.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-mono font-bold tracking-widest text-amber-400">{userProfile.flatId}</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(userProfile.flatId!);
                  toast.success('Code copied!');
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <Copy className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </>
          ) : (
            <>
              {sortedRoommates.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                  className="relative flex flex-col items-center p-6 bg-[#1a1d27] border border-white/5 rounded-xl h-full"
                >
                  {editingId === u.id ? (
                    <div className="space-y-3 w-full">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-[#F97316]">Edit Profile</h3>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-white transition-colors"
                          aria-label="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                          placeholder="Name"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                          placeholder="Surname"
                          value={editForm.surname || ''}
                          onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                        />
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                          placeholder="Occupation"
                          value={editForm.occupation || ''}
                          onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                        />
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                          placeholder="Phone"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                          placeholder="Telegram"
                          value={editForm.telegram || ''}
                          onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
                        />
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                          placeholder="Instagram"
                          value={editForm.instagram || ''}
                          onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                        />
                        <select
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                          value={editForm.color || 'blue'}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        >
                          {COLORS.map((c) => (
                            <option key={c.value} value={c.value} className="bg-[#1a1d27]">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={saveEdit}
                          className="flex-1 bg-[#F97316] text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#EA6D0E] transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/15 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center w-full">
                      {userProfile?.role === 'admin' && (
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={() => startEdit(u)}
                            className="text-gray-500 hover:text-white transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
                            title="Edit"
                            aria-label="Edit roommate"
                          >
                            <Edit2 size={16} />
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => setRoommateToDelete(u)}
                              className="text-gray-500 hover:text-red-400 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
                              title="Remove"
                              aria-label="Remove roommate"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${getColorClass(
                          u.color
                        )}`}
                      >
                        {(u.name?.[0] || '?').toUpperCase()}
                        {(u.surname?.[0] || '').toUpperCase()}
                      </div>
                      <div className="text-lg font-semibold text-white mt-4 flex items-center gap-2">
                        {u.name}
                        {u.surname ? ` ${u.surname}` : ''}
                        {(u.username === userProfile?.username || u.id === userProfile?.uid) && (
                          <span className="bg-teal-500/20 text-teal-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">You</span>
                        )}
                      </div>
                      {u.occupation && (
                        <div className="text-sm text-gray-400 mt-1">{u.occupation}</div>
                      )}
                      <div className="mt-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            u.role === 'admin'
                              ? 'bg-[#F97316] text-white'
                              : 'bg-white/10 text-gray-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>

                      <div className="w-full h-px bg-white/5 my-4"></div>

                      <div className="w-full flex flex-col gap-2 mb-4">
                        {u.phone && (
                          <a
                            href={`tel:${u.phone}`}
                            className="flex items-center gap-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            <Phone size={14} />
                            <span>{u.phone}</span>
                          </a>
                        )}
                        {u.telegram && (
                          <a
                            href={`https://t.me/${u.telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            <Send size={14} />
                            <span>{u.telegram}</span>
                          </a>
                        )}
                        {u.instagram && (
                          <a
                            href={`https://instagram.com/${u.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            <ExternalLink size={14} />
                            <span>{u.instagram}</span>
                          </a>
                        )}
                      </div>

                      <div className="w-full text-center mt-auto text-xs text-gray-500">
                        Member since {formatMonth(u.joinedAt)}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Admin Add Roommate Card */}
              {userProfile?.role === 'admin' && !adding && (
                <button
                  onClick={() => setAdding(true)}
                  className="h-full min-h-[280px] flex flex-col items-center justify-center bg-transparent border-2 border-dashed border-gray-600 rounded-xl hover:border-gray-400 hover:bg-white/5 transition-all cursor-pointer text-gray-400 hover:text-white"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="font-medium">{t('roommates.addRoommate')}</span>
                </button>
              )}

              {userProfile?.role === 'admin' && adding && (
                <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{t('roommates.addRoommate')}</h3>
                    <button
                      onClick={() => setAdding(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAdd} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Name *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Surname"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Username *"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password *"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Occupation"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Telegram"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    />
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    >
                      {COLORS.map((c) => (
                        <option key={c.value} value={c.value} className="bg-[#1a1d27]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="w-full bg-[#F97316] text-white rounded-lg px-4 py-3 font-medium hover:bg-[#EA6D0E] transition"
                    >
                      Add Roommate
                    </button>
                  </form>
                </div>
              )}

              {roommateToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="remove-roommate-title">
                  <div className="bg-[#1a1d27] border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                    <h3 id="remove-roommate-title" className="text-xl font-bold text-white mb-2">Remove Roommate?</h3>
                    <p className="text-gray-400 mb-6 text-sm">Are you sure you want to remove <span className="text-white font-semibold">{roommateToDelete.name}</span>? This action cannot be undone and they will lose access to the dashboard.</p>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setRoommateToDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors min-h-[44px]">Cancel</button>
                      <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors min-h-[44px]">Yes, Remove</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
