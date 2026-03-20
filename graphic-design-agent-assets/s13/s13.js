// S13 Theme JavaScript
// Motion is intentionally restrained: only the Studio13 wordmark reveals with GSAP.

(function() {
    'use strict';

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function getGsap() {
        return window.gsap || null;
    }

    function initOrangeToggle() {
        const savedShade = localStorage.getItem('s13-orange-shade') || 'default';
        if (savedShade === 'alt') {
            document.body.classList.add('orange-alt');
        }

        const toggleBtn = document.getElementById('orangeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                document.body.classList.toggle('orange-alt');
                const newShade = document.body.classList.contains('orange-alt') ? 'alt' : 'default';
                localStorage.setItem('s13-orange-shade', newShade);
            });
        }
    }

    function buildWordmark(wordmark) {
        const text = wordmark.getAttribute('data-wordmark') || wordmark.textContent.trim();
        const characters = Array.from(text);

        wordmark.textContent = '';

        characters.forEach(function(character, index) {
            const span = document.createElement('span');
            span.className = 'wordmark-char';
            span.setAttribute('aria-hidden', 'true');
            span.textContent = character;

            if (index === 0 || index >= characters.length - 2) {
                span.classList.add('wordmark-char-orange');
            } else {
                span.classList.add('wordmark-char-white');
            }

            if (index >= characters.length - 2) {
                span.classList.add('wordmark-char-number');
                if (index === characters.length - 2) {
                    span.classList.add('wordmark-char-number-1');
                } else {
                    span.classList.add('wordmark-char-number-3');
                }
            }

            wordmark.appendChild(span);
        });
    }

    function revealImmediately(gsap) {
        gsap.set('.hero-wordmark, .wordmark-char', {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            clearProps: 'transform,opacity,visibility'
        });
    }

    function animateWordmark(gsap, wordmark) {
        const chars = gsap.utils.toArray('.wordmark-char', wordmark);
        if (!chars.length) {
            return;
        }

        gsap.set(wordmark, { autoAlpha: 1 });
        gsap.set(chars, { autoAlpha: 0, y: 14 });

        const timeline = gsap.timeline({
            defaults: {
                duration: 0.62,
                ease: 'power3.out'
            }
        });

        timeline
            .fromTo(chars, { autoAlpha: 0, y: 14, rotateX: -76 }, {
                autoAlpha: 1,
                y: 0,
                rotateX: 0,
                duration: 0.78,
                stagger: {
                    each: 0.075,
                    from: 'start'
                }
            }, 0)
            .fromTo(chars, { letterSpacing: '-0.04em' }, {
                letterSpacing: '-0.01em',
                duration: 0.95,
                stagger: {
                    each: 0.055,
                    from: 'start'
                }
            }, 0.06);
    }

    function initMotion() {
        const gsap = getGsap();
        const wordmark = document.querySelector('.hero-wordmark');
        if (!gsap || !wordmark) {
            return;
        }

        buildWordmark(wordmark);

        if (prefersReducedMotion()) {
            revealImmediately(gsap);
            return;
        }

        animateWordmark(gsap, wordmark);
    }

    function init() {
        initOrangeToggle();
        initMotion();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
