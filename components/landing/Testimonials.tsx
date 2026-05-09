'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  color: string;
}

export function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      name: 'Sarah M.',
      role: '3 roommates, Austin',
      content:
        'We used to argue about bills every month. Now everything is automatic and transparent. Best decision we made for our flat.',
      rating: 5,
      color: 'from-[#F97316]/20',
    },
    {
      name: 'James K.',
      role: '4 roommates, London',
      content:
        'The cleaning schedule alone is worth it. No more passive-aggressive sticky notes on the fridge. Game changer.',
      rating: 5,
      color: 'from-[#84CC16]/20',
    },
    {
      name: 'Elena R.',
      role: '2 roommates, Berlin',
      content:
        'We have different currencies between us. FlatMate handles the conversion in real-time. Absolutely essential.',
      rating: 5,
      color: 'from-[#38BDF8]/20',
    },
  ];

  return (
    <section className="relative py-24 px-4 md:px-8 overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#F97316]/[0.02] blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-medium text-[#F97316] uppercase tracking-[0.15em] mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Loved by roommates
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-sm">
            Join thousands of households already using FlatMate.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all duration-300"
            >
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${testimonial.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative z-10">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" />
                  ))}
                </div>

                <p className="text-sm text-white/60 leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/50">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{testimonial.name}</p>
                    <p className="text-xs text-white/30">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
