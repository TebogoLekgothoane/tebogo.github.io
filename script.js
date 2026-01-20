(() => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

  // Experience roadmap: start at RCL only, click node to unfold (paper drop-down)
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
          // Unfold all items (paper drop-down)
          setExpanded(true);
          return;
        }

        // If expanded: focus this item, then fold back to single item
        setActive(it);
        setExpanded(false);
        it.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    });
  }

  // Carousels (Achievements media placeholders)
  const carousels = document.querySelectorAll("[data-carousel]");

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  carousels.forEach((carousel) => {
    if (!(carousel instanceof HTMLElement)) return;

    const track = carousel.querySelector(".carousel-track");
    const slides = carousel.querySelectorAll(".carousel-slide");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dots = carousel.querySelector(".carousel-dots");

    if (!(track instanceof HTMLElement) || slides.length === 0 || !(dots instanceof HTMLElement)) return;

    let index = 0;

    const setIndex = (nextIndex) => {
      index = clamp(nextIndex, 0, slides.length - 1);
      track.style.transform = `translateX(${-index * 100}%)`;

      dots.querySelectorAll(".carousel-dot").forEach((dot, i) => {
        if (!(dot instanceof HTMLElement)) return;
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
        dot.setAttribute("tabindex", i === index ? "0" : "-1");
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
      btn.addEventListener("click", () => setIndex(i));
      dots.appendChild(btn);
    });

    if (prev instanceof HTMLElement) prev.addEventListener("click", () => setIndex(index - 1));
    if (next instanceof HTMLElement) next.addEventListener("click", () => setIndex(index + 1));

    // Keyboard support when focused inside carousel
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") setIndex(index - 1);
      if (e.key === "ArrowRight") setIndex(index + 1);
    });

    setIndex(0);
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

