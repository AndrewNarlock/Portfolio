// Home page effects ------------------------------------------------------------
// Decodes the hero name, types the rotating "I build ..." line, reveals sections
// as they scroll into view and tilts project cards toward the pointer. All of it
// is decoration: with JavaScript off or reduced motion on, the page reads the same.

(function () {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺﾊﾋﾌﾍﾎ0123456789ABCDEFXZ#$%&*+<>';
    const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    // Turns on the hidden starting state for .reveal elements (see home.css).
    document.documentElement.classList.add('js');

    // ----- Reveal on scroll -----
    const revealed = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealed.forEach((el) => observer.observe(el));
    } else {
        revealed.forEach((el) => el.classList.add('is-visible'));
    }

    if (reduceMotion) return;

    // ----- Hero name: random glyphs resolve into the real letters -----
    // Each letter keeps its real character so the layout never shifts; CSS
    // draws the random glyph from data-glyph over the top of it.
    const title = document.querySelector('.hero-title');
    if (title) {
        const text = title.textContent.trim();
        title.setAttribute('aria-label', text);
        title.textContent = '';

        const cells = [];
        text.split(' ').forEach((word, i) => {
            if (i) title.append(' ');
            const wordSpan = document.createElement('span');
            wordSpan.setAttribute('aria-hidden', 'true');
            Array.from(word).forEach((ch) => {
                const cell = document.createElement('span');
                cell.className = 'decode-char';
                cell.textContent = ch;
                cell.dataset.glyph = randomGlyph();
                wordSpan.append(cell);
                cells.push(cell);
            });
            title.append(wordSpan);
        });

        // Letters settle left to right, starting as the title fades in (1s).
        const START = 1000;
        const settleAt = cells.map((_, i) => START + 250 + i * 55 + Math.random() * 250);
        const begin = performance.now();
        let lastSwap = 0;

        const tick = (now) => {
            const t = now - begin;
            const swap = now - lastSwap > 55;
            if (swap) lastSwap = now;

            let pending = 0;
            cells.forEach((cell, i) => {
                if (!cell.dataset.glyph) return;
                if (t >= settleAt[i]) {
                    delete cell.dataset.glyph;
                } else {
                    pending++;
                    if (swap) cell.dataset.glyph = randomGlyph();
                }
            });

            if (pending) {
                requestAnimationFrame(tick);
            } else {
                title.textContent = text;
                title.removeAttribute('aria-label');
            }
        };
        requestAnimationFrame(tick);
    }

    // ----- "I build ___": type and delete each phrase in turn -----
    const typed = document.querySelector('.hero-typed');
    if (typed && typed.dataset.words) {
        const words = typed.dataset.words.split('|');
        let word = 0;
        let length = words[0].length;
        let deleting = false;

        const step = () => {
            const current = words[word];
            if (!deleting && length === current.length) {
                deleting = true;
                setTimeout(step, 2200);
                return;
            }
            if (deleting && length === 0) {
                deleting = false;
                word = (word + 1) % words.length;
                setTimeout(step, 350);
                return;
            }
            length += deleting ? -1 : 1;
            typed.textContent = words[word].slice(0, length);
            setTimeout(step, deleting ? 35 : 70);
        };
        setTimeout(step, 3000);
    }

    // ----- Project cards tilt in 3D toward the pointer -----
    if (finePointer) {
        document.querySelectorAll('.card').forEach((card) => {
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.setProperty('--tilt-x', `${(-y * 8).toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${(x * 10).toFixed(2)}deg`);
                card.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(1)}%`);
                card.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(1)}%`);
            });
            card.addEventListener('pointerleave', () => {
                ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y'].forEach((prop) => {
                    card.style.removeProperty(prop);
                });
            });
        });
    }
})();
