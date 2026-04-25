import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#050608',
          color: '#ffffff',
          padding: '72px',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18% 20%, rgba(129,216,208,0.22), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.08), transparent 36%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#81d8d0',
              color: '#050608',
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            V2
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>vin2win</div>
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.68)' }}>B2B авторынок России</div>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ maxWidth: 920, fontSize: 70, lineHeight: 1.02, fontWeight: 800, letterSpacing: -2 }}>
            Профессиональная платформа для сделок с автомобилями
          </div>
          <div style={{ maxWidth: 860, fontSize: 28, lineHeight: 1.35, color: 'rgba(255,255,255,0.72)' }}>
            Объявления, запросы в подбор, сравнение и модерация для продавцов, подборщиков и менеджеров.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
