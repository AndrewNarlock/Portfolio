// Site navigation ---------------------------------------------------------------
// Accessible disclosure menus: buttons expose aria-expanded, Escape closes,
// and clicking outside closes any open menu.

(function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const links = document.getElementById('nav-links');
    const dropdownToggle = document.querySelector('.dropdown-toggle');

    const setOpen = (button, open) => {
        if (!button) return;
        button.setAttribute('aria-expanded', String(open));
    };

    // Small-screen hamburger menu
    if (menuToggle && links) {
        menuToggle.addEventListener('click', () => {
            const open = menuToggle.getAttribute('aria-expanded') !== 'true';
            setOpen(menuToggle, open);
            links.classList.toggle('is-open', open);
            if (!open) setOpen(dropdownToggle, false);
        });
    }

    // Following a link inside the menu (such as an in-page #anchor) closes it
    if (menuToggle && links) {
        links.addEventListener('click', (e) => {
            if (!e.target.closest('a')) return;
            setOpen(menuToggle, false);
            setOpen(dropdownToggle, false);
            links.classList.remove('is-open');
        });
    }

    // Projects dropdown
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', () => {
            const open = dropdownToggle.getAttribute('aria-expanded') !== 'true';
            setOpen(dropdownToggle, open);
        });
    }

    const closeAll = (returnFocus) => {
        if (dropdownToggle && dropdownToggle.getAttribute('aria-expanded') === 'true') {
            setOpen(dropdownToggle, false);
            if (returnFocus) dropdownToggle.focus();
            return;
        }
        if (menuToggle && menuToggle.getAttribute('aria-expanded') === 'true') {
            setOpen(menuToggle, false);
            links.classList.remove('is-open');
            if (returnFocus) menuToggle.focus();
        }
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll(true);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container')) {
            setOpen(dropdownToggle, false);
            if (menuToggle && links) {
                setOpen(menuToggle, false);
                links.classList.remove('is-open');
            }
        }
    });
})();
