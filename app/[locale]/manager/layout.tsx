import React from 'react';
import TranslationProvider from '@/app/[locale]/TranslationProvider';
import ManagerMainLayout from "./main-layout";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

const i18nNamespaces = ['translation'];

const ManagerLayout: React.FC<LayoutProps> = ({ children, params: { locale } }) => {
  return (
    <TranslationProvider locale={locale} namespaces={i18nNamespaces}>
      <ManagerMainLayout>{children}</ManagerMainLayout>
    </TranslationProvider>
  );
};

export default ManagerLayout;