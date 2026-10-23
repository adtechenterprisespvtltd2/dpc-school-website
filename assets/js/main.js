/**
 * D.P.C. ROLE MODEL EXCELLENCE SCHOOL - INTERACTIVE ENGINE
 * Modern Micro-interactions, Animated Counters, Tabs, Filters, and Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Frosted Glass Navbar Scroll Effect
  const navbar = document.querySelector('.main-navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 2. Mobile Drawer Navigation
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerOverlay = document.querySelector('.drawer-overlay');
  const drawerClose = document.querySelector('.drawer-close');

  function openDrawer() {
    mobileDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    mobileDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // 3. Academic Stages Tab Switcher
  const stageTabs = document.querySelectorAll('.stage-tab-btn');
  const stagePanels = document.querySelectorAll('.stage-content-panel');

  stageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetStage = tab.getAttribute('data-stage');

      stageTabs.forEach(t => t.classList.remove('active'));
      stagePanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const activePanel = document.getElementById(`stage-${targetStage}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // 4. Facilities Interactive Filtering
  const filterPills = document.querySelectorAll('.filter-pill');
  const facilityCards = document.querySelectorAll('.facility-card');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const category = pill.getAttribute('data-filter');

      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      facilityCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });

  // 5. Animated Number Counters (Intersection Observer)
  const statNumbers = document.querySelectorAll('.stat-number');
  let animatedStats = false;

  const countUp = (el, target, duration = 1800) => {
    let start = 0;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        el.innerText = target.toLocaleString();
        clearInterval(timer);
      } else {
        el.innerText = Math.floor(start).toLocaleString();
      }
    }, stepTime);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animatedStats) {
        animatedStats = true;
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-count'), 10);
          if (!isNaN(target)) {
            countUp(stat, target);
          }
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-strip-container');
  if (statsSection) observer.observe(statsSection);

  // 6. Interactive Admission & Transport Fee Estimator
  const gradeSelect = document.getElementById('calc-grade');
  const transportSelect = document.getElementById('calc-transport');
  const feeDisplay = document.getElementById('calc-total-fee');

  function calculateFee() {
    if (!gradeSelect || !transportSelect || !feeDisplay) return;

    const gradeBase = parseInt(gradeSelect.value, 10) || 28000;
    const transportAddon = parseInt(transportSelect.value, 10) || 0;
    const total = gradeBase + transportAddon;

    feeDisplay.innerText = `₹${total.toLocaleString('en-IN')}`;
  }

  if (gradeSelect) gradeSelect.addEventListener('change', calculateFee);
  if (transportSelect) transportSelect.addEventListener('change', calculateFee);
  calculateFee();

  // 7. Admission Modal & Tour Booking Modals
  const modalBackdrop = document.getElementById('admission-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const openModalBtns = document.querySelectorAll('.trigger-admission-modal');

  function openModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  openModalBtns.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  }));

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  // 8. Toast Feedback Trigger
  const toast = document.getElementById('toast-feedback');
  const toastMessage = document.getElementById('toast-text');

  function showToast(msg = 'Thank you! Your inquiry has been received.') {
    if (!toast) return;
    if (toastMessage) toastMessage.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // Form Submission Handlers
  const admissionForm = document.getElementById('modal-inquiry-form');
  if (admissionForm) {
    admissionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal();
      showToast('🎉 Admission inquiry received! Our counselors will contact you within 24 hours.');
      admissionForm.reset();
    });
  }

  const contactInquiryForm = document.getElementById('general-contact-form');
  if (contactInquiryForm) {
    contactInquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('✉️ Message sent successfully! The DPC administration will reply shortly.');
      contactInquiryForm.reset();
    });
  }

  // 9. Gallery Lightbox Preview
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (galleryItems.length && lightboxModal && lightboxImg) {
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const title = item.querySelector('h5')?.innerText || 'DPC Campus Highlight';
        if (img) {
          lightboxImg.src = img.src;
          if (lightboxCaption) lightboxCaption.innerText = title;
          lightboxModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', () => {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
});
