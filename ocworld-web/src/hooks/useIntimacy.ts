import { useState, useCallback } from 'react';

export function useIntimacy() {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem('ocworld.intimacy');
    return saved ? parseInt(saved, 10) : 32;
  });
  const [day] = useState(27);

  const bump = useCallback((amount: number) => {
    setValue(v => {
      const next = Math.min(100, v + amount);
      localStorage.setItem('ocworld.intimacy', String(next));
      return next;
    });
  }, []);

  return { value, day, bump };
}

export function stageOf(intimacy: number): { zh: string; en: string } {
  if (intimacy >= 80) return { zh: '知己', en: 'Confidant' };
  if (intimacy >= 60) return { zh: '好友', en: 'Close Friend' };
  if (intimacy >= 40) return { zh: '朋友', en: 'Friend' };
  if (intimacy >= 20) return { zh: '熟人', en: 'Acquaintance' };
  return { zh: '陌生人', en: 'Stranger' };
}
