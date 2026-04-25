import { PublishedInfoPage } from '@/components/legal/published-info-page';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Контакты vin2win',
  description: 'Контакты, юридическая информация и способы связи с командой vin2win.',
  path: '/contacts',
});

export default function ContactsPage() {
  return (
    <PublishedInfoPage
      eyebrow="Контакты"
      title="Контакты и юридическая информация"
      description="Эта страница опубликована для прозрачности проекта. Реальные реквизиты нужно заполнить перед production-публикацией юридических документов."
      sections={[
        {
          title: 'Связь',
          body: 'Для вопросов по платформе, модерации и партнёрству используйте рабочий контакт проекта.',
          items: ['Email: TODO_CONTACT_EMAIL', 'География работы: Россия'],
        },
        {
          title: 'Юридические данные',
          body: 'Не используем выдуманные реквизиты. Значения ниже — безопасные placeholders, которые нужно заменить на реальные данные компании.',
          items: [
            'Наименование: TODO_LEGAL_NAME',
            'ИНН: TODO_INN',
            'ОГРН: TODO_OGRN',
            'Юридический адрес: TODO_LEGAL_ADDRESS',
          ],
        },
        {
          title: 'Поддержка пользователей',
          body: 'По вопросам доступа к аккаунту, публикации объявлений, запросов в подбор и модерации обращайтесь через указанный email или рабочие каналы поддержки проекта.',
        },
      ]}
    />
  );
}
