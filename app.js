(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  // Custom cursor: a dot that tracks the pointer exactly, and a ring
  // that trails behind it and expands over anything clickable.
  const initCursor = () => {
    if (isTouchDevice) return;

    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    const dot = cursor.querySelector('.cursor-dot');

    let pointerX = 0;
    let pointerY = 0;
    let ringX = 0;
    let ringY = 0;
    let hasMoved = false;

    window.addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      dot.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;

      if (!hasMoved) {
        hasMoved = true;
        cursor.classList.add('on');
        ringX = pointerX;
        ringY = pointerY;
      }
    }, { passive: true });

    const trackRing = () => {
      ringX += (pointerX - ringX) * 0.22;
      ringY += (pointerY - ringY) * 0.22;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(trackRing);
    };
    requestAnimationFrame(trackRing);

    const hoverTargets = 'a, button, .g-item, .entry, .honor-row, [role="button"]';
    document.addEventListener('mouseover', (event) => {
      if (event.target.closest(hoverTargets)) ring.classList.add('active');
    });
    document.addEventListener('mouseout', (event) => {
      if (event.target.closest(hoverTargets)) ring.classList.remove('active');
    });
  };

  // Header picks up a hairline and a soft blur once the page scrolls.
  const initHeader = () => {
    const header = document.getElementById('header');
    const updateHeader = () => header.classList.toggle('solid', window.scrollY > 40);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  };

  // Sections fade up once when they enter the viewport.
  const initReveal = () => {
    const revealEls = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(el);
    });
  };

  // The hero visual: a slowly rotating node graph over a quiet star field,
  // with a soft lens aperture, drifting bokeh, and a scan-line sweep.
  const initNodeGraph = () => {
    const canvas = document.getElementById('nodeCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let time = 0;
    let rotation = 0;
    let apertureRotation = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = width / 2;
      centerY = height / 2;
    };

    const ringConfig = [
      { radiusFactor: 0, count: 1 },
      { radiusFactor: 0.16, count: 5 },
      { radiusFactor: 0.30, count: 8 },
      { radiusFactor: 0.42, count: 4 },
    ];

    let nodes = [];
    const buildNodes = () => {
      nodes = [];
      ringConfig.forEach((ring, ringIndex) => {
        for (let i = 0; i < ring.count; i += 1) {
          const angle = (i / ring.count) * Math.PI * 2 + ringIndex * 0.4;
          nodes.push({
            ring: ringIndex,
            angle,
            radius: width * ring.radiusFactor,
            size: ringIndex === 0 ? 6.5 : ringIndex === 1 ? 3 : 2,
            bright: ringIndex <= 1 || Math.random() > 0.55,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 0.8,
            driftPhase: Math.random() * Math.PI * 2,
          });
        }
      });
    };

    let edges = [];
    const buildEdges = () => {
      edges = [];
      const byRing = { 0: [], 1: [], 2: [], 3: [] };
      nodes.forEach((node, index) => byRing[node.ring].push(index));

      byRing[1].forEach((i) => edges.push([byRing[0][0], i]));
      byRing[1].forEach((i, k) => {
        edges.push([i, byRing[2][k % byRing[2].length]]);
        edges.push([i, byRing[2][(k + 3) % byRing[2].length]]);
      });
      byRing[2].forEach((i, k) => {
        if (k % 2 === 0) edges.push([i, byRing[3][k % byRing[3].length]]);
      });
    };

    // Original positions were authored against a 520x520 canvas, hand
    // placed so the phrases never collide or run off the edge. Storing
    // them as fractions keeps that exact layout at any canvas size.
    // These labels are deliberately NOT attached to the rotating node
    // graph below · a fixed layout is what keeps long phrases legible.
    const snippets = [
      { text: 'Human-Computer Interaction', xFraction: 28 / 520, yFraction: 140 / 520, targetAlpha: 0.35 },
      { text: 'Full-Stack Software Engineering', xFraction: 292 / 520, yFraction: 108 / 520, targetAlpha: 0.28 },
      { text: 'AI-Mediated Collaboration', xFraction: 110 / 520, yFraction: 420 / 520, targetAlpha: 0.25 },
      { text: 'Multimodal Systems', xFraction: 350 / 520, yFraction: 400 / 520, targetAlpha: 0.30 },
      { text: 'Universal Design', xFraction: 210 / 520, yFraction: 52 / 520, targetAlpha: 0.22 },
      { text: 'AI & LLMs', xFraction: 360 / 520, yFraction: 260 / 520, targetAlpha: 0.28 },
      { text: 'Computational NLP', xFraction: 60 / 520, yFraction: 298 / 520, targetAlpha: 0.26 },
    ];

    let bokeh = [];
    const buildBokeh = () => {
      bokeh = Array.from({ length: 16 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 3 + Math.random() * 10,
        alpha: 0.02 + Math.random() * 0.05,
        speed: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const nodePosition = (node) => {
      const angle = node.angle + rotation;
      const driftX = Math.sin(time * 0.4 + node.driftPhase) * width * 0.006;
      const driftY = Math.cos(time * 0.32 + node.driftPhase) * width * 0.006;
      return {
        x: centerX + node.radius * Math.cos(angle) + driftX,
        y: centerY + node.radius * Math.sin(angle) * 0.94 + driftY,
      };
    };

    const drawDepthRings = () => {
      [0.44, 0.30, 0.16].forEach((factor) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * factor, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.045)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    const drawAperture = () => {
      const bladeCount = 8;
      const radius = width * 0.47;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(apertureRotation);
      for (let i = 0; i < bladeCount; i += 1) {
        const a = (i / bladeCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, a, a + ((Math.PI * 2) / bladeCount) * 0.32);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();
      }
      ctx.restore();
    };

    const drawEdges = () => {
      edges.forEach(([a, b]) => {
        const start = nodePosition(nodes[a]);
        const end = nodePosition(nodes[b]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      });
    };

    const drawNodes = () => {
      nodes.forEach((node) => {
        const point = nodePosition(node);
        const pulse = prefersReducedMotion.matches
          ? 1
          : 0.6 + 0.4 * Math.sin(time * node.speed + node.phase);
        const alpha = (node.ring === 0 ? 0.95 : node.bright ? 0.5 : 0.22) * pulse;

        if (node.ring <= 1) {
          const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, node.size * 5);
          glow.addColorStop(0, 'rgba(255,255,255,0.18)');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(point.x, point.y, node.size * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,232,232,${alpha})`;
        ctx.fill();

        if (node.ring === 0) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, node.size + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    };

    const drawSnippets = () => {
      const fontSize = Math.max(5, Math.min(11, width * 0.0212));
      ctx.font = `400 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'left';

      snippets.forEach((snippet, i) => {
        const x = snippet.xFraction * width;
        const y = snippet.yFraction * height;
        const pulse = prefersReducedMotion.matches
          ? 1
          : 0.7 + 0.3 * Math.sin(time * 0.18 + i * 2.1);
        const alpha = snippet.targetAlpha * pulse;

        // A small star that belongs only to this label, sitting just
        // left of where the text starts, with a short tick between them.
        const starX = x - 9;
        const starY = y - 4;

        ctx.beginPath();
        ctx.arc(starX, starY, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,232,232,${Math.min(0.85, alpha + 0.35)})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.4})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(starX + 3, starY);
        ctx.lineTo(x - 2, y - 3);
        ctx.stroke();

        ctx.fillStyle = `rgba(232,232,232,${alpha})`;
        ctx.fillText(snippet.text, x, y);
      });
    };

    const drawFlare = () => {
      const fx = centerX + width * 0.13;
      const fy = centerY - height * 0.13;
      const flicker = prefersReducedMotion.matches ? 0.5 : 0.35 + 0.25 * Math.sin(time * 0.7);
      ctx.beginPath();
      ctx.arc(fx, fy, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${flicker})`;
      ctx.fill();
    };

    const drawBokeh = () => {
      bokeh.forEach((particle) => {
        const alpha = particle.alpha * (prefersReducedMotion.matches
          ? 1
          : 0.6 + 0.4 * Math.sin(time * particle.speed + particle.phase));
        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.r);
        glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawScanline = () => {
      if (prefersReducedMotion.matches) return;
      const sweepY = ((time * 34) % (height + 60)) - 30;
      const band = ctx.createLinearGradient(0, sweepY, 0, sweepY + 2);
      band.addColorStop(0, 'transparent');
      band.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      band.addColorStop(1, 'transparent');
      ctx.fillStyle = band;
      ctx.fillRect(0, sweepY, width, 2);
    };

    const drawStarfield = () => {
      let seed = 42;
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      for (let i = 0; i < 44; i += 1) {
        const sx = random() * width;
        const sy = random() * height;
        const distance = Math.hypot(sx - centerX, sy - centerY);
        if (distance < width * 0.46) continue;
        const twinkle = prefersReducedMotion.matches
          ? 0.5
          : 0.3 + 0.3 * Math.sin(time * (0.5 + random()) + i);
        ctx.fillStyle = `rgba(255,255,255,${0.14 + twinkle * 0.16})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      drawBokeh();
      drawDepthRings();
      drawAperture();
      drawEdges();
      drawNodes();
      drawSnippets();
      drawFlare();
      drawStarfield();
      drawScanline();
    };

    let animationFrame = null;
    let isVisible = true;

    const tick = () => {
      time += 0.016;
      if (!prefersReducedMotion.matches) {
        rotation += 0.0016;
        apertureRotation += 0.003;
      }
      draw();
      animationFrame = isVisible ? requestAnimationFrame(tick) : null;
    };

    resize();
    buildNodes();
    buildEdges();
    buildBokeh();
    draw();

    window.addEventListener('resize', () => {
      resize();
      buildNodes();
      buildEdges();
      buildBokeh();
      draw();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !animationFrame) animationFrame = requestAnimationFrame(tick);
      }, { threshold: 0 }).observe(canvas);
    } else {
      animationFrame = requestAnimationFrame(tick);
    }
  };

  // Photo lightbox: click or Enter/Space opens it, arrow keys move
  // between frames, Escape or clicking the backdrop closes it.
  const initLightbox = () => {
    const figures = Array.from(document.querySelectorAll('.g-item'));
    const lightbox = document.getElementById('lb');
    if (!lightbox || !figures.length) return;

    const lbImage = document.getElementById('lbImg');
    const lbTitle = document.getElementById('lbTtl');
    const lbExif = document.getElementById('lbExif');

    let isOpen = false;
    let currentIndex = 0;
    let lastFocused = null;

    const show = (index) => {
      currentIndex = (index + figures.length) % figures.length;
      const figure = figures[currentIndex];
      const img = figure.querySelector('img');
      lbImage.src = img.getAttribute('src');
      lbImage.alt = img.getAttribute('alt') || '';
      lbTitle.textContent = figure.querySelector('.t-caption').textContent;
      lbExif.textContent = figure.querySelector('.g-cap .t-meta').textContent;
    };

    const open = (index) => {
      lastFocused = document.activeElement;
      show(index);
      isOpen = true;
      lightbox.classList.add('on');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => lightbox.classList.add('vis'));
      document.getElementById('lbX').focus();
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      lightbox.classList.remove('vis');
      document.body.style.overflow = '';
      setTimeout(() => {
        lightbox.classList.remove('on');
        lbImage.removeAttribute('src');
      }, 260);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    figures.forEach((figure, index) => {
      figure.addEventListener('click', () => open(index));
      figure.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(index);
        }
      });
    });

    lightbox.addEventListener('click', close);
    [lbImage, lightbox.querySelector('.lb-cap')].forEach((el) => {
      el.addEventListener('click', (event) => event.stopPropagation());
    });
    document.getElementById('lbX').addEventListener('click', (event) => { event.stopPropagation(); close(); });
    document.getElementById('lbP').addEventListener('click', (event) => { event.stopPropagation(); show(currentIndex - 1); });
    document.getElementById('lbN').addEventListener('click', (event) => { event.stopPropagation(); show(currentIndex + 1); });

    window.addEventListener('keydown', (event) => {
      if (!isOpen) return;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft') show(currentIndex - 1);
      else if (event.key === 'ArrowRight') show(currentIndex + 1);
    });
  };

  initCursor();
  initHeader();
  initReveal();
  initNodeGraph();
  initLightbox();
})();