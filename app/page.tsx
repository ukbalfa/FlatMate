'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, CheckCircle2, Zap, LayoutGrid, Users, DollarSign } from 'lucide-react';
import { useState, useRef } from 'react';

// --- Reusable Navigation ---
function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-6xl z-50 flex items-center justify-between px-6 py-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
    >
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-full bg-gradient-citrus flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
          F
        </div>
        <span className="font-space-grotesk font-bold text-xl tracking-tight text-white group-hover:text-white/80 transition-colors">
          flatmate
        </span>
      </Link>
      <div className="hidden md:flex items-center gap-8 font-dm-sans text-sm font-medium text-white/60">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
      </div>
      <Link href="/login" className="fm-btn-primary px-6 py-2.5 rounded-full text-sm hover:scale-105 transition-all">
        Start Free
      </Link>
    </motion.nav>
  );
}

// --- Hero Section ---
function Hero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center pt-24 overflow-hidden bg-[#0A0A0A]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[#F97316] blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[#84CC16] blur-[100px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center px-4 w-full max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-white/80 mb-8 flex items-center gap-2 font-dm-mono uppercase tracking-widest"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
          Redefining Shared Living
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center font-space-grotesk font-bold text-5xl md:text-7xl lg:text-[5.5rem] tracking-tighter leading-[1.05] text-white mb-8"
        >
          Co-living without<br />
          <span className="text-transparent bg-clip-text bg-gradient-citrus">the chaos.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-center text-white/60 text-lg md:text-xl font-dm-sans max-w-2xl mb-12 leading-relaxed"
        >
          Split bills, track chores, and manage your household in one seamless app. Because harmony shouldn't be hard work.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/login" className="fm-btn-primary px-8 py-4 rounded-xl text-lg w-full sm:w-auto flex items-center gap-2 group shadow-[0_0_40px_-10px_#F97316]">
            Get Started <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
          <Link href="#features" className="px-8 py-4 rounded-xl text-lg text-white font-bold border border-white/20 hover:bg-white/5 transition-colors w-full sm:w-auto text-center">
            See Features
          </Link>
        </motion.div>
      </motion.div>

      {/* Hero UI Mockup Element */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-24 w-full max-w-5xl px-4 z-20 perspective-1000"
      >
        <div className="rounded-[2rem] border border-white/10 bg-[#121212]/80 backdrop-blur-xl p-2 sm:p-4 shadow-2xl relative overflow-hidden transform rotateX-12 shadow-[0_40px_100px_-20px_rgba(249,115,22,0.2)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F97316] to-[#FBBF24]" />
          <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] aspect-[16/9] flex items-center justify-center overflow-hidden relative">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
             {/* Abstract UI representation */}
             <div className="w-full h-full p-8 flex flex-col gap-6 opacity-80">
                <div className="flex justify-between items-center w-full pb-6 border-b border-white/5">
                  <div className="h-6 w-32 bg-white/10 rounded-full" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-[#F97316]/20 rounded-full" />
                    <div className="h-8 w-8 bg-[#84CC16]/20 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 flex-1">
                  <div className="col-span-2 bg-white/5 rounded-xl border border-white/5 p-6 flex flex-col justify-end">
                    <div className="h-4 w-1/3 bg-white/10 rounded-full mb-3" />
                    <div className="h-8 w-1/2 bg-white/20 rounded-md" />
                  </div>
                  <div className="col-span-1 bg-gradient-to-br from-[#F97316]/20 to-transparent rounded-xl border border-[#F97316]/10" />
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// --- Bento Grid Features ---
function BentoFeatures() {
  const features = [
    {
      title: "Smart Split",
      desc: "Instantly divide groceries, rent, and utilities without doing the math.",
      icon: <DollarSign className="w-6 h-6 text-[#F97316]" />,
      className: "md:col-span-2 md:row-span-1 bg-gradient-to-br from-[#1A1108] to-[#0A0A0A] border-[#F97316]/20",
      content: (
        <div className="absolute right-0 bottom-0 p-6 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
          <div className="text-[8rem] leading-none font-space-grotesk font-black text-[#F97316]/20">01</div>
        </div>
      )
    },
    {
      title: "Chore Rotation",
      desc: "Fair algorithms ensure nobody cleans the bathroom three weeks in a row.",
      icon: <Sparkles className="w-6 h-6 text-[#84CC16]" />,
      className: "md:col-span-1 md:row-span-2 bg-gradient-to-br from-[#0F170A] to-[#0A0A0A] border-[#84CC16]/20",
      content: (
        <div className="w-full mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-white/5 border border-white/5 flex items-center px-4 gap-3">
              <div className="w-4 h-4 rounded-full border border-white/20" />
              <div className="h-2 w-16 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Notice Board",
      desc: "Leave notes, announcements, and passive-aggressive reminders.",
      icon: <LayoutGrid className="w-6 h-6 text-[#38BDF8]" />,
      className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-[#08131A] to-[#0A0A0A] border-[#38BDF8]/20",
      content: null
    },
    {
      title: "Roommate Hub",
      desc: "Manage invites and roles seamlessly.",
      icon: <Users className="w-6 h-6 text-[#A78BFA]" />,
      className: "md:col-span-1 md:row-span-1 bg-gradient-to-br from-[#120B1A] to-[#0A0A0A] border-[#A78BFA]/20",
      content: null
    }
  ];

  return (
    <section id="features" className="py-32 px-4 md:px-8 max-w-6xl mx-auto bg-[#0A0A0A]">
      <div className="mb-20">
        <h2 className="text-4xl md:text-5xl font-space-grotesk font-bold text-white mb-6 tracking-tight">
          Everything you need.<br/>
          <span className="text-white/40">Nothing you don't.</span>
        </h2>
        <p className="text-white/60 font-dm-sans max-w-xl text-lg">
          We've stripped away the complexity of managing a house and left only the essential tools that keep the peace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
        {features.map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`group relative rounded-[2rem] border p-8 overflow-hidden hover:scale-[1.02] transition-transform duration-300 ${feature.className}`}
          >
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-space-grotesk font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60 font-dm-sans leading-relaxed text-sm max-w-[80%]">
                {feature.desc}
              </p>
            </div>
            {feature.content}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// --- Value Proposition ---
function ValueProp() {
  return (
    <section className="py-32 relative overflow-hidden bg-[#050505] border-y border-white/5">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-space-grotesk font-bold text-white leading-[1.1] tracking-tight">
              Stop arguing about who bought the toilet paper.
            </h2>
            <p className="text-xl text-white/50 font-dm-sans">
              FlatMate creates a single source of truth for your household. Transparency means trust, and trust means a happier home.
            </p>
            
            <ul className="space-y-4">
              {[
                "100% Transparency on all expenses",
                "Automated push notifications for chores",
                "Export data anytime"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80 font-dm-sans">
                  <CheckCircle2 className="w-5 h-5 text-[#84CC16]" />
                  {item}
                </li>
              ))}
            </ul>

            <button className="fm-btn-primary px-8 py-3 rounded-full mt-4">
              Read Our Manifesto
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-square md:aspect-[4/3] rounded-[2rem] border border-white/10 overflow-hidden bg-[#0A0A0A] group"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#F97316]/20 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-[10rem] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">
               🤝
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// --- Pricing ---
function Pricing() {
  return (
    <section id="pricing" className="py-32 px-4 md:px-8 max-w-6xl mx-auto bg-[#0A0A0A]">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-space-grotesk font-bold text-white mb-6 tracking-tight">
          Simple, transparent pricing.
        </h2>
        <p className="text-white/60 font-dm-sans text-lg">
          No hidden fees. Just peace of mind.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 flex flex-col">
          <h3 className="text-2xl font-space-grotesk font-bold text-white mb-2">Basic Flat</h3>
          <p className="text-white/50 text-sm mb-8">Perfect for small apartments.</p>
          <div className="text-5xl font-bold text-white font-space-grotesk mb-8">
            $0 <span className="text-lg text-white/30 font-dm-sans font-normal">/mo</span>
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            <li className="flex items-center gap-3 text-white/70 text-sm"><CheckCircle2 className="w-5 h-5 text-white/30" /> Up to 3 roommates</li>
            <li className="flex items-center gap-3 text-white/70 text-sm"><CheckCircle2 className="w-5 h-5 text-white/30" /> Basic expense tracking</li>
            <li className="flex items-center gap-3 text-white/70 text-sm"><CheckCircle2 className="w-5 h-5 text-white/30" /> 1 chore rotation cycle</li>
          </ul>
          <Link href="/login" className="w-full py-4 rounded-xl border border-white/20 text-white font-bold text-center hover:bg-white/10 transition-colors">
            Get Started
          </Link>
        </div>

        {/* Pro Tier */}
        <div className="rounded-[2rem] border border-[#F97316]/50 bg-gradient-to-b from-[#1A0A00] to-[#0A0A0A] p-10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-citrus" />
          <div className="absolute top-8 right-8 bg-[#F97316]/20 text-[#F97316] text-xs font-bold px-3 py-1 rounded-full border border-[#F97316]/30">
            RECOMMENDED
          </div>
          
          <h3 className="text-2xl font-space-grotesk font-bold text-white mb-2">Mansion</h3>
          <p className="text-white/50 text-sm mb-8">For serious shared living.</p>
          <div className="text-5xl font-bold text-white font-space-grotesk mb-8">
            $4 <span className="text-lg text-white/30 font-dm-sans font-normal">/mo</span>
          </div>
          <ul className="space-y-4 mb-10 flex-1">
            <li className="flex items-center gap-3 text-white"><CheckCircle2 className="w-5 h-5 text-[#F97316]" /> Unlimited roommates</li>
            <li className="flex items-center gap-3 text-white"><CheckCircle2 className="w-5 h-5 text-[#F97316]" /> Advanced analytics & exports</li>
            <li className="flex items-center gap-3 text-white"><CheckCircle2 className="w-5 h-5 text-[#F97316]" /> Custom chore algorithms</li>
            <li className="flex items-center gap-3 text-white"><CheckCircle2 className="w-5 h-5 text-[#F97316]" /> Priority support</li>
          </ul>
          <Link href="/login" className="w-full py-4 rounded-xl fm-btn-primary text-center">
            Upgrade to Mansion
          </Link>
        </div>
      </div>
    </section>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="bg-[#050505] pt-32 pb-12 border-t border-white/5 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-space-grotesk font-black text-white mb-8 tracking-tighter">
            Ready to fix<br />your flat?
          </h2>
          <Link href="/login" className="fm-btn-primary px-10 py-5 rounded-2xl text-xl shadow-glow inline-flex items-center gap-3">
            Join FlatMate Now <Zap className="w-6 h-6" />
          </Link>
        </motion.div>

        <div className="w-full border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-citrus flex items-center justify-center text-white font-bold text-xs">
              F
            </div>
            <span className="font-space-grotesk font-bold text-white">flatmate</span>
          </div>
          
          <div className="flex gap-6 text-sm text-white/40 font-dm-sans">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          
          <div className="text-white/20 text-sm font-dm-mono">
            &copy; {new Date().getFullYear()} FlatMate.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#F97316] selection:text-white font-dm-sans">
      <Navbar />
      <Hero />
      <BentoFeatures />
      <ValueProp />
      <Pricing />
      <Footer />
    </div>
  );
}