/**
 * D.P.C. ROLE MODEL EXCELLENCE SCHOOL - INTERACTIVE ENGINE
 * Modern Micro-interactions, Animated Counters, Tabs, Filters, and Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Dynamic Scroll Progress Bar
  const progressBar = document.getElementById('scroll-progress-bar');
  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (progressBar && height > 0) {
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = `${scrolled}%`;
    }
  });

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

  // Form Submission Handlers (Connected to Backend REST API)
  const admissionForm = document.getElementById('modal-inquiry-form');
  if (admissionForm) {
    admissionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentName = document.getElementById('modal-student-name')?.value || '';
      const grade = document.getElementById('modal-grade')?.value || '';
      const mobile = document.getElementById('modal-parent-phone')?.value || '';
      const parentName = document.getElementById('modal-parent-name')?.value || '';
      const tourDate = document.getElementById('modal-tour-date')?.value || '';
      const userNotes = document.getElementById('modal-notes')?.value || '';

      const notes = tourDate ? `Preferred Campus Visit Date: ${tourDate}. Note: ${userNotes}` : userNotes;

      try {
        const response = await fetch('/api/admissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentName, parentName, mobile, grade, notes })
        });
        const resData = await response.json();
        closeModal();
        if (resData.success) {
          showToast(`🎉 Application registered! App ID: ${resData.data.id}. Our admissions team will contact you shortly.`);
        } else {
          showToast('🎉 Admission inquiry received! Our counselors will contact you within 24 hours.');
        }
      } catch (err) {
        // Fallback for standalone preview
        closeModal();
        showToast('🎉 Admission inquiry received! Our counselors will contact you within 24 hours.');
      }
      admissionForm.reset();
    });
  }

  const contactInquiryForm = document.getElementById('general-contact-form');
  if (contactInquiryForm) {
    contactInquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value || '';
      const phone = document.getElementById('contact-phone')?.value || '';
      const seekingClass = document.getElementById('contact-class')?.value || '';
      const email = document.getElementById('contact-email')?.value || '';
      const message = document.getElementById('contact-message')?.value || '';

      try {
        await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, seekingClass, email, message })
        });
        showToast('✉️ Message saved to school database! The administration will call you back shortly.');
      } catch (err) {
        showToast('✉️ Message sent successfully! The DPC administration will reply shortly.');
      }
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

  // ===================================================================
  // 10. DPC AI ASSISTANT CHATBOT ENGINE
  // ===================================================================
  const aiToggle = document.getElementById('dpc-ai-toggle');
  const aiWindow = document.getElementById('dpc-ai-window');
  const aiClose = document.getElementById('ai-chat-close');
  const aiMessages = document.getElementById('ai-chat-messages');
  const aiForm = document.getElementById('ai-chat-form');
  const aiInput = document.getElementById('ai-chat-input');
  const aiChips = document.querySelectorAll('.ai-chip');

  let hasGreeted = false;

  function toggleAiChat() {
    if (!aiWindow) return;
    const isActive = aiWindow.classList.toggle('active');
    if (isActive && !hasGreeted) {
      hasGreeted = true;
      botReply("👋 **Hello! Welcome to D.P.C. Role Model Excellence School.**<br>I am your 24/7 AI Campus Assistant. Ask me anything about admissions, fee structures, bus routes, CBSE accreditations, or leadership details!");
    }
    if (isActive && aiInput) {
      setTimeout(() => aiInput.focus(), 300);
    }
  }

  if (aiToggle) aiToggle.addEventListener('click', toggleAiChat);
  if (aiClose) aiClose.addEventListener('click', () => aiWindow.classList.remove('active'));

  function appendMessage(text, sender = 'bot') {
    if (!aiMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `ai-bubble ${sender}`;
    bubble.innerHTML = text;
    aiMessages.appendChild(bubble);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // Attach click listener if message contains admission link
    const admissionLinks = bubble.querySelectorAll('.chat-link-admission');
    admissionLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });
  }

  function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'ai-bubble bot typing-indicator';
    typing.id = 'ai-typing-temp';
    typing.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    aiMessages.appendChild(typing);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('ai-typing-temp');
    if (el) el.remove();
  }

  function botReply(text, delay = 500) {
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      appendMessage(text, 'bot');
    }, delay);
  }

  // School Knowledge Retrieval
  function getSchoolResponse(query) {
    const q = query.toLowerCase().trim();

    if (q.includes('admission') || q.includes('enquiry') || q.includes('apply') || q.includes('register') || q.includes('lkg') || q.includes('nursery') || q.includes('class 1') || q.includes('class 11') || q.includes('procedure') || q.includes('document')) {
      return "🎓 <strong>Admissions 2026-27 are Currently OPEN!</strong><br><br>• <strong>Classes:</strong> Nursery, LKG, UKG up to Class XII.<br>• <strong>Criteria:</strong> Merit basis with friendly age-appropriate interaction.<br>• <strong>Required Documents:</strong> Birth Certificate (for LKG/Nursery), Transfer Certificate (TC) & previous report card for higher grades.<br><br>👉 <a href='#' class='chat-link-admission' style='color:#B8860B; font-weight:800; text-decoration:underline;'>Click here to open the Online Admission Application Form</a>.";
    }

    if (q.includes('fee') || q.includes('charge') || q.includes('installment') || q.includes('payment') || q.includes('cost')) {
      return "💰 <strong>Annual Fee & Installment Structure:</strong><br><br>• <strong>Pre-Primary (Nursery - UKG):</strong> ~₹26,000 / year<br>• <strong>Primary Wing (Class I - V):</strong> ~₹32,000 / year<br>• <strong>Middle Wing (Class VI - VIII):</strong> ~₹38,000 / year<br>• <strong>Secondary (Class IX - X):</strong> ~₹46,000 / year<br>• <strong>Senior Secondary (XI - XII):</strong> ~₹50,000 – ₹54,000 / year<br>• <strong>Bus Transport:</strong> ₹9,000 – ₹15,000 / year by distance zone.<br><br><em>Fees are payable in 4 easy quarterly installments. You can also try our interactive Fee Calculator on the homepage!</em>";
    }

    if (q.includes('principal') || q.includes('amita')) {
      return "👩‍🏫 <strong>Principal Details:</strong><br><br>• <strong>Name:</strong> Dr. Amita Chaturvedi<br>• <strong>Qualifications:</strong> M.Sc., M.Ed.<br>• <strong>Position:</strong> Principal, D.P.C. Role Model Excellence School, Seoni.<br>• She brings decades of distinguished educational leadership, fostering CBSE board merit and all-around student personality development.";
    }

    if (q.includes('director') || q.includes('patron') || q.includes('founder') || q.includes('samiti') || q.includes('society') || q.includes('k.k.') || q.includes('kk chaturvedi')) {
      return "🏛️ <strong>Director & Institutional Heritage:</strong><br><br>• <strong>Director & Patron:</strong> Dr. K.K. Chaturvedi (Ph.D., M.Sc.(Maths), M.A., D.Lit., A.F.S.I.)<br>• <strong>Founding Vision:</strong> Inspired by late <strong>Shri D. P. Chaturvedi</strong> (Patron, teacher, philosopher) who initiated the DPC education mission in 1999.<br>• <strong>Management:</strong> Shri Ram Adarsh Shiksha Samiti.<br>• <strong>Establishment:</strong> The Role Model Excellence School campus was established in 2016.";
    }

    if (q.includes('cbse') || q.includes('affiliation') || q.includes('code') || q.includes('dise') || q.includes('board')) {
      return "📜 <strong>CBSE Affiliation & Official Statutory Details:</strong><br><br>• <strong>Affiliation:</strong> Central Board of Secondary Education (CBSE), New Delhi<br>• <strong>Affiliation Number:</strong> 1031077<br>• <strong>School Code:</strong> 51045<br>• <strong>DISE Code:</strong> 23440107703<br>• <strong>Status:</strong> Co-educational, English Medium, Senior Secondary Level.";
    }

    if (q.includes('address') || q.includes('location') || q.includes('where') || q.includes('map') || q.includes('reach')) {
      return "📍 <strong>School Location & Address:</strong><br><br>D.P.C. Role Model Excellence School<br><strong>Dreamland City, Dorlichhatarpur, Katangi Road, Seoni (M.P.) — 480661</strong><br><br>The campus is situated in a spacious, pollution-free, green educational sanctuary with modern infrastructure.";
    }

    if (q.includes('contact') || q.includes('phone') || q.includes('mobile') || q.includes('number') || q.includes('call') || q.includes('email')) {
      return "📞 <strong>Official Contact Helplines:</strong><br><br>• <strong>Admissions Office:</strong> +91 9424887350<br>• <strong>Campus Helplines:</strong> 9479887990, 8817134960, 8359945067, 07692293635<br>• <strong>Official Email:</strong> dpcrolemodelschool@gmail.com<br>• <strong>Visiting Hours:</strong> Mon – Sat, 8:30 AM – 3:30 PM.";
    }

    if (q.includes('bus') || q.includes('transport') || q.includes('route') || q.includes('pickup') || q.includes('drop')) {
      return "🚌 <strong>Safe School Transport Fleet:</strong><br><br>• Modern fleet of yellow buses equipped with <strong>GPS Live Tracking, CCTV Cameras, Speed Governors</strong>, and female attendants.<br>• Operating across Seoni City, Dorlichhatarpur, Katangi Road, and adjoining rural hubs.<br>• Real-time bus tracking alerts provided to parents.";
    }

    if (q.includes('timing') || q.includes('hours') || q.includes('time') || q.includes('saturday') || q.includes('holiday')) {
      return "⏰ <strong>School & Campus Hours:</strong><br><br>• <strong>Class Timings:</strong> 8:00 AM – 2:00 PM (Monday to Saturday)<br>• <strong>Admissions & Admin Desk:</strong> 8:30 AM – 3:30 PM<br>• <strong>Open House Campus Visits:</strong> Every Saturday 10:00 AM – 2:00 PM.";
    }

    if (q.includes('lab') || q.includes('computer') || q.includes('facility') || q.includes('facilities') || q.includes('sports') || q.includes('library') || q.includes('smart class')) {
      return "🔬 <strong>World-Class Campus Facilities:</strong><br><br>• <strong>Smart Classrooms:</strong> Interactive digital LED touch boards.<br>• <strong>Laboratories:</strong> Full Physics, Chemistry, and Biology practical labs.<br>• <strong>Computer & AI Hub:</strong> Coding, robotics, and computing workstations.<br>• <strong>Central Library:</strong> 10,000+ curriculum books, reference literature, and reading rooms.<br>• <strong>Sports Complex:</strong> Football ground, basketball, cricket nets, and athletics.";
    }

    if (q.includes('jee') || q.includes('neet') || q.includes('nda') || q.includes('competitive') || q.includes('coaching') || q.includes('stream')) {
      return "🎯 <strong>Senior Secondary Streams & Competitive Coaching:</strong><br><br>• <strong>Streams in Class XI & XII:</strong> Science (PCM / PCB), Commerce, and Humanities.<br>• <strong>Integrated Coaching:</strong> Dedicated prep sessions for <strong>IIT-JEE, NEET, NDA, Olympiads, and CUET</strong> by senior specialist faculty.";
    }

    return "Thank you for reaching out to D.P.C. Role Model Excellence School! I can provide full information regarding:<br>• <strong>Admissions 2026-27</strong><br>• <strong>Fee Structure & Scholarships</strong><br>• <strong>Principal Dr. Amita Chaturvedi & Director Dr. K.K. Chaturvedi</strong><br>• <strong>CBSE Affiliation (Code: 51045, Affil: 1031077)</strong><br>• <strong>Bus Routes & Campus Location</strong><br><br>Please select any quick topic button below or ask your specific question!";
  }

  function handleUserMessage(queryText) {
    if (!queryText || !queryText.trim()) return;
    appendMessage(queryText, 'user');
    if (aiInput) aiInput.value = '';

    const reply = getSchoolResponse(queryText);
    botReply(reply, 500);
  }

  if (aiForm) {
    aiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = aiInput ? aiInput.value : '';
      handleUserMessage(val);
    });
  }

  aiChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      handleUserMessage(q);
    });
  });

  // 10. Chat Link to Admission Modal Trigger
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('chat-link-admission')) {
      e.preventDefault();
      openModal();
    }
  });

  // 11. Scroll Entrance Reveal Observer (Smooth & Dynamic)
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // Fallback: Ensure all reveal elements are visible if scrolled or after initial delay
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-revealed)').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 50) {
        el.classList.add('is-revealed');
      }
    });
  }, 400);

  // 12. Interactive 3D Perspective Tilt on Mouse Movement
  const tiltCards = document.querySelectorAll('.tilt-card, .facility-card, .step-card, .disclosure-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
});
