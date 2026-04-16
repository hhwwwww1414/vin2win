'use client';

import Image from 'next/image';
import SpotlightCursor from '@/components/spotlight-cursor';

export function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate overflow-hidden rounded-[36px] border border-white/10 bg-[#050608] shadow-[0_32px_90px_rgba(0,0,0,0.48)]"
    >
      <div className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px]">
        <Image
          src="/main.png"
          alt="Премиальный автомобиль vin2win в студийном свете"
          fill
          priority
          sizes="(min-width: 1280px) 1232px, (min-width: 1024px) calc(100vw - 64px), 100vw"
          className="object-cover object-[72%_center] sm:object-[76%_center] lg:object-[79%_center]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,8,0.985)_0%,rgba(3,5,8,0.94)_30%,rgba(4,6,9,0.62)_54%,rgba(2,3,5,0.72)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_28%,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_82%_76%,rgba(255,255,255,0.04),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.34)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/18 to-transparent"
        />

        <SpotlightCursor
          aria-hidden="true"
          config={{
            radius: 256,
            brightness: 0.15,
            color: '#ffffff',
            smoothing: 0.1,
          }}
          className="z-20 opacity-90"
        />

        <div className="relative z-30 flex min-h-[520px] items-end sm:min-h-[580px] lg:min-h-[640px]">
          <div className="w-full px-6 py-10 sm:px-8 sm:py-12 lg:max-w-[35rem] lg:px-12 lg:py-14">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-white/64 sm:text-[0.74rem]">
              vin2win
            </p>
            <h1
              id="home-hero-heading"
              className="mt-5 font-display text-[2.45rem] font-semibold leading-[0.94] tracking-[-0.05em] text-white sm:text-[3.55rem] lg:text-[4.55rem]"
            >
              <span className="block">
                Продавай <span className="text-teal-accent">быстрее</span>
              </span>
              <span className="block">
                Подбирай <span className="text-teal-accent">точнее</span>
              </span>
            </h1>
            <p className="mt-5 max-w-[34rem] text-base leading-7 text-white/74 sm:text-lg sm:leading-8">
              Автомобили для профессиональных продавцов, подборщиков и менеджеров
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent"
        />
      </div>
    </section>
  );
}
