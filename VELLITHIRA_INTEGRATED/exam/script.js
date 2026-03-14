// ========================================================
// VELLITHIRA RP - ASSESSMENT ENGINE
// ========================================================

// Backend API URLs
const API_URL = "/api";

const MCQ_BANK = [
    {
        q: "What does 'RDM' stand for in Roleplay?",
        o: ["Random Death Match", "Real Driving Mechanics", "Rapid Direct Messaging", "Roleplay Decision Making"],
        a: 0
    },
    {
        q: "What is 'Metagaming'?",
        o: ["Playing as a gamer", "Using out-of-character info in-character", "Following the game's main story", "Upgrading your PC setup"],
        a: 1
    },
    {
        q: "Which of these is an example of 'Powergaming'?",
        o: ["Driving a SUV off-road", "Forcing an action on someone they can't resist (e.g., /me breaks cuffs instantly)", "Buying all items in a store", "Working at the police department"],
        a: 1
    },
    {
        q: "What is the 'New Life Rule' (NLR)?",
        o: ["You must change your character and name after every death", "You must forget the situation leading to your death and not return for a set time", "You get a free car when you respawn", "You are invincible for 10 minutes"],
        a: 1
    },
    {
        q: "What is 'VDM'?",
        o: ["Vehicle Death Match (using your car as a weapon without reason)", "Virtual Driving Mode", "Very Direct Messaging", "Velocity Drive Mechanics"],
        a: 0
    },
    {
        q: "If someone is being toxic in OOC chat during a scene, what should you do?",
        o: ["Insult them back in IC chat", "Stay in character and report it later with evidence", "Leave the game immediately", "Shoot them to teach them a lesson"],
        a: 1
    },
    {
        q: "What does 'NVL' stand for?",
        o: ["No Value for Life", "Next Vertical Level", "Name Verification List", "Normal Vehicle License"],
        a: 0
    },
    {
        q: "What is 'Fail RP'?",
        o: ["Losing a robbery", "Actions that are unrealistic or break the immersion of the world", "Failing a driving test", "Being arrested by police"],
        a: 1
    },
    {
        q: "When can you use 'OOC' chat during a roleplay scene?",
        o: ["Any time you want to talk to friends", "Only for critical technical issues or when told by staff", "To argue about rules with other players", "To tell people to follow your stream"],
        a: 1
    },
    {
        q: "What is 'Cop Baiting'?",
        o: ["Applying to be a police officer", "Reporting a crime", "Intentionally committing crimes to get a police chase for fun", "Buying a police-looking car"],
        a: 2
    },
    {
        q: "What is 'Combat Logging'?",
        o: ["Recording your fights for YouTube", "Entering a log of your kills", "Quitting the game to avoid a roleplay situation (robbery, arrest, etc.)", "Logging into the game to combat someone"],
        a: 2
    },
    {
        q: "Define 'Passive RP'.",
        o: ["Going AFK", "Engaging in everyday activities (eating, working, talking) without constant action/crime", "Standing still during a robbery", "Not talking to anyone"],
        a: 1
    },
    {
        q: "If you are Being held at gunpoint, what is the correct reaction?",
        o: ["Pull out your gun and shoot", "Run away as fast as possible", "Value your life and follow the gunman's instructions", "Tell them they are breaking rules"],
        a: 2
    },
    {
        q: "Can you loot a player you just killed without any prior roleplay interaction?",
        o: ["Yes, kill and loot is allowed", "No, looting requires a valid RP reason and prior interaction", "Only if there are no police nearby", "Only if you need ammo"],
        a: 1
    },
    {
        q: "What is a 'Priority' situation?",
        o: ["When you want a pizza", "A major scene (bank robbery, etc.) where others should minimize their own major activities", "Being the first in line at a car shop", "Having a high-tier membership"],
        a: 1
    },
    {
        q: "Is it allowed to jump a sports car off a 50ft cliff and keep driving?",
        o: ["Yes, if the car doesn't explode", "No, this is Fail RP/Unrealistic Driving", "Only if you are in a chase", "Only if you have a repair kit"],
        a: 1
    },
    {
        q: "What is the purpose of '/me'?",
        o: ["To see your own stats", "To describe realistic actions or emotions that the game animations can't show", "To talk to admins", "To shout at everyone"],
        a: 1
    },
    {
        q: "If you witness a rule-break, what is the best course of action?",
        o: ["Stop the scene and argue", "Record the scene and submit a report/ticket later, but finish the RP", "Do the same rule-break back to them", "Ignore it and never mention it"],
        a: 1
    },
    {
        q: "What is 'Character Persistence'?",
        o: ["Always being online", "Developing your character's personality and history consistently over time", "Never changing your character skin", "Always winning every fight"],
        a: 1
    },
    {
        q: "Which of these is NOT allowed in local OOC chat?",
        o: ["Asking for technical help", "Toxicity, insults, or arguing about RP scenes", "Asking for a staff member's help", "Apologizing for a lag spike"],
        a: 1
    }
];

const ESSAY_BANK = [
    {
        q: "Describe a detailed scenario where you would use the '/me' command to enhance a roleplay interaction.",
        type: "essay"
    },
    {
        q: "Explain in your own words why 'Value for Life' (NVL) is essential for a realistic roleplay environment.",
        type: "essay"
    },
    {
        q: "You witness someone breaking a rule during a scene you are involved in. How do you handle this situation both IC and OOC?",
        type: "essay"
    },
    {
        q: "Why is it important to have a clear character backstory and personality instead of just playing as 'yourself'?",
        type: "essay"
    }
];

// ========================================================
// APP LOGIC
// ========================================================

const state = {
    questions: [],
    currentIndex: 0,
    score: 0,
    tabSwitches: 0,
    timer: null,
    timeLeft: 60,
    startTime: 0,
    failed: false,
    failReason: "",
    applicantName: "",
    discordUser: null // Stores {id, username, avatar}
};


// Elements
const screenStart = document.getElementById('screen-start');
const screenQuiz = document.getElementById('screen-quiz');
const screenResult = document.getElementById('screen-result');
const btnStart = document.getElementById('btn-start');
const btnNext = document.getElementById('btn-next');
const timerDisplay = document.getElementById('timer-display');
const timeLeftEl = document.getElementById('time-left');
const progressBar = document.getElementById('progress-bar');
const currentIdxEl = document.getElementById('current-index');
const questionTitle = document.getElementById('question-title');
const optionsGrid = document.getElementById('options-grid');
const essayContainer = document.getElementById('essay-container');
const essayInput = document.getElementById('essay-input');
const countValue = document.getElementById('count-value');
const tabWarning = document.getElementById('tab-warning');
const warnCountEl = document.getElementById('warn-count');
const finalScoreEl = document.getElementById('final-score');
const resultIconEl = document.getElementById('result-icon');
const resultTitleEl = document.getElementById('result-title');
const resultMsgEl = document.getElementById('result-msg');
const failReasonEl = document.getElementById('fail-reason');
const dailyLimitStatus = document.getElementById('daily-limit-status');

// Init
function init() {
    // Check for Discord authentication
    const urlParams = new URLSearchParams(window.location.search);
    const discordId = urlParams.get('id');
    const discordUsername = urlParams.get('username');
    const discordAvatar = urlParams.get('avatar');

    if (!discordId || !discordUsername) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }

    state.discordUser = { id: discordId, username: discordUsername, avatar: discordAvatar };
    state.applicantName = discordUsername;

    // Set applicant name field automatically
    const nameInput = document.getElementById('applicant-name');
    if (nameInput) {
        nameInput.value = discordUsername;
        nameInput.disabled = true; // Prevent changing the authenticated name
    }

    checkDailyLimit();
    btnStart.addEventListener('click', startExam);
    btnNext.addEventListener('click', handleNext);

    // Anti-paste
    essayInput.addEventListener('paste', (e) => {
        e.preventDefault();
        failExam("PASTING DETECTED: Copy-pasting answers is strictly prohibited.");
    });

    // Word count
    essayInput.addEventListener('input', updateWordCount);

    // Tab switch detection
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.questions.length > 0 && !state.failed && screenQuiz.classList.contains('active')) {
            handleTabSwitch();
        }
    });

    console.log(`✅ Authenticated as ${discordUsername} (${discordId})`);
}


function checkDailyLimit() {
    const lastAttempt = localStorage.getItem('vt_last_attempt');
    if (lastAttempt) {
        const lastDate = new Date(lastAttempt).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) {
            btnStart.disabled = true;
            document.getElementById('applicant-name').disabled = true;
            dailyLimitStatus.style.display = 'block';
        }
    }
}

function startExam() {
    // Check if authenticated
    if (!state.discordUser) {
        alert("Authentication failed. Please refresh or login again.");
        window.location.href = 'login.html';
        return;
    }

    // Generate Quiz: 10 MCQ + 2 Essay
    const selectedMCQs = shuffleArray([...MCQ_BANK]).slice(0, 10);
    const selectedEssays = shuffleArray([...ESSAY_BANK]).slice(0, 2);

    state.questions = [
        ...selectedMCQs.map(q => ({ ...q, type: 'mcq' })),
        ...selectedEssays.map(q => ({ ...q, type: 'essay' }))
    ];

    state.currentIndex = 0;
    state.score = 0;
    state.tabSwitches = 0;
    state.failed = false;

    // Record attempt
    localStorage.setItem('vt_last_attempt', new Date().toISOString());

    showScreen(screenQuiz);
    loadQuestion();
}

function loadQuestion() {
    const q = state.questions[state.currentIndex];
    currentIdxEl.innerText = state.currentIndex + 1;
    questionTitle.innerText = q.q;
    progressBar.style.width = `${(state.currentIndex / 12) * 100}%`;

    btnNext.disabled = true;
    btnNext.innerText = (state.currentIndex === 11) ? "Submit Exam" : "Next Question";

    if (q.type === 'mcq') {
        essayContainer.style.display = 'none';
        optionsGrid.style.display = 'grid';
        optionsGrid.innerHTML = '';

        // Shuffle options and keep track of correct one
        const optionsWithIndex = q.o.map((text, i) => ({ text, originalIndex: i }));
        const shuffled = shuffleArray(optionsWithIndex);

        shuffled.forEach((opt, i) => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.innerHTML = `
                <div class="option-index">${String.fromCharCode(65 + i)}</div>
                <div class="option-text">${opt.text}</div>
            `;
            card.onclick = () => selectOption(card, opt.originalIndex === q.a);
            optionsGrid.appendChild(card);
        });

        startTimer(60);
    } else {
        optionsGrid.style.display = 'none';
        essayContainer.style.display = 'block';
        essayInput.value = '';
        countValue.innerText = '0';
        countValue.parentElement.classList.remove('valid');

        startTimer(90);
    }
}

function selectOption(el, isCorrect) {
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    state.lastSelectedCorrect = isCorrect;
    btnNext.disabled = false;
}

function updateWordCount() {
    const text = essayInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    countValue.innerText = words;

    if (words >= 20) {
        countValue.parentElement.classList.add('valid');
        btnNext.disabled = false;
    } else {
        countValue.parentElement.classList.remove('valid');
        btnNext.disabled = true;
    }
}

function startTimer(seconds) {
    clearInterval(state.timer);
    state.timeLeft = seconds;
    updateTimerUI();

    state.timer = setInterval(() => {
        state.timeLeft--;
        updateTimerUI();
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            handleTimeout();
        }
    }, 1000);
}

function updateTimerUI() {
    timeLeftEl.innerText = state.timeLeft;
    timerDisplay.classList.toggle('warning', state.timeLeft <= 10);
}

function handleTimeout() {
    // Treat as incorrect/empty and move on
    handleNext();
}

function handleNext() {
    const q = state.questions[state.currentIndex];

    if (q.type === 'mcq') {
        if (state.lastSelectedCorrect) state.score += 10; // 10 points per MCQ
    } else {
        // Simple heuristic for essay: keywords (just to simulate real grading)
        const text = essayInput.value.toLowerCase();
        if (text.length > 50) state.score += 10; // Simple pass for wordy answers
    }

    state.currentIndex++;
    if (state.currentIndex < 12) {
        loadQuestion();
    } else {
        finishExam();
    }
}

function handleTabSwitch() {
    state.tabSwitches++;
    warnCountEl.innerText = state.tabSwitches;
    tabWarning.classList.add('show');

    setTimeout(() => tabWarning.classList.remove('show'), 3000);

    if (state.tabSwitches >= 3) {
        failExam("TAB SWITCH LIMIT REACHED: You switched tabs 3 times. This is considered cheating.");
    } else {
        alert(`WARNING: Do not switch tabs! (${state.tabSwitches}/3 switches). Next one may lead to failure.`);
    }
}

function failExam(reason) {
    clearInterval(state.timer);
    state.failed = true;
    state.failReason = reason;
    finishExam();
}

function finishExam() {
    clearInterval(state.timer);
    showScreen(screenResult);

    const finalScore = state.failed ? 0 : Math.round((state.score / 120) * 100);
    finalScoreEl.innerText = finalScore;

    if (state.failed) {
        resultIconEl.innerHTML = '<i class="fas fa-times-circle icon-fail"></i>';
        resultTitleEl.innerText = "EVALUATION FAILED";
        resultMsgEl.innerText = "You have been disqualified for violating exam integrity.";
        failReasonEl.innerText = state.failReason;
    } else if (finalScore >= 80) {
        resultIconEl.innerHTML = '<i class="fas fa-check-circle icon-pass"></i>';
        resultTitleEl.innerText = "EVALUATION PASSED";
        resultMsgEl.innerText = "Congratulations! You have met the requirements for the Vellithira Visa.";
        failReasonEl.innerText = "";
    } else {
        resultIconEl.innerHTML = '<i class="fas fa-times-circle icon-fail"></i>';
        resultTitleEl.innerText = "EVALUATION FAILED";
        resultMsgEl.innerText = "Your score was below the 80% threshold. Please study the rules and try again tomorrow.";
        failReasonEl.innerText = "Score Required: 80% | Your Score: " + finalScore + "%";
    }

    if (finalScore >= 80 && !state.failed) {
        assignRole(finalScore);
    } else {
        logFailure(finalScore);
    }
}

async function logFailure(score) {
    try {
        await fetch('/api/fail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                discordUsername: state.discordUser.username,
                score: score,
                reason: state.failed ? state.failReason : "Score below 80%"
            })
        });
    } catch (err) {
        console.error('Failure logging error:', err);
    }
}

async function assignRole(score) {
    const resultMsg = document.getElementById('result-msg');
    const originalText = resultMsg.innerText;
    resultMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Assigning your Visa role...`;

    try {
        const response = await fetch('/api/pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                discordUsername: state.discordUser.username,
                score: score 
            })
        });

        const data = await response.json();
        if (data.success) {
            resultMsg.innerHTML = `<span style="color: #00ff99;"><i class="fas fa-check-circle"></i> ${data.message}</span>`;
        } else {
            resultMsg.innerHTML = `<span style="color: #ff4757;"><i class="fas fa-exclamation-triangle"></i> Role Assignment Failed: ${data.message}</span>`;
        }
    } catch (err) {
        console.error('Role assignment error:', err);
        resultMsg.innerHTML = `<span style="color: #ff4757;"><i class="fas fa-exclamation-triangle"></i> Server Error. Please contact an admin.</span>`;
    }
}


// Utils
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

window.onload = init;
