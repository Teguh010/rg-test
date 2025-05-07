'use client';
import { useState, useEffect } from 'react';
import { translationList } from '@/models/translation';
import { usePathname } from 'next/navigation';

export const useTranslationApi = (locale: string) => {
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        // Skip token check for login pages
        const isLoginPage = pathname.includes('/auth/login') || pathname.includes('/manager/login');
        if (isLoginPage) {
          // Set default translations for login pages
          setTranslations({});
          setIsLoading(false);
          return;
        }

        const userDataString = localStorage.getItem('userData');

        if (!userDataString) {
          throw new Error('No authentication token found');
        }

        const userData = JSON.parse(userDataString);

        if (!userData.token) {
          throw new Error('No token found in user data');
        }

        const translationItems = await translationList(userData.token, locale);
        
        const formattedTranslations = translationItems.reduce((acc, item) => {
          const keys = item.key.split('.');
          let current = acc;
          
          keys.forEach((key, index) => {
            if (index === keys.length - 1) {
              current[key] = item.val;
            } else {
              current[key] = current[key] || {};
              current = current[key];
            }
          });
          
          return acc;
        }, {} as Record<string, any>);

        setTranslations(formattedTranslations);
        setError(null);
      } catch (error) {
        console.error('Error fetching translations:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch translations');
        
        // Set empty translations on error
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [locale, pathname]);

  return { translations, isLoading, error };
}; 
