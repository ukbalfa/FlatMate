'use client';
import dynamic from 'next/dynamic';

const RentCountdown = dynamic(() => import('../../../components/RentCountdown'), { ssr: false });

export default function RentCountdownWidget() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
      <RentCountdown />
    </div>
  );
}
