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
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_URL = isLocalhost 
    ? 'http://localhost:3000/api' 
    : 'https://aquicomigo-backend.onrender.com/api'; // Substituir pela URL real após deploy
  
  const modal = document.querySelector('.modal-overlay');
  const modalClose = document.querySelector('.modal-close');
  const checkoutForm = document.getElementById('checkout-form');
  const productIdInput = document.getElementById('selected-product-id');

  // Abrir modal ao clicar em comprar
  document.querySelectorAll('[data-product-id]').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const productId = this.getAttribute('data-product-id');
      productIdInput.value = productId;
      modal.classList.add('active');
    });
  });

  // Fechar modal
  modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Submeter formulário e ir para MP
  checkoutForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Feedback visual
    submitBtn.textContent = 'Gerando Pagamento Seguro...';
    submitBtn.style.opacity = '0.8';
    submitBtn.disabled = true;

    const formData = new FormData(this);
    const payload = {
      productId: formData.get('productId'),
      payer: {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone')
      }
    };

    try {
      const response = await fetch(`${API_URL}/create_preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro na resposta do servidor');
      }

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Link de pagamento não recebido');
      }

    } catch (error) {
      console.error('Erro no checkout:', error);
      alert('Houve um erro ao processar seu pedido. Tente novamente.');
      
      submitBtn.textContent = originalText;
      submitBtn.style.opacity = '1';
      submitBtn.disabled = false;
    }
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
