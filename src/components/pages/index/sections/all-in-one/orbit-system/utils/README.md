# OrbitSystemManager - Classe de Gerenciamento Otimizado

A classe `OrbitSystemManager` foi criada para gerenciar as duas orbiting spheres com três estratégias principais de otimização de renderização do canvas:

## 🎯 Estratégias de Otimização Implementadas

### 1. Intersection Observer API
**Impacto: Maior** - Elimina 100% do custo computacional quando não visível

- **Funcionamento**: Pausa completamente a renderização quando o canvas sai da viewport
- **Implementação**: Observer com threshold de 10% e rootMargin de 50px
- **Benefícios**: 
  - Zero consumo de CPU quando fora da tela
  - Implementação simples e suporte nativo do navegador
  - Reduz drasticamente o uso de recursos em páginas longas

```typescript
private setupIntersectionObserver(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      this.isInViewport = entry.isIntersecting;
      
      if (this.isInViewport) {
        this.startRenderLoop();
      } else {
        this.stopRenderLoop();
      }
    },
    { threshold: 0.1, rootMargin: '50px' }
  );
}
```

### 2. Page Visibility API
**Impacto: Significativo** - Economiza recursos quando usuário muda de aba

- **Funcionamento**: Pausa renderização quando a aba fica inativa
- **Implementação**: Listener para evento 'visibilitychange'
- **Benefícios**:
  - Economiza recursos quando usuário tem múltiplas abas abertas
  - Não afeta a experiência do usuário
  - Reduz consumo de bateria em dispositivos móveis

```typescript
private setupPageVisibility(): void {
  const handleVisibilityChange = () => {
    this.isPageVisible = !document.hidden;
    
    if (this.isPageVisible && this.isInViewport) {
      this.startRenderLoop();
    } else {
      this.stopRenderLoop();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
}
```

### 3. RequestAnimationFrame com Controle
**Impacto: Fundamental** - Gerencia o loop de animação de forma eficiente

- **Funcionamento**: Controle preciso do loop de animação com pausa/retomada instantânea
- **Implementação**: Sistema de flags para controlar estado de renderização
- **Benefícios**:
  - Sincronização com refresh rate do monitor
  - Evita renderizações desnecessárias entre frames
  - Controle granular do estado de animação

```typescript
private renderLoop = (): void => {
  if (!this.isRendering || !this.isInViewport || !this.isPageVisible) {
    this.isRendering = false;
    return;
  }
  
  // Update and render logic...
  this.animationFrameId = requestAnimationFrame(this.renderLoop);
};
```

## 🏗️ Arquitetura da Classe

### Componentes Principais
- **Three.js Components**: Renderers, câmera, cenas separadas para layering
- **Animation Systems**: LensParticleSystem e duas OrbitingSpheres
- **Optimization State**: Controle de viewport, visibilidade da página e estado de renderização

### Métodos Públicos
- `start()`: Inicia o sistema de animação
- `pause()`: Pausa a renderização
- `resume()`: Retoma a renderização (se condições permitirem)
- `dispose()`: Limpa todos os recursos

### Métodos de Monitoramento
- `isCurrentlyRendering()`: Verifica se está renderizando
- `getIsInViewport()`: Verifica se está na viewport
- `getIsPageVisible()`: Verifica se a página está visível

## 📊 Benefícios de Performance

1. **Redução de CPU**: 100% quando fora da viewport
2. **Economia de bateria**: Especialmente em dispositivos móveis
3. **Melhor UX**: Animações suaves apenas quando necessário
4. **Escalabilidade**: Suporta múltiplas instâncias sem conflitos

## 🔧 Configuração

```typescript
const orbitSystemManager = new OrbitSystemManager({
  container,
  orbitCanvas,
  blobCanvas,
  responsiveScale: 0.7,
  orbitsResponsiveScale: 0.5,
  stage1Duration: 3,
  stage2Duration: 3,
  stage3Duration: 3,
  stage4Duration: 3,
  returnDelay: 3000,
  returnDuration: 1.2,
  autoLoop: true,
  lensSettings: {
    stage1Scale: 0.7,
    stage2Scale: 1.1,
    stage3Scale: 1.4,
    stage4Scale: 1.7,
    finalScale: 1.7,
    initialScale: 0.7,
  },
  onStageChange: () => {},
});
```

## 🧹 Cleanup

A classe implementa cleanup automático de todos os recursos:
- Cancelamento de animation frames
- Desconexão de observers
- Limpeza de timeouts
- Dispose de objetos Three.js
- Remoção de event listeners

```typescript
public dispose(): void {
  this.stopRenderLoop();
  // ... cleanup de todos os recursos
}
```

Esta implementação garante que o sistema seja eficiente, responsivo e não cause vazamentos de memória.
