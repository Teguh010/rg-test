import React from 'react';
import TranslationProvider from '@/app/[locale]/TranslationProvider';
import MainLayout from "./main-layout";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

const i18nNamespaces = ['translation'];

const layout: React.FC<LayoutProps> = ({ children, params: { locale } }) => {
  return (
    <TranslationProvider locale={locale} namespaces={i18nNamespaces}>
      <MainLayout>{children}</MainLayout>
    </TranslationProvider>
  );
};

export default layout;
