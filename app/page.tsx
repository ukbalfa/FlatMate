import type { Metadata } from 'next';
import LandingPageClient from '@/components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'FlatMate | Co-living without the chaos',
  description: 'Split bills, track chores, and manage your household with FlatMate. The modern expense-sharing platform for roommates.',
  keywords: ['roommate app', 'bill splitting', 'chore management', 'household expenses', 'shared living'],
  openGraph: {
    title: 'FlatMate | Co-living without the chaos',
    description: 'Split bills, track chores, and manage your household with FlatMate.',
    type: 'website',
  },
};

// Structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FlatMate',
  description: 'FlatMate helps roommates split bills, track chores, and manage household expenses seamlessly.',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '4',
    priceCurrency: 'USD',
    offerCount: '2',
    offers: [
      {
        '@type': 'Offer',
        name: 'Basic Plan',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free plan with basic features for managing household expenses and chores',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '4',
        priceCurrency: 'USD',
        description: 'Premium features including advanced expense tracking and roommate management',
      },
    ],
  },
  featureList: [
    'Bill Splitting',
    'Chore Management',
    'Expense Tracking',
    'Roommate Profiles',
    'Real-time Currency Conversion',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '1250',
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPageClient />
    </>
  );
}