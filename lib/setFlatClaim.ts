import { User } from 'firebase/auth';

export async function setFlatClaimAndRefresh(
  user: User,
  flatId: string,
): Promise<void> {
  const idToken = await user.getIdToken();

  const res = await fetch('/api/auth/set-flat-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, flatId }),
  });

  if (!res.ok) {
    throw new Error('Failed to set flat claim');
  }

  await user.getIdToken(true);

  const freshToken = await user.getIdToken();
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: freshToken }),
  });
}
