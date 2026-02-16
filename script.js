(function () {
  'use strict';

  // ===== NAVBAR: sombra rosada al hacer scroll =====
  const navbar = document.getElementById('navbar');
  if (navbar) {
    function updateNavbar() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
  }

  // ===== HERO: luz que sigue al mouse =====
  var heroSection = document.getElementById('inicio');
  var mouseLight = document.getElementById('heroMouseLight');
  if (heroSection && mouseLight) {
    heroSection.addEventListener('mousemove', function (e) {
      var rect = heroSection.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      mouseLight.style.left = x + 'px';
      mouseLight.style.top = y + 'px';
    });
    heroSection.addEventListener('mouseleave', function () {
      mouseLight.style.left = '50%';
      mouseLight.style.top = '50%';
    });
  }

  // ===== HERO: partículas flotantes =====
  var particlesContainer = document.getElementById('hero-particles');
  if (particlesContainer) {
    var particleCount = 18;
    for (var i = 0; i < particleCount; i++) {
      var p = document.createElement('span');
      p.className = 'hero-floating-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.width = (4 + Math.random() * 6) + 'px';
      p.style.height = p.style.width;
      p.style.animationDuration = (6 + Math.random() * 8) + 's';
      p.style.animationDelay = Math.random() * 5 + 's';
      particlesContainer.appendChild(p);
    }
  }

  // ===== HERO VISUAL: más partículas detrás de la imagen + iluminación (glow en CSS) =====
  var visualParticlesContainer = document.getElementById('hero-visual-particles');
  if (visualParticlesContainer) {
    var visualParticleCount = 42;
    for (var j = 0; j < visualParticleCount; j++) {
      var vp = document.createElement('span');
      vp.className = 'hero-visual-particle';
      vp.style.left = Math.random() * 100 + '%';
      vp.style.top = Math.random() * 100 + '%';
      vp.style.width = (3 + Math.random() * 5) + 'px';
      vp.style.height = vp.style.width;
      vp.style.animationDuration = (8 + Math.random() * 10) + 's';
      vp.style.animationDelay = Math.random() * 6 + 's';
      visualParticlesContainer.appendChild(vp);
    }
  }

  // ===== MENÚ MÓVIL COLAPSABLE =====
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      navMenu.classList.toggle('open');
      navToggle.classList.toggle('active');
      document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Cerrar menú al hacer clic en un enlace (navegación)
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ===== SCROLL SUAVE (refuerzo para navegación por anclas) =====
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      if (this.classList.contains('js-open-quote-modal')) return; // manejado por modal
      const href = this.getAttribute('href');
      if (href === '#' || !href) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== MODAL COTIZACIÓN =====
  var QUOTE_BASE_PRICE = 3254;
  var industryFactors = {
    'muebles-madera': 1.00, 'papel-carton': 1.00, 'construccion': 1.00,
    'plasticos': 1.10, 'textiles': 1.10, 'alimentos': 1.10, 'cosmeticos': 1.10,
    'metalmecanica': 1.15, 'maquinaria': 1.15, 'vehiculos': 1.15, 'electrodomesticos': 1.15,
    'quimicos': 1.20, 'otro': 1.20
  };
  var companySizeFactors = { '50-90': 0.90, '91-150': 1.00, '151-300': 1.10, '301-500': 1.20, '500+': 1.50 };
  var productionStaffFactors = { '0-20': 0.95, '21-50': 1.00, '51-100': 1.10, '100+': 1.20 };

  var quoteModal = document.getElementById('quoteModal');
  var quoteForm = document.getElementById('quoteForm');
  var quoteFormScreen = document.getElementById('quoteFormScreen');
  var quotePaymentScreen = document.getElementById('quotePaymentScreen');
  var quoteSuccess = document.getElementById('quoteSuccess');
  var quoteModalClose = document.getElementById('quoteModalClose');
  var quoteBtnSend = document.getElementById('quoteBtnSend');
  var quoteBtnBack = document.getElementById('quoteBtnBack');

  var lastQuoteBasePrice = 0;
  var lastPaymentOptions = { A: {}, B: {}, D: {} };

  function openQuoteModal() {
    if (!quoteModal) return;
    quoteModal.classList.add('is-open');
    quoteModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (quoteFormScreen) {
      quoteFormScreen.classList.add('modal-screen-active');
    }
    if (quotePaymentScreen) {
      quotePaymentScreen.classList.remove('modal-screen-active');
      quotePaymentScreen.setAttribute('aria-hidden', 'true');
    }
    if (quoteForm) {
      quoteForm.style.display = '';
    }
    if (quoteSuccess) {
      quoteSuccess.hidden = true;
      var p = quoteSuccess.querySelector('p');
      if (p) p.textContent = 'Cotización enviada correctamente.';
    }
    if (quoteForm) {
      quoteForm.reset();
      if (typeof setQuoteSubmitButtonState === 'function') setQuoteSubmitButtonState();
    }
  }

  function closeQuoteModal() {
    if (!quoteModal) return;
    quoteModal.classList.remove('is-open');
    quoteModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function formatEstimate(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatCurrency(amount) {
    return '$' + formatEstimate(amount) + ' USD';
  }

  function calculateEstimate() {
    var industria = document.getElementById('quoteIndustria').value;
    var tamano = document.getElementById('quoteTamano').value;
    var personal = document.getElementById('quotePersonal').value;
    var fi = industryFactors[industria];
    var ft = companySizeFactors[tamano];
    var fp = productionStaffFactors[personal];
    if (fi == null || ft == null || fp == null) return null;
    return QUOTE_BASE_PRICE * fi * ft * fp;
  }

  if (quoteModal) {
    document.querySelectorAll('[data-modal="quote"]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openQuoteModal();
      });
    });
    if (quoteModalClose) quoteModalClose.addEventListener('click', closeQuoteModal);
    quoteModal.addEventListener('click', function (e) {
      if (e.target === quoteModal) closeQuoteModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && quoteModal && quoteModal.classList.contains('is-open')) closeQuoteModal();
    });
  }

  // ===== MODAL COMPARACIÓN DE LICENCIAS =====
  var licenciasModal = document.getElementById('licenciasModal');
  var licenciasModalClose = document.getElementById('licenciasModalClose');
  var btnPromociones = document.getElementById('btnPromociones');
  function openLicenciasModal() {
    if (!licenciasModal) return;
    licenciasModal.classList.add('active');
    licenciasModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLicenciasModal() {
    if (!licenciasModal) return;
    licenciasModal.classList.remove('active');
    licenciasModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  var promocionesModal = document.getElementById('promocionesModal');
  var promocionesModalClose = document.getElementById('promocionesModalClose');
  var promocionesBtnVolver = document.getElementById('promocionesBtnVolver');

  function openPromocionesModal() {
    closeLicenciasModal();
    if (promocionesModal) {
      promocionesModal.classList.add('active');
      promocionesModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closePromocionesModal() {
    if (promocionesModal) {
      promocionesModal.classList.remove('active');
      promocionesModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  // Delegación: solo la tarjeta de Licenciamiento abre el modal (igual que cotización con data-modal="quote")
  document.body.addEventListener('click', function (e) {
    var card = e.target.closest('.js-open-licencias-modal');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    openLicenciasModal();
  }, false);
  document.body.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var card = e.target.closest('.js-open-licencias-modal');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    openLicenciasModal();
  }, false);
  if (licenciasModalClose) {
    licenciasModalClose.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeLicenciasModal();
    });
  }
  if (licenciasModal) {
    var licenciasModalContent = licenciasModal.querySelector('.licencias-modal');
    if (licenciasModalContent) {
      licenciasModalContent.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (promocionesModal && promocionesModal.classList.contains('active')) {
      e.preventDefault();
      e.stopPropagation();
      closePromocionesModal();
    } else if (licenciasModal && licenciasModal.classList.contains('active')) {
      e.preventDefault();
      e.stopPropagation();
      closeLicenciasModal();
    }
  });
  if (promocionesModalClose) {
    promocionesModalClose.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePromocionesModal();
    });
  }
  if (promocionesModal) {
    promocionesModal.addEventListener('click', function (e) {
      if (e.target === promocionesModal) closePromocionesModal();
    });
    var promocionesContent = promocionesModal.querySelector('.promociones-modal');
    if (promocionesContent) {
      promocionesContent.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  }
  if (promocionesBtnVolver) {
    promocionesBtnVolver.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePromocionesModal();
    });
  }
  var promocionesBtnCotizar = document.getElementById('promocionesBtnCotizar');
  if (promocionesBtnCotizar) {
    promocionesBtnCotizar.addEventListener('click', function () {
      closePromocionesModal();
    });
  }
  if (btnPromociones) {
    btnPromociones.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPromocionesModal();
    });
  }

  var quoteFormHint = document.getElementById('quoteFormHint');

  function isQuoteContactValid() {
    var nombre = document.getElementById('quoteNombre');
    var email = document.getElementById('quoteEmail');
    var telefono = document.getElementById('quoteTelefono');
    if (!nombre || !email || !telefono) return false;
    if (!nombre.value.trim()) return false;
    if (!email.value.trim() || !email.validity.valid) return false;
    var digits = (telefono.value || '').replace(/\D/g, '');
    return digits.length === 10;
  }

  function getQuoteContactMissing() {
    var missing = [];
    var nombre = document.getElementById('quoteNombre');
    var email = document.getElementById('quoteEmail');
    var telefono = document.getElementById('quoteTelefono');
    if (!nombre || !email || !telefono) return missing;
    if (!nombre.value.trim()) missing.push('nombre completo');
    if (!email.value.trim()) missing.push('correo');
    else if (!email.validity.valid) missing.push('correo con formato válido (ej: nombre@correo.com)');
    var digits = (telefono.value || '').replace(/\D/g, '');
    if (digits.length !== 10) missing.push('teléfono con 10 dígitos');
    return missing;
  }

  var quoteConsentDatos = document.getElementById('quoteConsentDatos');
  var quoteConsentPublicidad = document.getElementById('quoteConsentPublicidad');

  function updateQuoteFormHint() {
    if (!quoteFormHint) return;
    var missing = getQuoteContactMissing();
    if (missing.length > 0) {
      quoteFormHint.textContent = 'Para continuar: ' + missing.join(', ') + '.';
      return;
    }
    if (quoteConsentDatos && !quoteConsentDatos.checked) {
      quoteFormHint.textContent = 'Debes aceptar el tratamiento de datos para continuar.';
      return;
    }
    quoteFormHint.textContent = '';
  }

  function canSubmitQuoteForm() {
    return isQuoteContactValid() && quoteConsentDatos && quoteConsentDatos.checked;
  }

  function focusFirstInvalidContactField() {
    var nombre = document.getElementById('quoteNombre');
    var email = document.getElementById('quoteEmail');
    var telefono = document.getElementById('quoteTelefono');
    if (!nombre || !email || !telefono) return;
    if (!nombre.value.trim()) { nombre.focus(); nombre.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!email.value.trim() || !email.validity.valid) { email.focus(); email.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    var digits = (telefono.value || '').replace(/\D/g, '');
    if (digits.length !== 10) { telefono.focus(); telefono.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  }

  function setQuoteSubmitButtonState() {
    updateQuoteFormHint();
    var btn = quoteForm ? quoteForm.querySelector('button[type="submit"]') : null;
    if (btn) btn.disabled = !canSubmitQuoteForm();
  }

  if (quoteForm) {
    var quoteNombre = document.getElementById('quoteNombre');
    var quoteEmail = document.getElementById('quoteEmail');
    var quoteTelefono = document.getElementById('quoteTelefono');
    [quoteNombre, quoteEmail, quoteTelefono].forEach(function (el) {
      if (el) {
        el.addEventListener('input', setQuoteSubmitButtonState);
        el.addEventListener('change', setQuoteSubmitButtonState);
      }
    });
    if (quoteConsentDatos) {
      quoteConsentDatos.addEventListener('change', setQuoteSubmitButtonState);
    }
    if (quoteConsentPublicidad) {
      quoteConsentPublicidad.addEventListener('change', setQuoteSubmitButtonState);
    }
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var telEl = document.getElementById('quoteTelefono');
      if (telEl) {
        var digits = (telEl.value || '').replace(/\D/g, '');
        telEl.setCustomValidity(digits.length === 10 ? '' : 'El teléfono debe tener exactamente 10 dígitos.');
      }
      if (!this.checkValidity()) {
        updateQuoteFormHint();
        focusFirstInvalidContactField();
        this.reportValidity();
        return;
      }
      if (quoteConsentDatos && !quoteConsentDatos.checked) {
        updateQuoteFormHint();
        quoteConsentDatos.focus();
        return;
      }
      var basePrice = calculateEstimate();
      if (basePrice == null) return;
      lastQuoteBasePrice = basePrice;

      var optA = { total: basePrice * 0.9, installments: 1, installmentAmount: basePrice * 0.9, nombreOpcion: '1 pago contado' };
      var optB = { total: basePrice * 0.95, installments: 2, installmentAmount: (basePrice * 0.95) / 2, nombreOpcion: '2 pagos durante implementación' };
      var optD = { total: basePrice * 1.20, installments: 12, installmentAmount: (basePrice * 1.20) / 12, nombreOpcion: '12 pagos mensuales (post-implementación)' };
      lastPaymentOptions = { A: optA, B: optB, D: optD };

      var elA = document.getElementById('paymentPriceA');
      var elB = document.getElementById('paymentPriceB');
      var elD = document.getElementById('paymentPriceD');
      if (elA) elA.textContent = formatCurrency(optA.total);
      if (elB) elB.textContent = '2 cuotas de ' + formatCurrency(optB.installmentAmount) + ' cada una';
      if (elD) elD.textContent = '12 cuotas de ' + formatCurrency(optD.installmentAmount) + ' cada una';

      var elAC = document.getElementById('paymentPriceACard');
      var elBC = document.getElementById('paymentPriceBCard');
      var elDC = document.getElementById('paymentPriceDCard');
      if (elAC) elAC.textContent = formatCurrency(optA.total);
      if (elBC) elBC.textContent = '2 cuotas de ' + formatCurrency(optB.installmentAmount);
      if (elDC) elDC.textContent = '12 cuotas de ' + formatCurrency(optD.installmentAmount);

      var radios = document.querySelectorAll('input[name="paymentPlan"]');
      radios.forEach(function (r) { r.checked = false; });
      document.querySelectorAll('.payment-option').forEach(function (r) { r.classList.remove('selected'); });

      quoteFormScreen.classList.remove('modal-screen-active');
      quoteFormScreen.querySelector('form').style.display = 'none';
      quotePaymentScreen.classList.add('modal-screen-active');
      quotePaymentScreen.setAttribute('aria-hidden', 'false');
    });
    setQuoteSubmitButtonState();
  }

  if (quoteBtnBack) {
    quoteBtnBack.addEventListener('click', function () {
      quotePaymentScreen.classList.remove('modal-screen-active');
      quotePaymentScreen.setAttribute('aria-hidden', 'true');
      quoteFormScreen.classList.add('modal-screen-active');
      if (quoteForm) quoteForm.style.display = '';
    });
  }

  document.querySelectorAll('.payment-option').forEach(function (row) {
    row.addEventListener('click', function (e) {
      if (e.target.tagName === 'INPUT') return;
      document.querySelectorAll('.payment-option').forEach(function (r) { r.classList.remove('selected'); });
      this.classList.add('selected');
      var radio = this.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  document.querySelectorAll('input[name="paymentPlan"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      document.querySelectorAll('.payment-option').forEach(function (r) { r.classList.remove('selected'); });
      var row = radio.closest('.payment-option');
      if (row) row.classList.add('selected');
    });
  });

  function getQuotePayload() {
    var selected = document.querySelector('input[name="paymentPlan"]:checked');
    var optionId = selected ? selected.value : null;
    var opt = optionId ? lastPaymentOptions[optionId] : null;
    return {
      nombre: document.getElementById('quoteNombre').value,
      email: document.getElementById('quoteEmail').value,
      telefono: document.getElementById('quoteTelefono').value,
      industria: document.getElementById('quoteIndustria').value,
      tamanoEmpresa: document.getElementById('quoteTamano').value,
      personalProduccion: document.getElementById('quotePersonal').value,
      precioBase: lastQuoteBasePrice,
      opcionPago: optionId || null,
      nombreOpcion: opt ? opt.nombreOpcion : null,
      valorCuota: opt ? opt.installmentAmount : null,
      numeroCuotas: opt ? opt.installments : null,
      totalAPagar: opt ? opt.total : null,
      aceptaPublicidad: quoteConsentPublicidad ? quoteConsentPublicidad.checked : false,
      fecha: new Date().toISOString()
    };
  }

  var industryLabels = {
    'muebles-madera': 'Muebles y madera', 'papel-carton': 'Papel, cartón e impresión',
    'construccion': 'Construcción industrializada', 'plasticos': 'Plásticos y derivados',
    'textiles': 'Textiles y confecciones', 'alimentos': 'Alimentos y bebidas',
    'cosmeticos': 'Cosméticos y cuidado personal', 'metalmecanica': 'Metalmecánica',
    'maquinaria': 'Maquinaria y equipos', 'vehiculos': 'Vehículos y autopartes',
    'electrodomesticos': 'Electrodomésticos y electrónica', 'quimicos': 'Químicos y farmacéuticos',
    'otro': 'Otro / no clasificado'
  };

  function translateIndustry(code) {
    return industryLabels[code] || code || '—';
  }

  function drawPaymentOption(doc, x, y, letra, titulo, descuento, descripcion, cuotas, total, isSelected, isDiscount) {
    var cardWidth = 170;
    var cardHeight = 24;
    if (isSelected) {
      doc.setFillColor(253, 242, 248);
      doc.rect(x - 1.5, y - 1.5, cardWidth + 3, cardHeight + 3, 'F');
      doc.setDrawColor(233, 30, 140);
      doc.setLineWidth(1.2);
      doc.rect(x, y, cardWidth, cardHeight, 'S');
      if (typeof doc.roundedRect === 'function') {
        doc.setFillColor(233, 30, 140);
        doc.roundedRect(x + cardWidth - 44, y - 6, 44, 5, 1, 1, 'F');
      } else {
        doc.setFillColor(233, 30, 140);
        doc.rect(x + cardWidth - 44, y - 6, 44, 5, 'F');
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.text('✓ Seleccionada', x + cardWidth - 22, y - 3.5, { align: 'center' });
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(x, y, cardWidth, cardHeight, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.4);
      doc.rect(x, y, cardWidth, cardHeight, 'S');
    }
    if (isSelected) { doc.setFillColor(233, 30, 140); } else { doc.setFillColor(200, 200, 200); }
    doc.rect(x, y, 3.5, cardHeight, 'F');
    if (isSelected) { doc.setFillColor(233, 30, 140); } else { doc.setFillColor(150, 150, 150); }
    doc.circle(x + 15, y + 12, 4.2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(letra, x + 15, y + 13.5, { align: 'center' });
    doc.setTextColor(isSelected ? 26 : 100, isSelected ? 26 : 100, isSelected ? 26 : 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo.substring(0, 45), x + 24, y + 7.5);
    var badgeWidth = 20;
    if (isDiscount === true) {
      doc.setFillColor(37, 211, 102);
    } else if (isDiscount === false) {
      doc.setFillColor(255, 140, 66);
    } else {
      doc.setFillColor(158, 158, 158);
    }
    if (typeof doc.roundedRect === 'function') {
      doc.roundedRect(x + cardWidth - badgeWidth - 3, y + 3, badgeWidth, 6, 1.5, 1.5, 'F');
    } else {
      doc.rect(x + cardWidth - badgeWidth - 3, y + 3, badgeWidth, 6, 'F');
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(descuento, x + cardWidth - badgeWidth / 2 - 3, y + 7, { align: 'center' });
    doc.setTextColor(isSelected ? 100 : 150, isSelected ? 100 : 150, isSelected ? 100 : 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(descripcion.substring(0, 50), x + 24, y + 13.5);
    if (isSelected) { doc.setTextColor(233, 30, 140); } else { doc.setTextColor(150, 150, 150); }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    var cuotasLines = doc.splitTextToSize(cuotas, 128);
    doc.text(cuotasLines, x + 24, y + 18);
    doc.setTextColor(isSelected ? 120 : 170, isSelected ? 120 : 170, isSelected ? 120 : 170);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(total, x + 24, y + 22);
  }

  function downloadQuotePdf(payload) {
    var JsPDFConstructor = (window.jspdf && (window.jspdf.jsPDF || window.jspdf.default)) || window.jsPDF;
    if (typeof JsPDFConstructor === 'undefined') {
      console.warn('jsPDF no cargado');
      return;
    }
    var doc = new JsPDFConstructor();
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var marginL = 20;
    var marginR = 20;
    var contentW = pageW - marginL - marginR;
    var MARGIN_TOP = 55;
    var MARGIN_BOTTOM = 22;
    var SECTION_SPACING = 10;
    var y = 0;

    function checkPageBreak(currentY, requiredSpace) {
      if (currentY + requiredSpace > pageH - MARGIN_BOTTOM) {
        doc.addPage();
        return 20;
      }
      return currentY;
    }

    // === HEADER compacto ===
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageW, 48, 'F');
    var logoImg = document.querySelector('.logo-icon, .navbar-brand img[src*="logo"]');
    if (logoImg && logoImg.complete && logoImg.naturalWidth) {
      try {
        var scale = 2;
        var c = document.createElement('canvas');
        c.width = logoImg.naturalWidth * scale;
        c.height = logoImg.naturalHeight * scale;
        var ctx = c.getContext('2d');
        ctx.drawImage(logoImg, 0, 0, c.width, c.height);
        var logoData = c.toDataURL('image/png');
        doc.addImage(logoData, 'PNG', (pageW - 52) / 2, 8, 52, 22, undefined, 'FAST');
      } catch (e) { }
    }
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(233, 30, 140);
    doc.text('Cotización', pageW / 2, 36, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    var ref = 'Ref. ' + (payload.fecha ? new Date(payload.fecha).getTime().toString().slice(-8) : String(Date.now()).slice(-8));
    var fechaStr = payload.fecha ? new Date(payload.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(ref + ' | ' + fechaStr, pageW / 2, 42, { align: 'center' });
    y = MARGIN_TOP;

    // === Información del cliente ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(233, 30, 140);
    doc.text('Información del cliente', marginL, y);
    y += 1.5;
    doc.setDrawColor(233, 30, 140);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, marginL + contentW, y);
    y += 8;

    var col1X = marginL;
    var col2X = marginL + contentW / 2 + 5;
    var rowH = 7;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(117, 117, 117);
    doc.text('Nombre', col1X, y);
    doc.text('Industria', col2X, y);
    y += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    doc.text((payload.nombre || '—').toString().substring(0, 35), col1X, y);
    doc.text(translateIndustry(payload.industria).substring(0, 28), col2X, y);
    y += rowH;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(117, 117, 117);
    doc.text('Email', col1X, y);
    doc.text('Tamaño de empresa', col2X, y);
    y += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    doc.text((payload.email || '—').toString().substring(0, 35), col1X, y);
    doc.text((payload.tamanoEmpresa || '—').toString().substring(0, 28), col2X, y);
    y += rowH;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(117, 117, 117);
    doc.text('Teléfono', col1X, y);
    doc.text('Personal en producción', col2X, y);
    y += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 26);
    doc.text((payload.telefono || '—').toString(), col1X, y);
    doc.text((payload.personalProduccion || '—').toString().substring(0, 28), col2X, y);
    y += 12;

    // === Desglose de implementación (tabla una sola fila) ===
    y = checkPageBreak(y, 60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(233, 30, 140);
    doc.text('Desglose de implementación', marginL, y);
    y += 1.5;
    doc.setDrawColor(233, 30, 140);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, marginL + contentW, y);
    y += 6;

    var fi = industryFactors[payload.industria] != null ? industryFactors[payload.industria] : 1;
    var ft = companySizeFactors[payload.tamanoEmpresa] != null ? companySizeFactors[payload.tamanoEmpresa] : 1;
    var fp = productionStaffFactors[payload.personalProduccion] != null ? productionStaffFactors[payload.personalProduccion] : 1;
    var paso4 = QUOTE_BASE_PRICE * fi * ft * fp;
    var precioImplementacion = Math.round(paso4 * 100) / 100;

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: y,
        head: [['Concepto', 'Subtotal (USD)']],
        body: [['Implementación (precio base)', formatCurrency(precioImplementacion) + ' USD']],
        margin: { left: marginL, right: marginR },
        tableWidth: contentW,
        theme: 'grid',
        headStyles: {
          fillColor: [201, 26, 120],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 5,
          halign: 'left'
        },
        bodyStyles: {
          textColor: [26, 26, 26],
          fontSize: 10,
          cellPadding: 5,
          fillColor: [255, 255, 255],
          lineColor: [230, 230, 230],
          lineWidth: 0.5,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 110, halign: 'left' },
          1: { cellWidth: 70, halign: 'right' }
        }
      });
      y = doc.lastAutoTable.finalY + SECTION_SPACING;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 26);
      doc.text('Implementación (precio base): ' + formatCurrency(precioImplementacion) + ' USD', marginL, y + 5);
      y += SECTION_SPACING + 8;
    }

    // === Opciones de pago disponibles (solo A, B, C) ===
    y = checkPageBreak(y, 88);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(233, 30, 140);
    doc.text('Opciones de pago disponibles', marginL, y);
    y += 1.5;
    doc.setDrawColor(233, 30, 140);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, marginL + contentW, y);
    y += 8;

    var opcionA = { total: Math.round(precioImplementacion * 0.9 * 100) / 100, cuotas: 1, cuotaValor: Math.round(precioImplementacion * 0.9 * 100) / 100 };
    var opcionB = { total: Math.round(precioImplementacion * 0.95 * 100) / 100, cuotas: 2, cuotaValor: Math.round((precioImplementacion * 0.95 / 2) * 100) / 100 };
    var opcionC = { total: Math.round(precioImplementacion * 1.2 * 100) / 100, cuotas: 12, cuotaValor: Math.round((precioImplementacion * 1.2 / 12) * 100) / 100 };

    drawPaymentOption(doc, marginL, y, 'A', '1 pago contado', '−10%', '100% antes de iniciar implementación', '1 pago de ' + formatCurrency(opcionA.cuotaValor) + ' USD', 'Total: ' + formatCurrency(opcionA.total) + ' USD', payload.opcionPago === 'A', true);
    y += 26;
    drawPaymentOption(doc, marginL, y, 'B', '2 pagos durante implementación', '−5%', '50% al inicio + 50% al finalizar', '2 cuotas de ' + formatCurrency(opcionB.cuotaValor) + ' USD cada una', 'Total: ' + formatCurrency(opcionB.total) + ' USD', payload.opcionPago === 'B', true);
    y += 26;
    drawPaymentOption(doc, marginL, y, 'C', '12 pagos mensuales', '+20%', 'Mensuales durante implementación', '12 cuotas de ' + formatCurrency(opcionC.cuotaValor) + ' USD cada una', 'Total: ' + formatCurrency(opcionC.total) + ' USD', payload.opcionPago === 'C', false);
    y += 26;
    y += SECTION_SPACING;

    // === Notas importantes ===
    y = checkPageBreak(y, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(233, 30, 140);
    doc.text('Notas importantes', marginL, y);
    y += 1.5;
    doc.setDrawColor(233, 30, 140);
    doc.setLineWidth(0.4);
    doc.line(marginL, y, marginL + contentW, y);
    y += 8;

    var notas = [
      'Valor de configuración inicial, incluyendo puesta en marcha y capacitación.',
      'El licenciamiento de usuarios se cotiza por separado según número de licencias.',
      'Validez de esta cotización: 30 días calendario.',
      'Precios expresados en dólares estadounidenses (USD).',
      'Valores sujetos a IVA vigente según normativa tributaria aplicable.'
    ];
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(66, 66, 66);
    notas.forEach(function (nota, index) {
      doc.setFillColor(233, 30, 140);
      doc.circle(marginL + 2, y + 1.2, 1, 'F');
      var lines = doc.splitTextToSize(nota, 165);
      doc.text(lines, marginL + 6, y + 1.5);
      y += lines.length * 4 + 3;
    });
    y += 6;

    // === FOOTER MEJORADO ===
    doc.setDrawColor(233, 30, 140);
    doc.setLineWidth(0.3);
    doc.line(0, pageH - 20, pageW, pageH - 20);
    doc.setFillColor(26, 26, 26);
    doc.rect(0, pageH - 20, pageW, 20, 'F');
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.setFont('helvetica', 'normal');
    doc.text('Quanta | Empowered by apalliance', marginL, pageH - 10);
    var now = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text('Generado el ' + now, pageW / 2, pageH - 10, { align: 'center' });
    doc.text('Página 1 de 1', pageW - marginR, pageH - 10, { align: 'right' });

    doc.save('cotizacion-quanta.pdf');
  }

  var quoteBtnPdf = document.getElementById('quoteBtnPdf');
  if (quoteBtnPdf) {
    quoteBtnPdf.addEventListener('click', function (e) {
      e.preventDefault();
      var payload = getQuotePayload();
      if (typeof window.onQuoteDownloadPdf === 'function') {
        window.onQuoteDownloadPdf(payload);
      } else {
        downloadQuotePdf(payload);
      }
    });
  }

  var quoteBtnCall = document.getElementById('quoteBtnCall');
  if (quoteBtnCall) {
    quoteBtnCall.addEventListener('click', function () {
      closeQuoteModal();
      var contacto = document.getElementById('contacto');
      if (contacto) contacto.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ===== ANIMACIÓN FADE-IN AL HACER SCROLL =====
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: mostrar todos al cargar
    revealElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ===== FORMULARIO DE CONTACTO (sección contacto) =====
  // Webhook: reemplaza con tu URL de Make.com o backend
  var CONTACT_WEBHOOK_URL = '';

  window.handleContactSubmit = function (event) {
    event.preventDefault();
    var form = event.target;
    var submitBtn = form.querySelector('.contact-submit-btn') || form.querySelector('.submit-btn');
    var btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    var formMessage = form.querySelector('.form-message') || document.getElementById('contactFormMessage');

    if (submitBtn) {
      submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Enviando...';
    }

    var formData = {
      nombre: form.nombre ? form.nombre.value : '',
      correo: form.correo ? form.correo.value : '',
      numero: form.numero ? form.numero.value : '',
      cargo: form.cargo ? form.cargo.value : '',
      empresa: form.empresa ? form.empresa.value : '',
      mensaje: (form.mensaje && form.mensaje.value) ? form.mensaje.value : 'Sin mensaje',
      fecha: new Date().toISOString()
    };

    function showResult(success, message) {
      if (formMessage) {
        formMessage.className = 'form-message ' + (success ? 'success' : 'error');
        formMessage.textContent = message;
        formMessage.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Enviar mensaje';
      }
      setTimeout(function () {
        if (formMessage) formMessage.style.display = 'none';
      }, 5000);
    }

    if (!CONTACT_WEBHOOK_URL) {
      form.reset();
      showResult(true, '\u2713 \u00a1Mensaje enviado con \u00e9xito! Nos pondremos en contacto pronto.');
      return false;
    }

    fetch(CONTACT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          showResult(true, '\u2713 \u00a1Mensaje enviado con \u00e9xito! Nos pondremos en contacto pronto.');
        } else {
          throw new Error('Error al enviar');
        }
      })
      .catch(function (err) {
        console.error('Error contacto:', err);
        showResult(false, '\u2717 Hubo un error. Por favor, intenta de nuevo o cont\u00e1ctanos directamente.');
      });

    return false;
  };

  // ===== UNIVERSIDAD QUANTA: filtros y modal de artículos =====
  var filterBtns = document.querySelectorAll('.filter-btn');
  var blogCards = document.querySelectorAll('.blog-card');

  if (filterBtns.length && blogCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var category = btn.getAttribute('data-category');
        blogCards.forEach(function (card) {
          var cardCategory = card.getAttribute('data-category');
          if (category === 'all' || cardCategory === category) {
            card.style.display = 'flex';
            card.style.animation = 'blogCardFadeIn 0.4s ease';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  document.body.addEventListener('click', function (e) {
    var cardBtn = e.target.closest('.card-btn[data-article]');
    if (!cardBtn) return;
    e.preventDefault();
    var articleId = cardBtn.getAttribute('data-article');
    if (articleId) openArticleModal(articleId);
  });

  window.closeArticleModal = function () {
    var modal = document.querySelector('.article-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(function () {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    }
  };

  function openArticleModal(articleId) {
    var articles = {
      'mrp-que-es': {
        title: '¿Qué es un MRP y para qué sirve en manufactura?',
        category: 'MRP & ERP',
        content: '<h3>¿Qué es un MRP?</h3><p>Un MRP (Material Requirements Planning) es un sistema de planificación de requerimientos de materiales diseñado para ayudar a las empresas manufactureras a determinar qué producir, cuánto producir y cuándo producirlo.</p><p>Su función principal es asegurar que los materiales correctos estén disponibles en el momento adecuado, evitando tanto quiebres de inventario como excesos innecesarios de stock.</p><h3>Elementos clave de un MRP</h3><p>Un MRP trabaja a partir de tres elementos clave:</p><ul><li>La demanda (pedidos de clientes o pronósticos)</li><li>La lista de materiales (BOM – Bill of Materials)</li><li>Los inventarios actuales y tiempos de entrega</li></ul><p>Con esta información, el sistema calcula automáticamente las necesidades de compra y producción, generando órdenes planificadas que permiten mantener la operación fluida y alineada con la demanda real.</p><h3>Beneficios en manufactura</h3><p>En empresas manufactureras, un MRP permite:</p><ul><li>Reducir inventarios improductivos</li><li>Evitar paradas de planta por falta de materiales</li><li>Mejorar la planificación de producción</li><li>Aumentar la eficiencia operativa</li></ul><p>Sin embargo, el MRP se enfoca principalmente en materiales y producción. No integra de manera completa otras áreas como finanzas, ventas o talento humano.</p>'
      },
      'mrp-diferencias': {
        title: 'Diferencias entre un MRP I y MRP II',
        category: 'MRP & ERP',
        content: '<h3>¿Qué es un MRP I?</h3><p>El MRP I (Material Requirements Planning) es un sistema de planificación de requerimientos de materiales desarrollado para resolver un problema fundamental en manufactura: saber qué materiales se necesitan, en qué cantidad y en qué momento.</p><p>El MRP I se basa en tres elementos clave:</p><ul><li>Plan maestro de producción (qué se va a fabricar y cuándo)</li><li>Lista de materiales (BOM)</li><li>Inventarios disponibles y tiempos de entrega</li></ul><h3>¿Qué es un MRP II?</h3><p>El MRP II (Manufacturing Resource Planning) es una evolución del MRP I. Mientras que el primero se enfoca únicamente en materiales, el MRP II amplía el alcance hacia la planificación integral de los recursos de manufactura.</p><p>El MRP II no solo responde qué materiales se necesitan, sino también:</p><ul><li>Qué capacidad productiva está disponible</li><li>Qué carga de trabajo tendrá cada centro de trabajo</li><li>Cómo impactan los planes de producción en costos y finanzas</li><li>Cómo se alinean ventas, producción y compras</li></ul><h3>Diferencias clave</h3><p><strong>MRP I responde:</strong> ¿Tenemos los materiales necesarios?</p><p><strong>MRP II responde:</strong> ¿Tenemos los materiales, la capacidad y la viabilidad financiera para ejecutar el plan?</p>'
      },
      'erp-vs-mrp': {
        title: '¿Qué es un ERP y cómo se diferencia de un MRP?',
        category: 'MRP & ERP',
        content: '<h3>¿Qué es un ERP?</h3><p>Un ERP (Enterprise Resource Planning) es un sistema integral de gestión empresarial que conecta todas las áreas de la organización en una sola plataforma.</p><p>Mientras que un MRP se centra en la planificación de materiales y producción, un ERP abarca procesos como:</p><ul><li>Finanzas y contabilidad</li><li>Compras</li><li>Inventarios</li><li>Producción</li><li>Ventas</li><li>Talento humano</li><li>Reportes y analítica</li></ul><h3>La principal diferencia</h3><p><strong>El MRP responde:</strong> ¿Cómo planifico mis materiales y producción?</p><p><strong>El ERP responde:</strong> ¿Cómo gestiono toda mi empresa de forma integrada?</p><h3>Ejemplo práctico</h3><p>En una empresa manufacturera, un ERP permite que la información fluya entre áreas:</p><ul><li>Una orden de venta impacta producción</li><li>Producción impacta inventarios</li><li>Inventarios impactan compras</li><li>Todo impacta contabilidad en tiempo real</li></ul><p>Esto elimina reprocesos, reduce errores manuales y mejora la toma de decisiones con información centralizada.</p>'
      },
      'industria40': {
        title: 'Industria 4.0: qué es y cómo aplicarla en manufactura',
        category: 'Industria 4.0',
        content: '<h3>¿Qué es la Industria 4.0?</h3><p>La Industria 4.0 representa la cuarta revolución industrial. Se basa en la digitalización e integración inteligente de los procesos productivos mediante tecnología.</p><p>No se trata únicamente de automatización o robots. Se trata de conectar datos, procesos y personas para lograr mayor eficiencia, trazabilidad y control.</p><h3>Pilares de la Industria 4.0</h3><ul><li>Digitalización de procesos</li><li>Integración de información en tiempo real</li><li>Analítica de datos</li><li>Automatización inteligente</li><li>Trazabilidad completa de la operación</li></ul><h3>Aplicación práctica</h3><p>Para una empresa manufacturera, aplicar Industria 4.0 significa:</p><ul><li>Tener visibilidad en tiempo real de inventarios y producción</li><li>Eliminar procesos manuales y hojas de cálculo aisladas</li><li>Medir desempeño con indicadores confiables</li><li>Tomar decisiones basadas en datos, no en suposiciones</li></ul><p>La transformación no necesariamente comienza con grandes inversiones en maquinaria avanzada. Muchas veces empieza con algo más fundamental: <strong>ordenar y digitalizar la operación</strong>.</p>'
      },
      'quanta-industria40': {
        title: '¿Cómo encaja Quanta dentro de la Industria 4.0?',
        category: 'Industria 4.0',
        content: '<h3>Quanta: Tu puerta a la digitalización</h3><p>Quanta es una plataforma diseñada para ayudar a empresas manufactureras a dar el paso hacia la digitalización estructurada de su operación.</p><p>En el marco de la Industria 4.0, Quanta actúa como el sistema que integra y organiza los procesos clave del negocio:</p><ul><li>Planeación de producción</li><li>Control de inventarios</li><li>Gestión de compras</li><li>Órdenes de trabajo</li><li>Reportes e indicadores</li><li>Integración entre áreas</li><li>Gestión del ecosistema en la nube</li></ul><h3>Eliminando el caos operativo</h3><p>Al centralizar la información en una sola plataforma, Quanta elimina la dependencia de múltiples archivos de Excel y procesos manuales desconectados.</p><p>Esto permite:</p><ul><li>Trazabilidad completa desde la orden hasta la entrega</li><li>Mayor control sobre costos y márgenes</li><li>Planeación basada en datos reales</li><li>Escalabilidad operativa</li></ul><h3>El primer paso estructural</h3><p>La Industria 4.0 no es solo tecnología avanzada. Es orden, integración y visibilidad. Quanta habilita ese primer paso estructural que muchas empresas manufactureras necesitan para modernizar su gestión.</p>'
      },
      'mto-vs-mts': {
        title: 'Make to Order vs Make to Stock: el problema no es el modelo',
        category: 'Estrategia',
        content: '<h3>El dilema que no es dilema</h3><p>En teoría suena muy bonito: "nosotros somos Make to Order" o "trabajamos Make to Stock".</p><p>En la práctica, la mayoría de empresas no tiene claro qué está haciendo realmente. Y eso se nota en inventarios inflados, entregas tarde y discusiones internas entre ventas y producción.</p><h3>Make to Order</h3><p>Produces cuando tienes el pedido. No fabricas nada si no está vendido. Es típico cuando el producto cambia mucho o cuando cada cliente pide algo distinto.</p><p>El atractivo es obvio: no tienes producto terminado acumulado. No tienes plata quieta en una bodega.</p><p><strong>Pero aquí viene la parte incómoda:</strong> si no tienes control fino de materiales, tiempos y capacidad, el modelo se vuelve caótico. Empiezan las compras urgentes, los cambios de programación y las entregas que se corren.</p><h3>Make to Stock</h3><p>Produces antes de vender. Te anticipas a la demanda. Eso te permite responder rápido y no hacer esperar al cliente.</p><p>El riesgo aquí no es operativo, es financiero. Si proyectas mal, te quedas con inventario que no rota. Y ese inventario no solo ocupa espacio; está consumiendo flujo de caja todos los días.</p><h3>La verdadera causa del problema</h3><p>Lo curioso es que muchas empresas dicen que son Make to Order, pero igual tienen inventarios grandes. O dicen que son Make to Stock, pero viven produciendo por urgencias.</p><p><strong>En realidad, operan un híbrido, pero sin sistema que lo sostenga.</strong></p><h3>El modelo no es el enemigo</h3><p>Si sabes exactamente:</p><ul><li>Qué tienes disponible</li><li>Qué está comprometido</li><li>Qué capacidad real tienes esta semana</li><li>Cómo impacta cada orden en tus costos</li></ul><p>Entonces puedes operar cualquiera de los dos modelos con tranquilidad.</p><p>Pero si esa información está repartida en Excel, en la cabeza de alguien o en reportes atrasados, el modelo deja de ser estrategia y se vuelve improvisación.</p><p><strong>Y la improvisación casi siempre termina afectando el margen.</strong></p>'
      }
    };

    var article = articles[articleId];
    if (!article) return;

    var modal = document.createElement('div');
    modal.className = 'article-modal';
    modal.innerHTML = '<div class="article-modal-content">' +
      '<button type="button" class="article-close" aria-label="Cerrar">\u2715</button>' +
      '<div class="article-header">' +
        '<span class="article-category">' + article.category + '</span>' +
        '<h2 class="article-title">' + article.title + '</h2>' +
      '</div>' +
      '<div class="article-body">' + article.content + '</div>' +
      '<div class="article-footer">' +
        '<a href="https://calendly.com/jcaro-qpalliance/demo-quanta" target="_blank" rel="noopener" class="article-cta">\u00bfTe interesa implementar esto? Agenda una demo</a>' +
      '</div>' +
    '</div>';

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    var closeBtn = modal.querySelector('.article-close');
    if (closeBtn) closeBtn.addEventListener('click', window.closeArticleModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) window.closeArticleModal();
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        window.closeArticleModal();
        document.removeEventListener('keydown', onEsc);
      }
    });

    requestAnimationFrame(function () {
      modal.classList.add('active');
    });
  }

  // ===== PARTÍCULAS FLOTANTES GLOBALES =====
  function createFloatingParticles() {
    var particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.appendChild(particlesContainer);

    for (var i = 0; i < 30; i++) {
      var particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 5 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
      particlesContainer.appendChild(particle);
    }
  }

  createFloatingParticles();
})();
