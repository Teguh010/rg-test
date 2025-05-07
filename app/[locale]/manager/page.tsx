'use client';
import { useTranslation } from 'react-i18next';
import ManagerLoginForm from '@/components/auth/manager-login-form';
import Image from 'next/image';

export default function ManagerLoginPage() {
  const { t } = useTranslation();

  return (
    <div className="relative h-screen">
      <div className="grid h-screen grid-cols-1 md:grid-cols-2">
        <div className="relative hidden h-screen md:block">
          <Image
            className="h-full w-full object-cover"
            src="/images/auth/bg.jpg"
            alt="bg"
            fill
          />
        </div>
        <div className="flex h-screen items-center justify-center p-5 lg:p-[100px]">
          <div className="w-full">
            <Image
              src="/images/logo/logo.png"
              alt="logo"
              width={180}
              height={45}
              className="mb-[60px]"
            />
            <h4 className="mb-[30px] text-2xl font-bold">
              {t('general.manager_login')}
            </h4>
            <ManagerLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}