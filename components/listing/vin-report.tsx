'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/lib/marketplace-data';
import { CheckCircle, ShieldCheck, AlertCircle, X, ExternalLink } from 'lucide-react';

interface VinReportProps {
  vehicle: Vehicle;
}

export function VinReport({ vehicle }: VinReportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checks = [
    { label: 'Характеристики совпадают с ПТС', status: 'ok' as const },
    { label: 'Не числится в розыске', status: 'ok' as const },
    { label: 'Ограничений не обнаружено', status: 'ok' as const },
    {
      label: 'ДТП не зафиксировано',
      status: vehicle.verified ? ('ok' as const) : ('unknown' as const),
    },
  ];

  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  return (
    <>
      <div className="relative bg-card dark:bg-surface-elevated rounded-2xl border-2 border-border p-6 sm:p-7 shadow-lg overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-teal-accent" />
            <h3 className="font-display font-semibold text-foreground text-lg sm:text-xl tracking-[-0.01em]">Отчёт по VIN-коду</h3>
          </div>

          <div className="bg-muted dark:bg-surface-3 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-muted-foreground mb-1 font-medium">VIN</p>
            <p className="font-mono text-base font-semibold text-foreground">{vehicle.vin}</p>
          </div>

          <div className="space-y-3">
            {checks.map((check, index) => (
              <div key={index} className="flex items-center gap-3 text-base">
                {check.status === 'ok' ? (
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={check.status === 'ok' ? 'text-foreground font-medium' : 'text-muted-foreground font-medium'}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => vehicle.reportUrl && setIsModalOpen(true)}
            disabled={!vehicle.reportUrl}
            className="w-full mt-6 py-3.5 text-base font-semibold text-teal-accent hover:text-teal-dark dark:hover:text-seafoam border-2 border-teal-accent/40 rounded-xl hover:bg-teal-accent/10 dark:hover:bg-teal-accent/15 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Получить полный отчёт
          </button>
        </div>
      </div>

      {isModalOpen && vehicle.reportUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-card dark:bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col border-2 border-border"
            style={{ height: 'min(90vh, 860px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-border shrink-0">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-teal-accent" />
                <h2 className="font-display font-semibold text-foreground text-lg">Полный отчёт</h2>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={vehicle.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Открыть в новой вкладке
                </a>
                <button
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Закрыть"
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 rounded-b-2xl overflow-hidden">
              <iframe
                src={`${vehicle.reportUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title="Полный отчёт"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
