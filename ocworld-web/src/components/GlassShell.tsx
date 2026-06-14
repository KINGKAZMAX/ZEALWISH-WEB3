import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface GlassShellProps {
  children: ReactNode;
}

export default function GlassShell({ children }: GlassShellProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        background: 'var(--bg-base)',
      }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, boxSizing: 'border-box',
      position: 'relative',
    }}>
      <div className="glass-strong" style={{
        width: 'min(1320px, 100%)',
        height: 'min(840px, 100%)',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-window), 0 0 0 1px var(--glass-border-strong)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        <div style={{
          height: 38, flexShrink: 0,
          display: 'flex', alignItems: 'center', padding: '0 16px',
          position: 'relative',
          borderBottom: '1px solid var(--accent)',
          background: 'linear-gradient(90deg, rgba(255,45,85,0.16), rgba(10,10,10,0.96) 28%, rgba(255,255,255,0.06) 50%, rgba(10,10,10,0.96) 72%, rgba(255,45,85,0.16))',
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: 0, background: 'var(--accent)', border: '1px solid var(--accent)' }} />
            <span style={{ width: 11, height: 11, borderRadius: 0, background: 'transparent', border: '1px solid rgba(255,255,255,.65)' }} />
            <span style={{ width: 11, height: 11, borderRadius: 0, background: '#FFFFFF', border: '1px solid #FFFFFF' }} />
          </div>
          <div className="mono" style={{
            position: 'absolute', left: 0, right: 0, textAlign: 'center',
            fontSize: 10.5, color: 'var(--ink-muted)',
            letterSpacing: '0.22em', pointerEvents: 'none', fontWeight: 500,
          }}>
            OCWORLD
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
