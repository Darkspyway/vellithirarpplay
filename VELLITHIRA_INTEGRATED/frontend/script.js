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

let tutorialsData = [];

// Fetch tutorials on load
async function loadTutorials() {
    try {
        const response = await fetch('/api/tutorials');
        tutorialsData = await response.json();
    } catch (err) {
        console.error('Failed to load tutorials:', err);
    }
}

async function openVideo(tutorialId) {
    const modal = document.getElementById('video-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.querySelector('.modal-content');

    if (!modal || !modalTitle || !modalContent) return;

    // Reload tutorials to get the latest
    await loadTutorials();

    // Find the tutorial by ID or Title
    const tutorial = tutorialsData.find(t => t.id === tutorialId || t.title === tutorialId);

    if (tutorial) {
        modalTitle.innerHTML = `Tutorial: <span>${tutorial.title}</span>`;
        
        if (tutorial.videoUrl && tutorial.videoUrl !== "COMING_SOON" && tutorial.videoUrl !== "") {
            modalContent.innerHTML = `
                <div class="video-wrapper" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                    <iframe 
                        src="${tutorial.videoUrl}" 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <p style="margin-top: 1.5rem; text-align: center; color: var(--text-dim); font-size: 0.9em;">
                    ${tutorial.description}
                </p>
            `;
        } else {
            modalContent.innerHTML = `
                <div class="video-placeholder" style="width: 100%; cursor: default;">
                    <div class="play-icon"><i class="fas fa-play"></i></div>
                    <span id="modal-subtitle">Video Content Coming Soon</span>
                </div>
                <p style="margin-top: 1.5rem; text-align: center; color: var(--text-dim);">
                    The official video guide for **${tutorial.title}** is currently being prepared. <br>Please check back soon!
                </p>
            `;
        }
    } else {
        modalTitle.innerHTML = `Tutorial: <span>${tutorialId}</span>`;
        modalContent.innerHTML = `<p style="text-align: center;">Tutorial info for "${tutorialId}" not found.</p>`;
    }

    modal.classList.add('active');
}

loadTutorials();
