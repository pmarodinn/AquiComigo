/* =========================================================
   AQUICOMIGO – JavaScript
   - Sticky header com sombra ao rolar
   - Animações de entrada (Intersection Observer)
   - Smooth scroll para âncoras
   - Botões de compra (feedback visual)
   ========================================================= */

(function () {
  'use strict';

  /* ─── STICKY HEADER ────────────────────────────────────── */
  const header = document.getElementById('header');

  function onScroll() {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ─── INTERSECTION OBSERVER (animações de entrada) ──────── */
  const animatedEls = document.querySelectorAll('[data-animate]');

  if ('IntersectionObserver' in window && animatedEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Escalonamento por índice dentro do pai
            const siblings = Array.from(
              entry.target.parentElement.querySelectorAll('[data-animate]')
            );
            const delay = siblings.indexOf(entry.target) * 80;
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    animatedEls.forEach((el) => observer.observe(el));
  } else {
    // Fallback: exibir tudo sem animação
    animatedEls.forEach((el) => el.classList.add('visible'));
  }

  /* ─── SMOOTH SCROLL PARA ÂNCORAS ────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top =
        target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ─── CHECKOUT INTEGRAÇÃO (MERCADO PAGO) ──────────────── */
  const API_URL = 'http://localhost:3000/api'; // Ajuste conforme seu backend

  document.querySelectorAll('[data-product-id]').forEach((btn) => {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      
      const originalText = this.textContent;
      const productId = this.getAttribute('data-product-id');

      // Feedback visual de carregamento
      this.textContent = 'Gerando Checkout...';
      this.style.opacity = '0.7';
      this.style.pointerEvents = 'none';

      try {
        const response = await fetch(`${API_URL}/create_preference`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId })
        });

        if (!response.ok) {
          throw new Error('Erro na resposta do servidor');
        }

        const data = await response.json();

        if (data.init_point) {
          // Redireciona para o Mercado Pago
          window.location.href = data.init_point;
        } else {
          throw new Error('Link de pagamento não recebido');
        }

      } catch (error) {
        console.error('Erro no checkout:', error);
        alert('Houve um erro ao processar seu pedido. Tente novamente.');
        
        // Restaura botão em caso de erro
        this.textContent = originalText;
        this.style.opacity = '1';
        this.style.pointerEvents = 'auto';
      }
    });
  });

  /* ─── CONTADOR ANIMADO (PROVA SOCIAL) ───────────────────── */
  function animateCounter(el, target, duration) {
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target.toLocaleString('pt-BR') + '+';
        clearInterval(timer);
      } else {
        el.textContent = start.toLocaleString('pt-BR');
      }
    }, 16);
  }

  /* Inicia contadores quando ficam visíveis */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.counter, 10);
            animateCounter(el, target, 1500);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ─── LAZY LOADING DAS IMAGENS SVG ──────────────────────── */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
    });
  }

})();
