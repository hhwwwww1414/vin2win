import type { Metadata } from 'next';
import { LegalStubPage } from '@/components/legal/legal-stub-page';

export const metadata: Metadata = {
  title: 'Пользовательское соглашение',
  description: 'Временная страница пользовательского соглашения vin2win.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UserAgreementPage() {
  return (
    <LegalStubPage
      eyebrow="Terms"
      title="Пользовательское соглашение vin2win"
      description="Здесь будет опубликована финальная редакция пользовательского соглашения. Пока страница нужна как рабочая заглушка для регистрационного сценария."
    />
  );
}
