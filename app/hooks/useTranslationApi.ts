'use client';
import { useState, useEffect, useCallback } from 'react';
import { translationList } from '@/models/translation';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';

// Global variable to track if translations have been loaded
let translationsLoaded = false;

export const useTranslationApi = (locale: string) => {
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { models, operations } = useUser();
  const { getUserRef } = operations;

  const fetchTranslations = useCallback(async () => {
    try {
      // Skip token check for login pages
      const isLoginPage = pathname.includes('/auth/login') || 
                         pathname.includes('/manager/login') || 
                         pathname === '/';
      if (isLoginPage) {
        // Set default translations for login pages
        setTranslations({});
        setIsLoading(false);
        return;
      }

      // Check if translations exist in localStorage
      const storageKey = `translations_${locale}`;
      const cachedTranslations = localStorage.getItem(storageKey);
      
      if (cachedTranslations) {
        // Use cached translations if available
        setTranslations(JSON.parse(cachedTranslations));
        setIsLoading(false);
        translationsLoaded = true;
        return;
      }

      // Get the latest token from UserContext
      const currentUser = getUserRef();
      if (!currentUser || !currentUser.token) {
        throw new Error('No authentication token found');
      }

      // Use the latest token from UserContext
      const translationItems = await translationList(currentUser.token, locale);
      
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

      // Save translations to localStorage
      localStorage.setItem(storageKey, JSON.stringify(formattedTranslations));
      
      setTranslations(formattedTranslations);
      setError(null);
      translationsLoaded = true;
    } catch (error) {
      console.error('Error fetching translations:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch translations');
      
      // Set empty translations on error
      setTranslations({});
    } finally {
      setIsLoading(false);
    }
  }, [locale, pathname, getUserRef]);

  // Clear translations cache when locale changes
  const clearTranslationsCache = useCallback(() => {
    localStorage.removeItem(`translations_${locale}`);
    translationsLoaded = false;
  }, [locale]);

  // Fetch translations only once after login or when translations are not loaded
  useEffect(() => {
    // Only fetch if translations haven't been loaded yet
    if (!translationsLoaded) {
      fetchTranslations();
    } else {
      // If translations are already loaded, just get them from localStorage
      const storageKey = `translations_${locale}`;
      const cachedTranslations = localStorage.getItem(storageKey);
      
      if (cachedTranslations) {
        setTranslations(JSON.parse(cachedTranslations));
        setIsLoading(false);
      } else {
        // If locale changed and no cache for new locale, fetch new translations
        fetchTranslations();
      }
    }
  }, [fetchTranslations, locale]);

  // Listen for token changes in UserContext
  useEffect(() => {
    // Re-fetch translations when user token changes (login/logout)
    if (models.user?.token && !translationsLoaded) {
      clearTranslationsCache();
      fetchTranslations();
    }
  }, [models.user?.token, fetchTranslations, clearTranslationsCache]);

  return { 
    translations, 
    isLoading, 
    error, 
    refetch: useCallback(() => {
      clearTranslationsCache();
      return fetchTranslations();
    }, [clearTranslationsCache, fetchTranslations]) 
  };
}; 
