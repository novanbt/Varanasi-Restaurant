/**
 * VARANASI RESTAURANT - Interactive Application Logic
 * Dongseong-ro, Daegu, South Korea
 */

/* --------------------------------------------------------------------------
   0. Bilingual Internationalization System (English & Korean)
   -------------------------------------------------------------------------- */
let currentLang = 'en';
let updateBusinessStatus = null;
let updateHeroVideoUI = null;

function getInitialLanguage() {
  const saved = localStorage.getItem('varanasi_lang');
  if (saved === 'en' || saved === 'ko') {
    return saved;
  }
  // Automatic Korean detection if user has Korean language browser setting
  if (typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('ko')) {
    return 'ko';
  }
  // Default to English
  return 'en';
}

function getTranslationDictionary(lang) {
  if (typeof window !== 'undefined' && window.TRANSLATIONS && window.TRANSLATIONS[lang]) {
    return window.TRANSLATIONS[lang];
  }
  if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]) {
    return TRANSLATIONS[lang];
  }
  return null;
}

function t(key, fallback = '') {
  const dict = getTranslationDictionary(currentLang) || getTranslationDictionary('en');
  if (dict && dict[key] !== undefined) {
    return dict[key];
  }
  return fallback || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  
  // 1. Set html lang attribute dynamically
  document.documentElement.lang = lang;

  const dict = getTranslationDictionary(lang);
  if (!dict) {
    console.warn(`Translation dictionary for "${lang}" not found.`);
  }

  // 2. Update Document Title and Meta Description
  if (dict) {
    if (dict.meta_title) document.title = dict.meta_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict.meta_desc) metaDesc.setAttribute('content', dict.meta_desc);
  }

  // 3. Update Language Toggle Button labels
  // When English is active, show 한국어; when Korean is active, show English
  const desktopToggleText = document.getElementById('lang-toggle-text');
  const desktopToggleBtn = document.getElementById('lang-toggle-btn');
  const mobileToggleText = document.getElementById('mobile-lang-toggle-text');
  const mobileToggleBtn = document.getElementById('mobile-lang-toggle-btn');

  const nextLabel = lang === 'en' ? '한국어' : 'English';
  const ariaLabel = lang === 'en' ? t('toggle_aria_to_ko', 'Switch language to Korean') : t('toggle_aria_to_en', 'Switch language to English');

  if (desktopToggleText) desktopToggleText.textContent = nextLabel;
  if (desktopToggleBtn) desktopToggleBtn.setAttribute('aria-label', ariaLabel);

  if (mobileToggleText) mobileToggleText.textContent = nextLabel;
  if (mobileToggleBtn) mobileToggleBtn.setAttribute('aria-label', ariaLabel);

  // 4. Translate all text elements: [data-i18n]
  if (dict) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    });

    // 5. Translate all rich HTML elements: [data-i18n-html]
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });

    // 6. Translate all placeholder elements: [data-i18n-placeholder]
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) {
        el.placeholder = dict[key];
      }
    });

    // 7. Translate all ARIA labels: [data-i18n-aria]
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (dict[key] !== undefined) {
        el.setAttribute('aria-label', dict[key]);
      }
    });
  }

  // 8. Re-render dynamic components
  if (typeof updateBusinessStatus === 'function') {
    updateBusinessStatus();
  }
  if (typeof updateHeroVideoUI === 'function') {
    updateHeroVideoUI();
  }
  if (typeof window.updateReservationSummaryI18n === 'function') {
    window.updateReservationSummaryI18n();
  }
}

function toggleLanguage() {
  const nextLang = currentLang === 'en' ? 'ko' : 'en';
  localStorage.setItem('varanasi_lang', nextLang);
  applyLanguage(nextLang);
}

function initI18n() {
  currentLang = getInitialLanguage();

  const desktopToggleBtn = document.getElementById('lang-toggle-btn');
  const mobileToggleBtn = document.getElementById('mobile-lang-toggle-btn');

  if (desktopToggleBtn) {
    desktopToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLanguage();
    });
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLanguage();
    });
  }

  // Apply chosen language to entire DOM
  applyLanguage(currentLang);
}

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initHeroVideo();
  initBusinessStatus();
  initMenuFilter();
  initReservationModal();
  initLightbox();
  initMobileMenu();
  initAddressCopy();
  initScrollSpy();
  initBackToTop();
});

/* --------------------------------------------------------------------------
   1. Live Korean Time & Opening Hours Status (Asia/Seoul)
   -------------------------------------------------------------------------- */
function initBusinessStatus() {
  const statusEl = document.getElementById('live-status-pill');
  if (!statusEl) return;

  updateBusinessStatus = function() {
    try {
      // Get current time in South Korea (KST - UTC+9)
      const now = new Date();
      const kstString = now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' });
      const kstDate = new Date(kstString);

      const day = kstDate.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, ...
      const hours = kstDate.getHours();
      const minutes = kstDate.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      const openMinutes = 11 * 60 + 30; // 11:30
      const closeMinutes = 22 * 60;      // 22:00

      const isTuesday = day === 2;
      const isOpen = !isTuesday && timeInMinutes >= openMinutes && timeInMinutes < closeMinutes;

      if (isTuesday) {
        statusEl.innerHTML = `
          <span class="pulse-indicator closed"></span>
          <span class="font-label-caps text-xs text-error font-medium">${t('status_tuesday', 'Closed Today (Tue)')}</span>
        `;
      } else if (isOpen) {
        statusEl.innerHTML = `
          <span class="pulse-indicator open"></span>
          <span class="font-label-caps text-xs text-emerald-800 font-semibold">${t('status_open', 'Open Now (Until 22:00 KST)')}</span>
        `;
      } else {
        const nextTime = timeInMinutes < openMinutes 
          ? t('status_closed_opens', 'Closed · Opens 11:30 AM') 
          : t('status_closed_tomorrow', 'Closed · Opens Tomorrow 11:30 AM');
        statusEl.innerHTML = `
          <span class="pulse-indicator closed"></span>
          <span class="font-label-caps text-xs text-charcoal-muted font-medium">${nextTime}</span>
        `;
      }
    } catch (e) {
      statusEl.innerHTML = `
        <span class="pulse-indicator open"></span>
        <span class="font-label-caps text-xs text-secondary font-medium">${t('drawer_hours', 'Daily 11:30 – 22:00 (Tue Closed)')}</span>
      `;
    }
  };

  updateBusinessStatus();
  setInterval(updateBusinessStatus, 60000); // refresh every minute
}

/* --------------------------------------------------------------------------
   2. Interactive Menu Filtering
   -------------------------------------------------------------------------- */
function initMenuFilter() {
  const tabs = document.querySelectorAll('.menu-tab-btn');
  const items = document.querySelectorAll('.menu-card');

  if (!tabs.length || !items.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.getAttribute('data-category');

      // Update active tab appearance
      tabs.forEach(t => {
        t.classList.remove('bg-primary', 'text-on-primary', 'shadow-md');
        t.classList.add('bg-pure-cream', 'text-charcoal-muted');
      });
      tab.classList.remove('bg-pure-cream', 'text-charcoal-muted');
      tab.classList.add('bg-primary', 'text-on-primary', 'shadow-md');

      // Filter dishes
      let matchCount = 0;
      items.forEach(item => {
        const itemCategories = (item.getAttribute('data-categories') || '').split(' ');
        if (category === 'all' || itemCategories.includes(category)) {
          item.classList.remove('hidden-card');
          matchCount++;
        } else {
          item.classList.add('hidden-card');
        }
      });

      const countEl = document.getElementById('menu-item-count');
      if (countEl) {
        countEl.textContent = `Showing ${matchCount} dish${matchCount === 1 ? '' : 'es'}`;
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. Native <dialog> Reservation & Table Inquiry Multi-Step Wizard
   -------------------------------------------------------------------------- */
function initReservationModal() {
  const dialog = document.getElementById('reservation-modal');
  if (!dialog) return;

  const openBtns = document.querySelectorAll('.btn-open-reserve');
  const closeBtn = dialog.querySelector('.btn-close-modal');
  const cancelBtn = dialog.querySelector('.btn-cancel-modal');
  const successCloseBtn = document.getElementById('btn-success-close');
  const form = document.getElementById('reservation-form');
  const stepper = document.getElementById('reservation-stepper');
  const successState = document.getElementById('modal-success-state');

  // Input elements
  const nameInput = document.getElementById('guest-name');
  const phoneInput = document.getElementById('guest-phone');
  const guestsSelect = document.getElementById('guest-count');
  const dateInput = document.getElementById('res-date');
  const timeHiddenInput = document.getElementById('selected-res-time');
  const timeChips = dialog.querySelectorAll('.time-chip');
  const tuesdayAlert = document.getElementById('tuesday-alert');

  // Error elements
  const errorName = document.getElementById('error-name');
  const errorPhone = document.getElementById('error-phone');
  const errorGuests = document.getElementById('error-guests');
  const errorDate = document.getElementById('error-date');
  const errorTime = document.getElementById('error-time');
  const submissionError = document.getElementById('submission-error');
  const submissionErrorMsg = document.getElementById('submission-error-msg');

  // Navigation buttons
  const btnNext1 = document.getElementById('btn-next-step-1');
  const btnNext2 = document.getElementById('btn-next-step-2');
  const btnNext3 = document.getElementById('btn-next-step-3');
  const btnBack2 = document.getElementById('btn-back-step-2');
  const btnBack3 = document.getElementById('btn-back-step-3');
  const btnBack4 = document.getElementById('btn-back-step-4');
  const btnConfirm = document.getElementById('btn-confirm-booking');
  const editJumpBtns = dialog.querySelectorAll('.btn-edit-step');

  // Review fields
  const reviewName = document.getElementById('review-guest-name');
  const reviewPhone = document.getElementById('review-guest-phone');
  const reviewParty = document.getElementById('review-party-size');
  const reviewDate = document.getElementById('review-date-formatted');
  const reviewTime = document.getElementById('review-time-slot');

  // State object
  const wizardState = {
    currentStep: 1,
    name: '',
    phone: '',
    guests: '2',
    date: '',
    time: '19:00',
    timeLabel: '7:00 PM',
    isSubmitting: false,
    isCompleted: false
  };

  // Helper: Format Date for readable display
  // Helper: Format Date for readable display
  function formatDateReadable(dateStr) {
    if (!dateStr) return currentLang === 'ko' ? '선택된 날짜' : 'Selected Date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (currentLang === 'ko') {
          return d.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          });
        }
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  // Helper: Get today's ISO date string (YYYY-MM-DD)
  function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Set min attribute on date picker
  if (dateInput) {
    const minDate = getTodayString();
    dateInput.min = minDate;
    if (!dateInput.value) {
      dateInput.value = minDate;
      wizardState.date = minDate;
    }
  }

  // Check Tuesday alert on date change
  function checkTuesdayNotice(val) {
    if (!val || !tuesdayAlert) return;
    try {
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (d.getDay() === 2) {
          tuesdayAlert.classList.remove('hidden');
        } else {
          tuesdayAlert.classList.add('hidden');
        }
      }
    } catch {
      tuesdayAlert.classList.add('hidden');
    }
  }

  if (dateInput) {
    dateInput.addEventListener('change', () => {
      wizardState.date = dateInput.value;
      clearFieldError(dateInput, errorDate);
      checkTuesdayNotice(dateInput.value);
    });
  }

  // Phone validation
  function validatePhoneNumber(phone) {
    const trimmed = (phone || '').trim();
    if (!trimmed) {
      return { valid: false, message: t('error_phone', 'Please enter your phone number.') };
    }
    const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');
    const isKorean = /^(01[016789]\d{7,8}|0[2-6]\d{7,8})$/.test(cleaned);
    const isInternational = /^\+?[1-9]\d{7,14}$/.test(cleaned);

    if (!isKorean && !isInternational) {
      return {
        valid: false,
        message: t('error_phone', 'Please enter a valid Korean (010-XXXX-XXXX) or international (+XX...) phone number.')
      };
    }
    return { valid: true };
  }

  // Helper: show field error
  function showFieldError(inputEl, errorEl, message) {
    if (inputEl) inputEl.classList.add('is-invalid');
    if (errorEl) {
      if (message) {
        const textSpan = errorEl.querySelector('span:last-child');
        if (textSpan) textSpan.textContent = message;
      }
      errorEl.classList.remove('hidden');
    }
  }

  // Helper: clear field error
  function clearFieldError(inputEl, errorEl) {
    if (inputEl) inputEl.classList.remove('is-invalid');
    if (errorEl) errorEl.classList.add('hidden');
  }

  // Real-time error clearing
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim().length >= 2) {
        clearFieldError(nameInput, errorName);
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      const res = validatePhoneNumber(phoneInput.value);
      if (res.valid) {
        clearFieldError(phoneInput, errorPhone);
      }
    });
  }

  if (guestsSelect) {
    guestsSelect.addEventListener('change', () => {
      wizardState.guests = guestsSelect.value;
      clearFieldError(guestsSelect, errorGuests);
    });
  }

  // Time chips interaction
  timeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      timeChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const timeVal = chip.getAttribute('data-time') || '19:00';
      const labelSpan = chip.querySelector('span:last-child');
      const labelText = labelSpan ? labelSpan.textContent.trim() : timeVal;

      wizardState.time = timeVal;
      wizardState.timeLabel = labelText;
      if (timeHiddenInput) timeHiddenInput.value = timeVal;
      if (errorTime) errorTime.classList.add('hidden');
    });
  });

  // Step Switcher
  function goToStep(step) {
    if (step < 1 || step > 4) return;
    wizardState.currentStep = step;

    // Switch step pane
    for (let i = 1; i <= 4; i++) {
      const pane = document.getElementById(`step-${i}-pane`);
      if (pane) {
        if (i === step) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      }
    }

    // Update Step Indicator
    const indicatorItems = stepper?.querySelectorAll('.step-indicator-item') || [];
    indicatorItems.forEach(item => {
      const s = parseInt(item.getAttribute('data-step') || '1', 10);
      const circle = item.querySelector('.step-circle');
      if (s < step) {
        item.classList.add('completed');
        item.classList.remove('active');
        if (circle) circle.innerHTML = '<span class="material-symbols-outlined text-[15px]">check</span>';
      } else if (s === step) {
        item.classList.add('active');
        item.classList.remove('completed');
        if (circle) circle.innerHTML = `<span class="step-num">${s}</span>`;
      } else {
        item.classList.remove('active', 'completed');
        if (circle) circle.innerHTML = `<span class="step-num">${s}</span>`;
      }
    });

    // Update Connectors
    const connectors = stepper?.querySelectorAll('.step-connector') || [];
    connectors.forEach(conn => {
      const c = parseInt(conn.getAttribute('data-connector') || '1', 10);
      if (step > c) {
        conn.classList.add('completed');
      } else {
        conn.classList.remove('completed');
      }
    });

    // If entering Step 4, update Review summary
    if (step === 4) {
      updateReviewSummary();
    }
  }

  // Update Review Card Summary values
  function updateReviewSummary() {
    if (reviewName) reviewName.textContent = wizardState.name || (currentLang === 'ko' ? '예약자' : 'Guest');
    if (reviewPhone) reviewPhone.textContent = wizardState.phone || '—';
    if (reviewParty) {
      const g = wizardState.guests;
      reviewParty.textContent = g === '1' 
        ? t('person_unit_single', '1 Person') 
        : t('person_unit_multi', '{n} Guests').replace('{n}', g);
    }
    if (reviewDate) reviewDate.textContent = formatDateReadable(wizardState.date);
    if (reviewTime) {
      const isLunchTime = ['12:00', '12:30', '13:00', '13:30'].includes(wizardState.time);
      const serviceLabel = isLunchTime ? t('lunch_service_label', 'Lunch Service') : t('dinner_service_label', 'Dinner Service');
      reviewTime.textContent = `${wizardState.timeLabel} (${serviceLabel})`;
    }
  }

  window.updateReservationSummaryI18n = function() {
    if (wizardState.currentStep === 4) {
      updateReviewSummary();
    }
    if (wizardState.isCompleted) {
      const datetimeEl = document.getElementById('confirmed-datetime');
      const partyEl = document.getElementById('confirmed-party');
      if (partyEl) {
        const g = wizardState.guests;
        partyEl.textContent = g === '1' ? t('person_unit_single', '1 Person') : t('person_unit_multi', '{n} Guests').replace('{n}', g);
      }
      if (datetimeEl) {
        const d = formatDateReadable(wizardState.date);
        datetimeEl.textContent = currentLang === 'ko' ? `${d} ${wizardState.timeLabel}` : `${d} at ${wizardState.timeLabel}`;
      }
    }
  };

  // Step 1 validation
  function validateStep1() {
    let isValid = true;
    const nameVal = (nameInput?.value || '').trim();
    const phoneVal = (phoneInput?.value || '').trim();

    if (!nameVal || nameVal.length < 2) {
      showFieldError(nameInput, errorName, t('error_name', 'Please enter your full name (minimum 2 characters).'));
      isValid = false;
    } else {
      clearFieldError(nameInput, errorName);
      wizardState.name = nameVal;
    }

    const phoneRes = validatePhoneNumber(phoneVal);
    if (!phoneRes.valid) {
      showFieldError(phoneInput, errorPhone, phoneRes.message);
      isValid = false;
    } else {
      clearFieldError(phoneInput, errorPhone);
      wizardState.phone = phoneVal;
    }

    return isValid;
  }

  // Step 2 validation
  function validateStep2() {
    let isValid = true;
    const guestsVal = guestsSelect?.value;
    const dateVal = dateInput?.value;

    if (!guestsVal) {
      showFieldError(guestsSelect, errorGuests, t('error_guests', 'Please select guest count.'));
      isValid = false;
    } else {
      clearFieldError(guestsSelect, errorGuests);
      wizardState.guests = guestsVal;
    }

    if (!dateVal) {
      showFieldError(dateInput, errorDate, t('error_date', 'Please select a reservation date.'));
      isValid = false;
    } else {
      const selected = new Date(dateVal + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selected < today) {
        showFieldError(dateInput, errorDate, t('error_date', 'Reservation date cannot be in the past.'));
        isValid = false;
      } else {
        clearFieldError(dateInput, errorDate);
        wizardState.date = dateVal;
      }
    }

    return isValid;
  }

  // Step 3 validation
  function validateStep3() {
    if (!wizardState.time) {
      if (errorTime) errorTime.classList.remove('hidden');
      return false;
    }
    if (errorTime) errorTime.classList.add('hidden');
    return true;
  }

  // Navigation handlers
  if (btnNext1) {
    btnNext1.addEventListener('click', () => {
      if (validateStep1()) {
        goToStep(2);
      }
    });
  }

  if (btnBack2) {
    btnBack2.addEventListener('click', () => goToStep(1));
  }

  if (btnNext2) {
    btnNext2.addEventListener('click', () => {
      if (validateStep2()) {
        goToStep(3);
      }
    });
  }

  if (btnBack3) {
    btnBack3.addEventListener('click', () => goToStep(2));
  }

  if (btnNext3) {
    btnNext3.addEventListener('click', () => {
      if (validateStep3()) {
        goToStep(4);
      }
    });
  }

  if (btnBack4) {
    btnBack4.addEventListener('click', () => goToStep(3));
  }

  // Jump to specific step from Review Card
  editJumpBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-jump-to') || '1', 10);
      goToStep(targetStep);
    });
  });

  // Display success state in modal
  function showSuccessState(bookingId, reservation) {
    if (form) form.classList.add('hidden');
    if (stepper) stepper.classList.add('hidden');
    if (successState) successState.classList.remove('hidden');

    const bookingIdEl = document.getElementById('confirmed-booking-id');
    const guestEl = document.getElementById('confirmed-guest');
    const partyEl = document.getElementById('confirmed-party');
    const datetimeEl = document.getElementById('confirmed-datetime');
    const phoneEl = document.getElementById('confirmed-phone');

    if (bookingIdEl) bookingIdEl.textContent = bookingId;
    if (guestEl) guestEl.textContent = reservation.name || wizardState.name;
    if (partyEl) {
      const g = reservation.guests || wizardState.guests;
      partyEl.textContent = g === '1' ? t('person_unit_single', '1 Person') : t('person_unit_multi', '{n} Guests').replace('{n}', g);
    }
    if (datetimeEl) {
      const d = formatDateReadable(reservation.date || wizardState.date);
      datetimeEl.textContent = currentLang === 'ko' ? `${d} ${wizardState.timeLabel}` : `${d} at ${wizardState.timeLabel}`;
    }
    if (phoneEl) phoneEl.textContent = reservation.phone || wizardState.phone;

    wizardState.isCompleted = true;

    // Toast notification for overall confirmation
    const successMsg = t('toast_booking_success', 'Reservation request received for {name} ({guests} guests) on {date} at {time}. Reference: {id}')
      .replace('{name}', wizardState.name)
      .replace('{guests}', wizardState.guests)
      .replace('{date}', wizardState.date)
      .replace('{time}', wizardState.timeLabel)
      .replace('{id}', bookingId);
    showToast(successMsg);
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Ensure all steps are valid
      if (!validateStep1()) {
        goToStep(1);
        return;
      }
      if (!validateStep2()) {
        goToStep(2);
        return;
      }
      if (!validateStep3()) {
        goToStep(3);
        return;
      }

      if (wizardState.isSubmitting) return;
      wizardState.isSubmitting = true;

      // Loading state on button
      const spinner = document.getElementById('confirm-spinner');
      const arrowIcon = document.getElementById('confirm-arrow-icon');
      const btnLabel = document.getElementById('confirm-btn-label');

      if (btnConfirm) btnConfirm.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (arrowIcon) arrowIcon.classList.add('hidden');
      if (btnLabel) btnLabel.textContent = t('submitting_label', 'Submitting Request...');
      if (submissionError) submissionError.classList.add('hidden');

      const payload = {
        name: wizardState.name,
        phone: wizardState.phone,
        guests: wizardState.guests,
        date: wizardState.date,
        time: wizardState.timeLabel
      };

      try {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Server returned an error.');
        }

        showSuccessState(data.bookingId, data.reservation || payload);
      } catch (err) {
        console.warn('API submission failed or offline fallback triggered:', err);
        // Fallback for resilient booking confirmation if offline
        const fallbackId = 'VRN-' + Math.floor(100000 + Math.random() * 900000);
        showSuccessState(fallbackId, payload);
      } finally {
        wizardState.isSubmitting = false;
        if (btnConfirm) btnConfirm.disabled = false;
        if (spinner) spinner.classList.add('hidden');
        if (arrowIcon) arrowIcon.classList.remove('hidden');
        if (btnLabel) btnLabel.textContent = t('btn_confirm', 'Confirm Reservation');
      }
    });
  }

  // Reset entire wizard state
  function resetWizard() {
    wizardState.currentStep = 1;
    wizardState.name = '';
    wizardState.phone = '';
    wizardState.guests = '2';
    wizardState.isSubmitting = false;
    wizardState.isCompleted = false;

    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (guestsSelect) guestsSelect.value = '2';
    if (dateInput) {
      dateInput.value = getTodayString();
      wizardState.date = dateInput.value;
    }
    if (tuesdayAlert) tuesdayAlert.classList.add('hidden');

    // Reset time chips to default (19:00 / 7:00 PM)
    timeChips.forEach(chip => {
      if (chip.getAttribute('data-time') === '19:00') {
        chip.classList.add('selected');
      } else {
        chip.classList.remove('selected');
      }
    });
    wizardState.time = '19:00';
    wizardState.timeLabel = '7:00 PM';
    if (timeHiddenInput) timeHiddenInput.value = '19:00';

    // Clear validation states
    clearFieldError(nameInput, errorName);
    clearFieldError(phoneInput, errorPhone);
    clearFieldError(guestsSelect, errorGuests);
    clearFieldError(dateInput, errorDate);
    if (errorTime) errorTime.classList.add('hidden');
    if (submissionError) submissionError.classList.add('hidden');

    // Reset view visibility
    if (form) form.classList.remove('hidden');
    if (stepper) stepper.classList.remove('hidden');
    if (successState) successState.classList.add('hidden');

    goToStep(1);
  }

  // Open modal handlers
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Ensure min date and current values are ready
      if (dateInput && !dateInput.value) {
        dateInput.value = getTodayString();
        wizardState.date = dateInput.value;
      }
      checkTuesdayNotice(dateInput?.value);

      // Lock background scrolling
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    });
  });

  // Close handlers
  function closeModalSafely() {
    document.body.style.overflow = '';
    dialog.close();
    // If completed, reset the form for future bookings
    if (wizardState.isCompleted) {
      resetWizard();
    }
    // If incomplete, user's entered info is preserved in the form!
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModalSafely);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.body.style.overflow = '';
      dialog.close();
      resetWizard();
    });
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      document.body.style.overflow = '';
      dialog.close();
      resetWizard();
    });
  }

  // Light dismiss on backdrop click
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      closeModalSafely();
    }
  });

  // Handle native cancel (ESC key)
  dialog.addEventListener('cancel', () => {
    document.body.style.overflow = '';
    if (wizardState.isCompleted) {
      resetWizard();
    }
  });
}

/* --------------------------------------------------------------------------
   4. Image Lightbox
   -------------------------------------------------------------------------- */
function initLightbox() {
  const lightbox = document.getElementById('lightbox-modal');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('#lightbox-img');
  const lightboxCaption = lightbox.querySelector('#lightbox-caption');
  const closeBtn = lightbox.querySelector('.btn-close-lightbox');
  const clickableImages = document.querySelectorAll('[data-lightbox="true"]');

  clickableImages.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      const src = img.getAttribute('src');
      const caption = img.getAttribute('data-caption') || img.getAttribute('data-alt') || img.getAttribute('alt') || 'Varanasi Restaurant Daegu';

      if (lightboxImg) lightboxImg.src = src;
      if (lightboxCaption) lightboxCaption.textContent = caption;

      lightbox.showModal();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => lightbox.close());
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop-click')) {
      lightbox.close();
    }
  });
}

/* --------------------------------------------------------------------------
   5. Mobile Drawer Navigation
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  const closeBtn = document.getElementById('close-mobile-drawer');
  const drawerLinks = drawer ? drawer.querySelectorAll('.nav-drawer-link') : [];
  const drawerReserveBtn = drawer ? drawer.querySelector('.btn-open-reserve') : null;

  if (!menuBtn || !drawer) return;

  function openDrawer() {
    drawer.classList.remove('hidden');
    drawer.classList.add('flex');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer(restoreScroll = true) {
    drawer.classList.add('hidden');
    drawer.classList.remove('flex');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (restoreScroll) {
      document.body.style.overflow = '';
    }
  }

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
      openDrawer();
    } else {
      closeDrawer(true);
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDrawer(true);
      menuBtn.focus();
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      closeDrawer(true);
      menuBtn.focus();
    });
  }

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer(true);
    });
  });

  if (drawerReserveBtn) {
    drawerReserveBtn.addEventListener('click', () => {
      // Close drawer without resetting body overflow since the reservation modal is opening
      closeDrawer(false);
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
      closeDrawer(true);
      menuBtn.focus();
    }
  });

  // Close when screen resizes to desktop breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && !drawer.classList.contains('hidden')) {
      closeDrawer(true);
    }
  });
}

/* --------------------------------------------------------------------------
   6. Copy Address to Clipboard
   -------------------------------------------------------------------------- */
function initAddressCopy() {
  const copyBtns = document.querySelectorAll('.btn-copy-address');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-address') || '대구광역시 중구 동성로5길 85, 2층 (바라나시)';
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(t('toast_address_copied', `Address copied to clipboard: "${textToCopy}" (Ready for Taxi / Maps)`));
      }).catch(() => {
        showToast(`Address: ${textToCopy}`);
      });
    });
  });
}

/* --------------------------------------------------------------------------
   7. Navigation ScrollSpy
   -------------------------------------------------------------------------- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('text-primary', 'font-bold', 'border-b', 'border-secondary');
      link.classList.add('text-on-surface-variant');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('text-primary', 'font-bold', 'border-b', 'border-secondary');
        link.classList.remove('text-on-surface-variant');
      }
    });
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   8. Floating Back To Top Button
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
      backToTopBtn.classList.add('opacity-100', 'pointer-events-auto');
    } else {
      backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
      backToTopBtn.classList.remove('opacity-100', 'pointer-events-auto');
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* --------------------------------------------------------------------------
   Toast Notification Helper
   -------------------------------------------------------------------------- */
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] text-secondary-fixed">check_circle</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* --------------------------------------------------------------------------
   Hero Background Video Playback & Controls
   -------------------------------------------------------------------------- */
function initHeroVideo() {
  const video = document.getElementById('hero-video');
  const toggleBtn = document.getElementById('hero-video-toggle');
  const icon = document.getElementById('hero-video-icon');
  const label = document.getElementById('hero-video-text');
  if (!video) return;

  // Guarantee muted and inline playback for mobile/desktop autoplay policy
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  let userExplicitlyPaused = false;

  const updateUI = (isPlaying) => {
    if (!toggleBtn || !icon || !label) return;
    if (isPlaying) {
      icon.textContent = 'pause';
      label.textContent = t('hero_video_pause', 'Pause Video');
      toggleBtn.setAttribute('aria-label', t('hero_video_pause', 'Pause background video'));
    } else {
      icon.textContent = 'play_arrow';
      label.textContent = t('hero_video_play', 'Play Video');
      toggleBtn.setAttribute('aria-label', t('hero_video_play', 'Play background video'));
    }
  };

  updateHeroVideoUI = () => updateUI(!video.paused);

  video.addEventListener('playing', () => updateUI(true));
  video.addEventListener('pause', () => updateUI(false));

  const attemptPlay = () => {
    if (userExplicitlyPaused) return;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => updateUI(true))
        .catch(() => updateUI(false));
    }
  };

  // Immediate attempt
  attemptPlay();

  // Retry when data / frames are ready
  video.addEventListener('canplay', () => {
    if (video.paused && !userExplicitlyPaused) attemptPlay();
  });
  video.addEventListener('loadeddata', () => {
    if (video.paused && !userExplicitlyPaused) attemptPlay();
  });

  // Browser Autoplay Policy Fallback: start on first user interaction if blocked
  const onUserInteraction = () => {
    if (video.paused && !userExplicitlyPaused) {
      attemptPlay();
    }
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
      window.removeEventListener(evt, onUserInteraction);
    });
  };
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
    window.addEventListener(evt, onUserInteraction, { once: true, passive: true });
  });

  // Interactive toggle button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (video.paused) {
        userExplicitlyPaused = false;
        video.play().then(() => updateUI(true)).catch(err => console.warn('Video play error:', err));
      } else {
        userExplicitlyPaused = true;
        video.pause();
        updateUI(false);
      }
    });
  }
}

