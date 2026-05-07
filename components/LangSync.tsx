'use client';

import { useEffect } from 'react';
import { useI18n } from '../context/I18nContext';

export default function LangSync() {
  const { language } = useI18n();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
