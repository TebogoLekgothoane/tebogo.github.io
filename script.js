(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Intro overlay (short greeting, then reveal site)
  const intro = document.getElementById("intro");
  const introSkip = intro?.querySelector(".intro-skip");
  const introHello = intro?.querySelector(".intro-hello");

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finishIntro = (shouldScrollToHash) => {
    document.body.classList.remove("is-intro");
    if (intro instanceof HTMLElement) {
      intro.classList.add("is-leaving");
      // remove after fade
      window.setTimeout(() => intro.remove(), prefersReducedMotion ? 0 : 2600);
    }

    if (shouldScrollToHash && window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    }
  };

  if (intro instanceof HTMLElement) {
    // Typewriter effect (note: browsers clamp 1ms timers; this is as fast as allowed)
    const fullText =
      (introHello instanceof HTMLElement && introHello.dataset.text) || "Hello, I'm Tebogo.";

    if (introHello instanceof HTMLElement) introHello.textContent = "";

    // Slow, readable typing speed
    const speedMs = 65;
    let i = 0;

    const typeNext = () => {
      if (!(introHello instanceof HTMLElement)) return;
      if (i >= fullText.length) {
        // Done typing — add animated purple emoji
        const sparkle = document.createElement("span");
        sparkle.className = "intro-sparkle";
        sparkle.textContent = " 💜";
        sparkle.setAttribute("aria-hidden", "true");
        introHello.appendChild(sparkle);
        
        // After sparkle appears, ALWAYS wait exactly 1.8 seconds then slowly fade out to site
        window.setTimeout(() => {
          const shouldScrollToHash = Boolean(window.location.hash);
          finishIntro(shouldScrollToHash);
        }, 1800); // Exactly 1.8 seconds pause to see sparkle, then fade
        return;
      }
      introHello.textContent = fullText.slice(0, i + 1);
      i += 1;
      window.setTimeout(typeNext, speedMs);
    };

    // Always type (even if reduced motion is enabled); reduced motion only affects fades/scrolling.
    requestAnimationFrame(typeNext);

    const exitNow = () => {
      const shouldScrollToHash = Boolean(window.location.hash);
      finishIntro(shouldScrollToHash);
    };

    if (introSkip instanceof HTMLElement) {
      introSkip.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        exitNow();
      });
      // Put focus on Enter button for keyboard users
      window.setTimeout(() => introSkip.focus(), 0);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") exitNow();
    });

  } else {
    document.body.classList.remove("is-intro");
  }

  // Scroll reveal animations
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!(entry.target instanceof HTMLElement)) return;
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    revealEls.forEach((el, i) => {
      if (!(el instanceof HTMLElement)) return;
      // Stagger: only for cards/panels (avoid delaying entire sections too much)
      const isStaggered = el.classList.contains("panel") || el.classList.contains("project-card");
      if (isStaggered) el.style.transitionDelay = `${Math.min(i * 55, 320)}ms`;
      io.observe(el);
    });
  } else {
    // Fallback: just show everything
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Mobile nav
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");

  const closeNav = () => {
    if (!navToggle || !navLinks) return;
    navToggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Close after clicking a link
    navLinks.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.matches("a.nav-link")) closeNav();
    });

    // Close on Escape or outside click
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      const withinNav = navLinks.contains(t) || navToggle.contains(t);
      if (!withinNav) closeNav();
    });
  }

  // Hackathon wins section: hidden by default, reveal on demand
  const hackathonSection = document.getElementById("hackathonwins");

  const showHackathonWins = (shouldScroll) => {
    if (!(hackathonSection instanceof HTMLElement)) return;

    const wasHidden = hackathonSection.hasAttribute("hidden");
    hackathonSection.removeAttribute("hidden");

    // Ensure reveal animations don't get stuck when shown later
    if (wasHidden) {
      requestAnimationFrame(() => {
        hackathonSection
          .querySelectorAll("[data-reveal]")
          .forEach((el) => el.classList.add("is-visible"));
      });
    }

    if (shouldScroll) {
      hackathonSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Reveal Hackathon Wins ONLY from the Featured Projects button
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const a = t.closest("[data-show-hackathonwins]");
    if (!a) return;

    e.preventDefault();
    showHackathonWins(true);
    history.pushState(null, "", "#hackathonwins");
    closeNav();
  });

  // Expandable achievement cards
  const expandableCards = document.querySelectorAll("[data-expandable]");
  expandableCards.forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    
    const toggle = card.querySelector(".expand-toggle");
    if (!toggle) return;

    // Click toggle button
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleCard(card, toggle);
    });

    // Click anywhere on card (except carousel controls)
    card.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      
      // Don't toggle if clicking carousel controls or buttons
      if (
        target.closest(".carousel-btn") ||
        target.closest(".carousel-dots") ||
        target.matches("video") ||
        target.matches("img")
      ) {
        return;
      }
      
      toggleCard(card, toggle);
    });
  });

  function toggleCard(card, toggle) {
    const isExpanded = card.classList.toggle("is-expanded");
    toggle.setAttribute("aria-expanded", String(isExpanded));
    
    // Update aria-label
    toggle.setAttribute(
      "aria-label",
      isExpanded ? "Collapse details" : "Expand details"
    );
  }

  // Experience roadmap (paper drop-down)
  const experience = document.querySelector("[data-experience]");
  if (experience instanceof HTMLElement) {
    const items = Array.from(experience.querySelectorAll("[data-xp-item]")).filter(
      (el) => el instanceof HTMLElement
    );

    const setActive = (active) => {
      items.forEach((it) => it.classList.toggle("is-active", it === active));
    };

    const setExpanded = (expanded) => {
      experience.classList.toggle("is-expanded", expanded);
      experience.classList.toggle("is-collapsed", !expanded);
      // Update aria-expanded on all nodes
      items.forEach((it) => {
        const node = it.querySelector(".xp-node");
        if (node instanceof HTMLElement) node.setAttribute("aria-expanded", String(expanded));
      });
    };

    // Ensure initial state
    const initial = items.find((it) => it.classList.contains("is-active")) || items[0];
    if (initial) setActive(initial);
    setExpanded(false);

    items.forEach((it) => {
      const node = it.querySelector(".xp-node");
      if (!(node instanceof HTMLElement)) return;

      node.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isCollapsed = experience.classList.contains("is-collapsed");
        if (isCollapsed) {
          // Move active item to right and show all items
          setExpanded(true);
          // Ensure active item stays active
          if (!it.classList.contains("is-active")) {
            setActive(it);
          }
          return;
        }

        // If expanded: focus this item, then fold back to single centered item
        setActive(it);
        setExpanded(false);
        // Scroll to keep the section in view
        experience.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    });
  }

  // Carousels (auto-playing slideshows)
  const carousels = document.querySelectorAll("[data-carousel]");

  carousels.forEach((carousel) => {
    if (!(carousel instanceof HTMLElement)) return;

    const track = carousel.querySelector(".carousel-track");
    const slides = carousel.querySelectorAll(".carousel-slide");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dots = carousel.querySelector(".carousel-dots");

    if (!(track instanceof HTMLElement) || slides.length === 0 || !(dots instanceof HTMLElement)) return;

    let index = 0;
    // Will be assigned once autoplay setup is created
    let restartAutoplay = () => {};

    const wrapIndex = (n) => {
      const len = slides.length;
      return ((n % len) + len) % len;
    };

    const setIndex = (nextIndex) => {
      index = wrapIndex(nextIndex);
      track.style.transform = `translateX(${-index * 100}%)`;

      dots.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        if (!(dot instanceof HTMLElement)) return;
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
        dot.setAttribute("tabindex", i === index ? "0" : "-1");
      });

      // Pause any videos on non-active slides
      slides.forEach((slide, i) => {
        if (!(slide instanceof HTMLElement)) return;
        if (i === index) return;
        slide.querySelectorAll("video").forEach((v) => {
          if (v instanceof HTMLVideoElement) {
            try {
              v.pause();
            } catch {
              // ignore
            }
          }
        });
      });
    };

    // Build dots
    dots.innerHTML = "";
    slides.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "carousel-dot";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `Slide ${i + 1}`);
      btn.addEventListener("click", () => {
        setIndex(i);
        restartAutoplay();
      });
      dots.appendChild(btn);
    });

    if (prev instanceof HTMLElement)
      prev.addEventListener("click", () => {
        setIndex(index - 1);
        restartAutoplay();
      });
    if (next instanceof HTMLElement)
      next.addEventListener("click", () => {
        setIndex(index + 1);
        restartAutoplay();
      });

    // Keyboard support when focused inside carousel
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        setIndex(index - 1);
        restartAutoplay();
      }
      if (e.key === "ArrowRight") {
        setIndex(index + 1);
        restartAutoplay();
      }
    });

    setIndex(0);

    // Autoplay slideshow (paused on hover/focus; pauses while a video plays)
    const autoplayEnabled = !prefersReducedMotion;
    const intervalMs = carousel.classList.contains("cert-carousel") ? 5200 : 4200;
    let timer = 0;

    const stopAutoplay = () => {
      if (timer) window.clearInterval(timer);
      timer = 0;
    };

    const isActiveSlideVideoPlaying = () => {
      const active = slides[index];
      if (!(active instanceof HTMLElement)) return false;
      const v = active.querySelector("video");
      return v instanceof HTMLVideoElement && !v.paused && !v.ended;
    };

    const startAutoplay = () => {
      if (!autoplayEnabled) return;
      stopAutoplay();
      timer = window.setInterval(() => {
        if (isActiveSlideVideoPlaying()) return;
        setIndex(index + 1);
      }, intervalMs);
    };

    restartAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    // If the carousel contains videos, stop autoplay while playing
    carousel.querySelectorAll("video").forEach((v) => {
      if (!(v instanceof HTMLVideoElement)) return;
      v.addEventListener("play", stopAutoplay);
      v.addEventListener("pause", startAutoplay);
      v.addEventListener("ended", startAutoplay);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    startAutoplay();
  });

  // Contact form → opens mailto with prefilled content (no backend required)
  const form = document.getElementById("contact-form");
  const hint = document.getElementById("form-hint");
  const mailto = "tebogolekgothoane5@gmail.com";

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const message = String(fd.get("message") || "").trim();

      if (!name || !email || !message) {
        if (hint) hint.textContent = "Please fill in all fields.";
        return;
      }

      const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}\n`);
      const href = `mailto:${mailto}?subject=${subject}&body=${body}`;

      if (hint) hint.textContent = "Opening your email app…";
      window.location.href = href;
    });
  }

  // ========== Animated particle background (optimized) ==========
  const canvas = document.getElementById("particles-canvas");
  if (canvas instanceof HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      "rgba(147, 51, 234, 0.7)",
      "rgba(168, 85, 247, 0.6)",
      "rgba(192, 132, 252, 0.5)",
      "rgba(216, 180, 254, 0.4)",
      "rgba(255, 255, 255, 0.8)",
    ];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 2 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.color = COLORS[(Math.random() * COLORS.length) | 0];
        this.mass = this.radius;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x - this.radius < 0 || this.x + this.radius > width) {
          this.vx = -this.vx;
          this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > height) {
          this.vy = -this.vy;
          this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        if (this.radius > 1.5) {
          const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
          g.addColorStop(0, this.color);
          g.addColorStop(1, "rgba(147, 51, 234, 0)");
          ctx.fillStyle = g;
          ctx.fill();
        }
      }
    }

    const dist2 = (ax, ay, bx, by) => {
      const dx = bx - ax;
      const dy = by - ay;
      return dx * dx + dy * dy;
    };

    const particles = [];
    const particleCount = Math.min(((width * height) / 8000) | 0, 120);
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    const resolveCollision = (p1, p2, dx, dy, distance) => {
      if (distance === 0) return;

      const nx = dx / distance;
      const ny = dy / distance;

      const dvx = p2.vx - p1.vx;
      const dvy = p2.vy - p1.vy;
      const dvn = dvx * nx + dvy * ny;
      if (dvn > 0) return;

      const impulse = (2 * dvn) / (p1.mass + p2.mass);
      p1.vx += impulse * p2.mass * nx;
      p1.vy += impulse * p2.mass * ny;
      p2.vx -= impulse * p1.mass * nx;
      p2.vy -= impulse * p1.mass * ny;

      const overlap = p1.radius + p2.radius - distance;
      const separationX = (overlap / 2) * nx;
      const separationY = (overlap / 2) * ny;
      p1.x -= separationX;
      p1.y -= separationY;
      p2.x += separationX;
      p2.y += separationY;
    };

    const CONNECT_DIST = 120;
    const CONNECT_DIST2 = CONNECT_DIST * CONNECT_DIST;

    let raf = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const r = p1.radius + p2.radius;
          const r2 = r * r;
          const d2 = dx * dx + dy * dy;

          if (d2 < r2) {
            resolveCollision(p1, p2, dx, dy, Math.sqrt(d2));
            continue;
          }

          if (d2 < CONNECT_DIST2) {
            const distance = Math.sqrt(d2);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = (1 - distance / CONNECT_DIST) * 0.15;
            ctx.strokeStyle = `rgba(147, 51, 234, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(animate);
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(animate);
    });

    animate();
  }
})();

