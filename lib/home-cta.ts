export type HomeHeroCtaButtonVariant = {
  title: string;
  description: string;
  buttonClassName: string;
  iconClassName: string;
  descriptionClassName: string;
  arrowClassName: string;
  sweepClassName: string;
  sweepDelayMs: number;
};

export const HOME_HERO_CTA_VARIANT_A: {
  primary: HomeHeroCtaButtonVariant;
  secondary: HomeHeroCtaButtonVariant;
} = {
  primary: {
    title: 'Перейти в каталог',
    description: 'Смотреть свежие объявления и рабочую ленту',
    buttonClassName:
      'landing-cta-button group relative h-auto min-h-[92px] w-full justify-between overflow-hidden whitespace-normal rounded-[24px] border border-teal-accent/25 bg-[linear-gradient(135deg,#106460_0%,#188c84_52%,#56a5e3_100%)] px-5 py-4 text-left text-[#071114] shadow-[0_22px_42px_rgba(21,157,147,0.22)] ring-1 ring-white/10 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_54px_rgba(21,157,147,0.3)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_28px_54px_rgba(21,157,147,0.3)] dark:border-teal-accent/30',
    iconClassName:
      'flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-black/10 ring-1 ring-black/8 backdrop-blur-sm',
    descriptionClassName: 'mt-1 block text-xs font-medium text-[#071114]/72',
    arrowClassName:
      'h-5 w-5 shrink-0 text-[#071114]/76 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1',
    sweepClassName: 'landing-cta-sweep landing-cta-sweep-strong',
    sweepDelayMs: 1400,
  },
  secondary: {
    title: 'Подать объявление',
    description: 'Запустить публикацию и пройти модерацию',
    buttonClassName:
      'landing-cta-button group relative h-auto min-h-[92px] w-full justify-between overflow-hidden whitespace-normal rounded-[24px] border border-foreground/10 bg-[linear-gradient(180deg,#f7f4f1_0%,#ece7e2_100%)] px-5 py-4 text-left text-[#15191e] shadow-[0_20px_38px_rgba(8,15,27,0.14)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_50px_rgba(8,15,27,0.22)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_28px_50px_rgba(8,15,27,0.22)] dark:border-white/15 dark:bg-[linear-gradient(180deg,#f5f2ef_0%,#e9e3de_100%)] dark:text-[#101418]',
    iconClassName:
      'flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#15191e]/7 ring-1 ring-[#15191e]/8 backdrop-blur-sm',
    descriptionClassName: 'mt-1 block text-xs font-medium text-[#15191e]/62',
    arrowClassName:
      'h-5 w-5 shrink-0 text-[#15191e]/62 transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1',
    sweepClassName: 'landing-cta-sweep landing-cta-sweep-soft',
    sweepDelayMs: 4800,
  },
};
