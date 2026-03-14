document.addEventListener('DOMContentLoaded', () => {
    // Parallax logic for index only if elements exist
    const bgOverlay = document.querySelector('.bg-overlay');
    const glow = document.querySelector('.bg-glow');

    if (bgOverlay || glow) {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;

            if (bgOverlay) bgOverlay.style.transform = `scale(1.1) translate(${x * 20}px, ${y * 20}px)`;
            if (glow) glow.style.transform = `translate(calc(-50% + ${x * 50}px), calc(-50% + ${y * 50}px))`;
        });
    }

    // Tutorial Switch Logic
    const legalSwitch = document.getElementById('legal-switch');
    const illegalSwitch = document.getElementById('illegal-switch');
    const legalContent = document.getElementById('legal-content');
    const illegalContent = document.getElementById('illegal-content-section');

    if (legalSwitch && illegalSwitch) {
        legalSwitch.addEventListener('click', () => {
            legalSwitch.classList.add('active');
            illegalSwitch.classList.remove('active');
            legalContent.classList.add('active');
            illegalContent.classList.remove('active');
            document.body.classList.remove('illegal-theme');
        });

        illegalSwitch.addEventListener('click', () => {
            illegalSwitch.classList.add('active');
            legalSwitch.classList.remove('active');
            illegalContent.classList.add('active');
            legalContent.classList.remove('active');
            document.body.classList.add('illegal-theme');
        });
    }

    // Rule Category Switching
    const ruleCatBtns = document.querySelectorAll('.rule-cat-btn');
    const ruleSections = document.querySelectorAll('.rule-section');

    if (ruleCatBtns.length > 0) {
        ruleCatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const ruleTarget = btn.getAttribute('data-rule');
                ruleCatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                ruleSections.forEach(s => s.classList.remove('active'));
                const targetSection = document.getElementById(`rule-${ruleTarget}`);
                if (targetSection) targetSection.classList.add('active');
            });
        });
    }

    // Modal logic
    const modal = document.getElementById('video-modal');
    const closeBtn = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');

    if (modal && closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
});

function openVideo(title) {
    const modal = document.getElementById('video-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');

    if (modal && modalTitle) {
        modalTitle.innerHTML = `Tutorial: <span>${title}</span>`;
        if (modalSubtitle) modalSubtitle.innerText = `${title} Content Coming Soon`;
        modal.classList.add('active');
    }
}
