// Módulo principal para index.html
    document.addEventListener('DOMContentLoaded', () => {
      // Año dinámico
      const yearEl = document.getElementById('year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      // Formulario contacto (simulado)
      const contactForm = document.getElementById('contactForm');
      if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!contactForm.checkValidity()) {
            contactForm.classList.add('was-validated');
            return;
          }
          const name = document.getElementById('contactName').value;
          const email = document.getElementById('contactEmail').value;
          // Simular envío
          const btn = contactForm.querySelector('button[type="submit"]');
          btn.disabled = true;
          btn.textContent = 'Enviando...';
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = 'Solicitar demo';
            contactForm.reset();
            contactForm.classList.remove('was-validated');
            alert('Gracias ' + name + '. Te contactaremos al correo ' + email + '.');
          }, 900);
        });
      }

      // Smooth scroll for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          const targetId = this.getAttribute('href').slice(1);
          const target = document.getElementById(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    });
