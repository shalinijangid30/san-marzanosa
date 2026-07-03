(function () {
  "use strict";

  /* ---------- LOGO BACKGROUND REMOVAL ---------- */
  /* The source logo file is a JPEG with a white/paper background. Key it out
     to transparent (with a feathered edge for the vignette) so the crest sits
     directly on the dark preloader / hero / footer backgrounds instead of
     showing a white box. */
  (function stripLogoBackground() {
    const logos = Array.from(document.querySelectorAll('img[src="images/logo.jpeg"]'));
    if (!logos.length) return;
    const source = logos[0];

    function process() {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = source.naturalWidth;
        canvas.height = source.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(source, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        const WHITE = 238, DARK = 190;
        for (let i = 0; i < d.length; i += 4) {
          const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
          let alpha;
          if (brightness > WHITE) alpha = 0;
          else if (brightness > DARK) alpha = (255 * (WHITE - brightness)) / (WHITE - DARK);
          else alpha = 255;
          d[i + 3] = Math.min(d[i + 3], alpha);
        }
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        logos.forEach((img) => { img.src = dataUrl; });
      } catch (e) { /* canvas tainted or unsupported — keep original image */ }
    }

    if (source.complete && source.naturalWidth) process();
    else source.addEventListener("load", process, { once: true });
  })();

  /* ---------- SPLIT-FLAP PRELOADER WORD ---------- */
  (function buildSplitFlap() {
    const el = document.getElementById("preWord");
    if (!el) return;
    const text = (el.getAttribute("aria-label") || "SAN MARZANO").toUpperCase();
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const CYCLES = 7;
    const CYCLE_MS = 70;
    const STAGGER_MS = 40;

    el.innerHTML = "";
    text.split("").forEach((ch, idx) => {
      const tile = document.createElement("span");
      tile.className = "flap" + (ch === " " ? " space" : "");
      const face = document.createElement("span");
      face.className = "flap-face";
      face.textContent = ch === " " ? " " : ch;
      tile.appendChild(face);
      el.appendChild(tile);
      if (ch === " ") return;

      const sequence = [];
      for (let i = 0; i < CYCLES - 1; i++) {
        sequence.push(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
      }
      sequence.push(ch);

      let step = 0;
      setTimeout(() => {
        const iv = setInterval(() => {
          tile.classList.add("flipping");
          const thisStep = step;
          setTimeout(() => {
            face.textContent = sequence[thisStep];
            tile.classList.remove("flipping");
          }, 90);
          step++;
          if (step >= sequence.length) clearInterval(iv);
        }, CYCLE_MS + 90);
      }, idx * STAGGER_MS);
    });
  })();

  /* ---------- PRELOADER ---------- */
  const preloader = document.getElementById("preloader");
  document.body.classList.add("no-scroll");

  window.addEventListener("load", () => {
    requestAnimationFrame(() => preloader.classList.add("show-mark"));
    setTimeout(() => {
      preloader.classList.add("hide");
      document.body.classList.remove("no-scroll");
      setTimeout(() => preloader.remove(), 1300);
    }, 2000);
  });
  // fallback in case load event already fired / is slow
  setTimeout(() => {
    if (!preloader.classList.contains("show-mark")) preloader.classList.add("show-mark");
  }, 400);
  setTimeout(() => {
    if (document.getElementById("preloader")) {
      preloader.classList.add("hide");
      document.body.classList.remove("no-scroll");
      setTimeout(() => preloader && preloader.remove(), 1300);
    }
  }, 4500);

  /* ---------- HEADER SCROLL STATE ---------- */
  const header = document.getElementById("site-header");
  const onScroll = () => header.classList.toggle("solid", window.scrollY > 60);
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- SIDE NAV THEME (per-link light/dark text vs section behind it) ----------
     The nav can straddle a dark and a light section at the same time, so each
     link probes its own vertical midpoint against the [data-theme] sections
     and flips its own color independently as the page scrolls. */
  const sideNav = document.getElementById("sideNav");
  const themedSections = Array.from(document.querySelectorAll("[data-theme]"));
  if (sideNav && themedSections.length) {
    const navLinks = Array.from(sideNav.querySelectorAll("a"));
    const themeAt = (y) => {
      for (const el of themedSections) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= y && rect.bottom >= y) return el.dataset.theme;
      }
      return "dark";
    };
    const onThemeScroll = () => {
      navLinks.forEach((link) => {
        const r = link.getBoundingClientRect();
        link.classList.toggle("on-light", themeAt(r.top + r.height / 2) === "light");
      });
    };
    document.addEventListener("scroll", onThemeScroll, { passive: true });
    window.addEventListener("resize", onThemeScroll, { passive: true });
    onThemeScroll();
  }

  /* ---------- MOBILE DRAWER ---------- */
  const drawer = document.getElementById("mobile-drawer");
  document.getElementById("hamburgerBtn").addEventListener("click", () => drawer.classList.add("open"));
  document.getElementById("closeDrawer").addEventListener("click", () => drawer.classList.remove("open"));
  drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => drawer.classList.remove("open")));

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  /* ---------- LANGUAGE / RTL ---------- */
  const langToggle = document.getElementById("langToggle");
  const getLang = () => localStorage.getItem("sm_lang") || "en";

  function applyLang(lang) {
    const dict = (window.I18N && window.I18N[lang]) || {};
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    langToggle.textContent = lang === "ar" ? "EN / عربي" : "EN / عربي";
    localStorage.setItem("sm_lang", lang);
  }

  langToggle.addEventListener("click", () => {
    const next = getLang() === "ar" ? "en" : "ar";
    applyLang(next);
  });

  applyLang(getLang());

  /* ---------- FORM SUBMISSION (Formspree-compatible) ---------- */
  function wireForm(formId, statusId, successKey, errorKey) {
    const form = document.getElementById(formId);
    const status = document.getElementById(statusId);
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dict = (window.I18N && window.I18N[getLang()]) || {};
      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        status.classList.add("visible");
        if (res.ok) {
          status.textContent = dict[successKey] || "Thank you — your request has been received.";
          form.reset();
        } else {
          status.textContent = dict[errorKey] || "Something went wrong. Please try again.";
        }
      } catch (err) {
        status.classList.add("visible");
        status.textContent = dict[errorKey] || "Something went wrong. Please try again.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  wireForm("reservationForm", "resStatus", "resSuccess", "resError");
  wireForm("eventsForm", "eventsStatus", "eventsSuccess", "eventsError");
})();
