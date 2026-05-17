'use client';

import { motion } from 'framer-motion';
import { Zap, ScrollText, ListTodo, ShieldCheck } from 'lucide-react';
import { ReactNode } from 'react';

interface Step {
  icon: ReactNode;
  number: string;
  title: string;
  description: string;
}

export function HowItWorks() {
  const steps: Step[] = [
    {
      icon: <Zap className="w-5 h-5" />,
      number: '01',
      title: 'Set up in 5 minutes',
      description: 'Add your flat, invite roommates, and start tracking. No onboarding maze.',
    },
    {
      icon: <ScrollText className="w-5 h-5" />,
      number: '02',
      title: 'Expenses, simplified',
      description: 'Snap a receipt, set the split, done. No more spreadsheet nightmares.',
    },
    {
      number: '03',
      icon: <ListTodo className="w-5 h-5" />,
      title: 'Chores on autopilot',
      description: 'Rotating schedule with reminders. Everyone does their share, no nagging.',
    },
    {
      number: '04',
      icon: <ShieldCheck className="w-5 h-5" />,
      title: 'Total transparency',
      description: 'Real-time balances visible to everyone. No surprises at month end.',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-medium text-accent uppercase tracking-[0.15em] mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Set up in minutes
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-sm">
            Features are great. Here&apos;s what it actually feels like to use FlatMate.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="relative p-6 rounded-2xl bg-white/2 border border-white/6 hover:border-white/10 transition-all duration-300 h-full">
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">{step.number}</span>
                </div>

                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 mb-4 group-hover:text-white group-hover:border-white/20 transition-all">
                  {step.icon}
                </div>

                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-white/10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
