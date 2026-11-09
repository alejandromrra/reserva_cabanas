import { useEffect } from 'react';

import { site } from '@/lib/config';

/** El título de la pestaña: «<página> · Cabañas del Sendero». */
export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · ${site.name}`;
  }, [titulo]);
}
