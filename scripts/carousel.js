// Project carousel ------------------------------------------------------------
// The track is a native horizontally-scrolling list (CSS scroll-snap), so it also
// works with touch, trackpads, the keyboard and without JavaScript. This script
// just wires up the previous / next buttons and announces the visible cards.

(function () {
    const track = document.querySelector('.carousel-track');
    const prev = document.querySelector('.carousel-btn.prev');
    const next = document.querySelector('.carousel-btn.next');
    const status = document.querySelector('.carousel-status');
    if (!track || !prev || !next) return;

    const cards = Array.from(track.querySelectorAll('.card'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Distance to move: one card plus the gap between cards.
    const step = () => {
        if (cards.length < 2) return track.clientWidth;
        return cards[1].offsetLeft - cards[0].offsetLeft;
    };

    const scrollByCards = (direction) => {
        track.scrollBy({
            left: direction * step(),
            behavior: reduceMotion.matches ? 'auto' : 'smooth',
        });
    };

    // Which cards are fully visible right now?
    const visibleRange = () => {
        const view = track.getBoundingClientRect();
        const visible = cards
            .map((card, i) => ({ i, r: card.getBoundingClientRect() }))
            .filter(({ r }) => r.left >= view.left - 1 && r.right <= view.right + 1)
            .map(({ i }) => i + 1);
        return visible.length ? [visible[0], visible[visible.length - 1]] : null;
    };

    let lastAnnounced = '';
    let firstRun = true;
    const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;

        const range = visibleRange();
        if (range && status) {
            const text = range[0] === range[1]
                ? `Showing project ${range[0]} of ${cards.length}`
                : `Showing projects ${range[0]} to ${range[1]} of ${cards.length}`;
            // Don't announce on page load, only after the user moves the carousel.
            if (text !== lastAnnounced) {
                if (!firstRun) status.textContent = text;
                lastAnnounced = text;
            }
        }
        firstRun = false;
    };

    prev.addEventListener('click', () => scrollByCards(-1));
    next.addEventListener('click', () => scrollByCards(1));

    // Debounce scroll updates so screen readers are not flooded.
    let timer;
    track.addEventListener('scroll', () => {
        clearTimeout(timer);
        timer = setTimeout(update, 120);
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
})();
