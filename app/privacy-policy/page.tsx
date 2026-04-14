import type { Metadata } from 'next';
import { LegalStubPage } from '@/components/legal/legal-stub-page';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  description: 'Временная страница политики конфиденциальности vin2win.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalStubPage
      eyebrow="Privacy"
      title="Политика конфиденциальности vin2win"
      description="Здесь будет опубликована финальная политика конфиденциальности сервиса. Пока страница служит рабочей заглушкой для регистрации и авторизации."
    />
  );
}
