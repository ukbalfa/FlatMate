'use client';

import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Features } from './Features';
import { HowItWorks } from './HowItWorks';
import { Testimonials } from './Testimonials';
import { Pricing } from './Pricing';
import { CTA } from './CTA';
import { Footer } from './Footer';

export default function LandingPageClient() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#050505]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
