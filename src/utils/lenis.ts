/**
 * Utilitário para acessar a instância global do Lenis
 */

// Declaração de tipo para o Lenis global
declare global {
  interface Window {
    lenis: any;
  }
}

/**
 * Obtém a instância global do Lenis
 * @returns A instância do Lenis ou null se não estiver disponível
 */
export function getLenis() {
  if (typeof window !== 'undefined' && window.lenis) {
    return window.lenis;
  }
  return null;
}

/**
 * Verifica se o Lenis está disponível
 * @returns true se o Lenis estiver disponível, false caso contrário
 */
export function isLenisAvailable() {
  return typeof window !== 'undefined' && !!window.lenis;
}

/**
 * Executa uma ação no Lenis se estiver disponível
 * @param action Função que recebe a instância do Lenis
 * @returns true se a ação foi executada, false caso contrário
 */
export function withLenis(action: (lenis: any) => void) {
  const lenis = getLenis();
  if (lenis) {
    action(lenis);
    return true;
  }
  return false;
}

/**
 * Scroll suave para um elemento
 * @param target Elemento ou seletor CSS para scroll
 * @param options Opções do scroll
 */
export function scrollTo(target: string | Element, options?: { duration?: number; offset?: number }) {
  withLenis((lenis) => {
    lenis.scrollTo(target, options);
  });
}

/**
 * Pausa o scroll suave
 */
export function pauseLenis() {
  withLenis((lenis) => {
    lenis.stop();
  });
}

/**
 * Resume o scroll suave
 */
export function resumeLenis() {
  withLenis((lenis) => {
    lenis.start();
  });
}
