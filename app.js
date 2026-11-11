/**
 * HAMIDOH GAMING - Main Interactive Application Logic
 * Audio synthesizer, theme manager, filters, modals, and event handling.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Web Audio API - Retro Sound FX Engine
  // ==========================================
  let audioCtx = null;
  let sfxEnabled = localStorage.getItem('hamidoh_sfx') !== 'false'; // default true

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play synthesized tone
  function playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (!sfxEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Sound FX Library
  window.GameAudio = {
    click: () => playTone(600, 'triangle', 0.08, 0.1),
    hover: () => playTone(800, 'sine', 0.04, 0.03),
    jump: () => {
      if (!sfxEnabled) return;
      try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    },
    coin: () => {
      if (!sfxEnabled) return;
      playTone(987.77, 'sine', 0.08, 0.15); // B5
      setTimeout(() => playTone(1318.51, 'sine', 0.15, 0.15), 60); // E6
    },
    hit: () => {
      if (!sfxEnabled) return;
      try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {}
    },
    powerup: () => {
      [440, 554, 659, 880].forEach((f, i) => {
        setTimeout(() => playTone(f, 'triangle', 0.1, 0.12), i * 50);
      });
    }
  };

  // Sound FX UI Toggle
  const sfxBtn = document.getElementById('sfxToggle');
  function updateSfxButtonUI() {
    if (sfxBtn) {
      sfxBtn.innerHTML = sfxEnabled 
        ? '<i class="fa-solid fa-volume-high"></i>' 
        : '<i class="fa-solid fa-volume-xmark" style="color:var(--neon-secondary);"></i>';
      sfxBtn.title = sfxEnabled ? "Sound FX: ON (Click to Mute)" : "Sound FX: MUTED (Click to Enable)";
    }
  }
  updateSfxButtonUI();

  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      localStorage.setItem('hamidoh_sfx', sfxEnabled);
      updateSfxButtonUI();
      if (sfxEnabled) {
        initAudio();
        window.GameAudio.coin();
      }
    });
  }

  // Global Button Click Sound FX
  document.querySelectorAll('button, .btn-primary, .btn-secondary, .btn-ghost, .nav-item').forEach(el => {
    el.addEventListener('click', () => window.GameAudio.click());
    el.addEventListener('mouseenter', () => window.GameAudio.hover());
  });


  // ==========================================
  // 2. RGB Theme Switcher
  // ==========================================
  const themeMenuBtn = document.getElementById('themeMenuBtn');
  const themeDropdown = document.getElementById('themeDropdown');
  const themeOptions = document.querySelectorAll('.theme-option');

  // Load Saved Theme
  const savedTheme = localStorage.getItem('hamidoh_theme') || 'cyberpunk';
  setTheme(savedTheme);

  if (themeMenuBtn && themeDropdown) {
    themeMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      themeDropdown.classList.remove('show');
    });
  }

  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const selected = opt.getAttribute('data-set-theme');
      setTheme(selected);
      window.GameAudio.powerup();
    });
  });

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hamidoh_theme', theme);
    themeOptions.forEach(opt => {
      if (opt.getAttribute('data-set-theme') === theme) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }


  // ==========================================
  // 3. Mobile Navigation Menu Toggle
  // ==========================================
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isOpen = navLinks.classList.contains('active');
      mobileToggle.innerHTML = isOpen 
        ? '<i class="fa-solid fa-xmark"></i>' 
        : '<i class="fa-solid fa-bars"></i>';
    });

    // Close when link clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });
  }


  // ==========================================
  // 4. Game Vault Category Filtering
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const gameCards = document.querySelectorAll('.game-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      gameCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || filter === cat) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease-in-out';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });


  // ==========================================
  // 5. Highlight Clip Modal
  // ==========================================
  const clipModal = document.getElementById('clipModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');

  document.querySelectorAll('.btn-clip').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-title') || "Game Highlight";
      const desc = btn.getAttribute('data-desc') || "Insane play captured during live broadcast.";

      if (modalTitle) modalTitle.textContent = title;
      if (modalDesc) modalDesc.textContent = desc;

      if (clipModal) {
        clipModal.classList.add('active');
        window.GameAudio.powerup();
      }
    });
  });

  if (closeModalBtn && clipModal) {
    closeModalBtn.addEventListener('click', () => {
      clipModal.classList.remove('active');
    });

    clipModal.addEventListener('click', (e) => {
      if (e.target === clipModal) {
        clipModal.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && clipModal.classList.contains('active')) {
        clipModal.classList.remove('active');
      }
    });
  }


  // ==========================================
  // 6. Interactive Live Status Badge
  // ==========================================
  const statusPill = document.querySelector('.status-pill');
  const statusText = document.getElementById('streamStatusText');
  let isLive = true;

  if (statusPill && statusText) {
    statusPill.style.cursor = 'pointer';
    statusPill.title = "Click to toggle live status indicator";

    statusPill.addEventListener('click', () => {
      isLive = !isLive;
      if (isLive) {
        statusText.textContent = "SYSTEM ACTIVE • BROADCASTING IN 1440P";
        statusPill.style.color = "var(--neon-primary)";
      } else {
        statusText.textContent = "OFFLINE • EDITING NEW VOD & HIGHLIGHTS";
        statusPill.style.color = "var(--text-muted)";
      }
      window.GameAudio.click();
    });
  }
});
