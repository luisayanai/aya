let currentQuestionIndex = 0;
let score = 0;
let scoredQuestions = new Set();
let playerName = 'Aya';

// --- Simple synthesized sounds using WebAudio (no external files) ---
let __audioCtx = null;
function getAudioContext() {
    if (!__audioCtx) {
        __audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return __audioCtx;
}

function playTone(frequency, duration = 220, type = 'sine', gain = 0.12) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration / 1000 + 0.02);
}

function playSuccessSound() {
    // two quick rising beeps
    playTone(880, 140, 'sine', 0.12);
    setTimeout(() => playTone(1320, 160, 'sine', 0.11), 120);
}

function playErrorSound() {
    // short low buzz + decay
    playTone(220, 280, 'sawtooth', 0.14);
    setTimeout(() => playTone(160, 180, 'sine', 0.08), 140);
}

// Function to start the quiz and hide the intro page
function startQuiz() {
    // Reset state
    currentQuestionIndex = 0;
    score = 0;
    scoredQuestions.clear();
    document.getElementById('intro-page').classList.add('hidden');
    document.getElementById('quiz-page').classList.remove('hidden');
    // Update score display if present
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
    loadQuestion(0);
    document.getElementById('next-btn').innerText = 'Próxima';
    // resume audio on first user interaction (required on some mobile browsers)
    resumeAudioOnInteraction();
}

function resumeAudioOnInteraction() {
    // some browsers block WebAudio until a user gesture; try to resume if suspended
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            const resume = () => {
                ctx.resume().catch(() => {});
                document.removeEventListener('click', resume);
                document.removeEventListener('touchstart', resume);
            };
            document.addEventListener('click', resume, { once: true });
            document.addEventListener('touchstart', resume, { once: true });
        }
    } catch (e) { /* ignore */ }
}

// Small in-page toast for polished feedback (replaces alert())
function showToast(message, type = 'info', duration = 6000) {
    let root = document.getElementById('toast-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'toast-root';
        document.body.appendChild(root);
    }

    const toast = document.createElement('div');
    toast.className = `quiz-toast quiz-toast-${type}`;
    toast.textContent = message;
    root.appendChild(toast);

    // entrance
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => root.removeChild(toast), 300);
    }, duration);
}

function updateScoreDisplay() {
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;
}

// Example questions data (you can add more questions here)
const questions = [
    {
        question: "1. Começando com Pokemon, qual destes não é um ataque do Tipo Psíquico?",
        answers: ["Psych Up", "Agility", "Imprison", "Heart Stamp"],
        correctAnswer: 0
    },
    {
        question: "2. Qual destes Pokemon sofre mais com o ataque Hidro Bomba?",
        answers: ["Vanusaur", "Charizard", "Onix", "Lapras"],
        correctAnswer: 2
    },
    {
        question: "3. Agora saindo de Unova e pegando uma carona na Millennium Falcon, você sabe qual o único personagem de Star Wars que tem um sabre de luz roxo?",
        answers: ["Luke Sywalker", "Princesa Leia", "Darth Vader", "Mace Windu"],
        correctAnswer: 3
    },
    {
        question: "4.  RAWRGWAWGGR (leia com a voz do nosso Wookie favorito). De qual planeta é o Chewbacca??",
        answers: ["Kashyyyk", "Krant", "Alderaan", "Kuschuw"],
        correctAnswer: 0
    },
    {
        question: "5. Uhhh, agora é uma pergunta para quem prestou bastante atenção no Episódio IV, hein? Quem explodiu a primeira Estrela da Morte e com que arma?",
        answers: ["Luke Skywalker com seu sabre de luz", "Princesa Leia com um X-Wing", "Luke Skywalker com um X-Wing", "Princesa Leia com um detonador térmico"],
        correctAnswer: 2 
    },
    {
        question: "6. Dei uma passadinha na Terra Média para comer um banquete digno de Hobbits e lá me contaram que existe uma pessoa que conseguiu arrancar o Anel do dedo de Sauron. Quem foi?",
        answers: ["Elendil", "Saruman", "Galadriel", "Isildur"],
        correctAnswer: 3
    },
    {
        question: "7. Assunto delicado agora...vamos falar de idade! Quantos anos mais ou menos tem Gandalf? (dica: ele já viveu um bocado...)",
        answers: ["50.000 anos", "10.000 anos", "80.000 anos", "250.000 anos"],
        correctAnswer: 0
    },
    {
        question: "8. Eu ouvi Escotismo? Me diga aí, quanto tempo durou o Cerco de Mafeking?",
        answers: ["97 dias", "134 dias", "217 dias", "328 dias"],
        correctAnswer: 2
    },
    {
        question: "9. Falando em quantidade, sabia que a Indonésia é o país que possui mais membros escoteiros? Mas quantos são eles mais ou menos?",
        answers: ["2 milhões", "9 milhões", "16 milhões", "25 milhões"],
        correctAnswer: 3
    },
    {
        question: "10. Aya, você gostaria de ser a minha madrinha? :)",
        answers: ["Sim", "Não"],
        correctAnswer: 0
    }
];

// Function to load a question
function loadQuestion(index) {
    const questionData = questions[index];
    // keep the global index in sync
    currentQuestionIndex = index;
    const qText = playerName ? `${questionData.question}` : questionData.question;
    document.getElementById('question').textContent = qText;
    const answersContainer = document.querySelector('.answers-container');
    const nextButton = document.getElementById('next-btn');
    
    // Clear previous answers
    answersContainer.innerHTML = '';
    
    // Dynamically create answer boxes based on the number of answers
    questionData.answers.forEach((answerText, i) => {
        const answerDiv = document.createElement('div');
        answerDiv.classList.add('answer');
        // allow absolute positioning for evasive behaviour
        answerDiv.style.position = 'relative';
        answerDiv.dataset.index = i;
        answerDiv.dataset.correct = i === questionData.correctAnswer ? 'true' : 'false';
        answerDiv.textContent = answerText;
        
        // Add click event listener
        answerDiv.addEventListener('click', function() {
            checkAnswer(this);
        });
        
        answersContainer.appendChild(answerDiv);
    });

    // Update progress bar
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = ((index + 1) / questions.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    // ARIA and meta updates
    progressBar.setAttribute('aria-valuenow', String(Math.round(progressPercentage)));
    const qNumEl = document.getElementById('question-number');
    if (qNumEl) qNumEl.textContent = `Pergunta ${index + 1}/${questions.length}`;
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.textContent = `Pontuação: ${score}`;

    // Reset state variables
    nextButton.disabled = true;
    nextButton.classList.add('disabled');
    // Check if this is the last question and change button text
    if (index === questions.length - 1) {
        nextButton.innerText = 'Terminar Quiz';
    // enable evasive 'Não' behavior on the last question
    enableEvasiveNo();
    } else {
        nextButton.innerText = 'Próxima';
    disableEvasiveNo();
    }

        // ensure holder spacing is correct even if enableEvasiveNo hasn't executed yet
        if (index === questions.length - 1) {
            const holder = document.getElementById('sim-holder');
            if (holder) holder.style.display = 'flex';
        } else {
            const holder = document.getElementById('sim-holder');
            if (holder) holder.style.display = '';
        }
}

// Function to check the selected answer
function checkAnswer(selected) {
    const answers = selected.closest('.answers-container').querySelectorAll('.answer');
    const nextButton = selected.closest('.quiz-card').querySelector('#next-btn');

    if (Array.from(answers).some(answer => answer.classList.contains('correct'))) {
        return;
    }

    if (selected.dataset.correct === 'true') {
        selected.classList.add('correct');
    // play success sound on correct selection
    try { playSuccessSound(); } catch (e) { /* ignore audio errors */ }
        nextButton.disabled = false;
        nextButton.classList.remove('disabled');

    // mark as answered correctly visually; score will be applied when advancing

        // Trigger confetti if it's the last question and "Sim" was selected
        if (
            currentQuestionIndex === questions.length - 1 &&
            selected.textContent.trim().toLowerCase() === "sim"
        ) {
            launchConfetti();
        }
    } else {
    selected.classList.add('incorrect');
    // play error sound on incorrect selection
    try { playErrorSound(); } catch (e) { /* ignore audio errors */ }
    }
}

// Function to launch confetti
function launchConfetti() {
    const duration = 4 * 1000; // 5 seconds
    const end = Date.now() + duration;

    const frame = () => {
        confetti({
            particleCount: 5,
            startVelocity: 30,
            spread: 360,
            origin: { x: Math.random(), y: Math.random() - 0.2 } // Slightly above the screen
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    frame();
}


// Function to move to the next question
function nextQuestion() {
    const answers = document.querySelectorAll('.answer');
    const incorrectAnswers = Array.from(answers).filter(answer => 
        answer.classList.contains('incorrect')
    );
    const correctAnswer = Array.from(answers).find(answer => 
        answer.classList.contains('correct')
    );
    const nextButton = document.getElementById('next-btn');

    // Check if no correct answer has been selected
    if (!correctAnswer) {
        // Check if any incorrect answers have been selected
        if (incorrectAnswers.length > 0) {
            showToast('Ops! Você só selecionou respostas incorretas. Tente novamente!', 'warn');
        } else {
            showToast('Por favor, selecione uma resposta antes de prosseguir.', 'warn');
        }
        return;
    }
    
    // If the question has a correct answer and we haven't counted it yet, increment score now
    if (correctAnswer && !scoredQuestions.has(currentQuestionIndex)) {
        score += 1;
        scoredQuestions.add(currentQuestionIndex);
    updateScoreDisplay();
    showToast('Resposta correta! +1 ponto', 'success', 2400);
    }

    currentQuestionIndex++;

    if (currentQuestionIndex === 9) {
        alert("Oh, oh...parece que a Luísa tem um recadinho para você, Aya.");
        loadVideo();
    } else if (currentQuestionIndex < questions.length) {
        loadQuestion(currentQuestionIndex);
        
        // Change button text to "Terminar quiz" for the last question
        if (currentQuestionIndex === questions.length - 1) {
            nextButton.innerText = 'Terminar quiz';
        } else {
            nextButton.innerText = 'Próxima';
        }
    } else {
        // Show final result modal with embedded celebratory video
        showResultModal();
    }
}



function loadVideo() {
    document.getElementById('quiz-page').classList.add('hidden');
    document.getElementById('video-page').classList.remove('hidden');
}

function continueQuiz() {
    document.getElementById('video-page').classList.add('hidden');
    document.getElementById('quiz-page').classList.remove('hidden');
    loadQuestion(currentQuestionIndex);
}

// Função chamada quando clica emm Terminar QUiz 
function showResultModal() {
    const modal = document.getElementById('result-modal');
    // ensure evasive behaviour is disabled so moving answers don't overlap the modal
    try { disableEvasiveNo(); } catch (e) { /* ignore if not set */ }
    // hide the quiz UI underneath so fixed-position answers won't be visible
    const quizPage = document.getElementById('quiz-page');
    if (quizPage) quizPage.classList.add('hidden');
    const videoPage = document.getElementById('video-page');
    if (videoPage) videoPage.classList.add('hidden');
    // prepare and play the final modal video (if present)
    const finalVideo = document.getElementById('final-modal-video');
    const finalSource = document.getElementById('final-modal-video-source');
    if (finalVideo && finalSource) {
        // ensure the source is set (file should be present in project)
        finalVideo.load();
        finalVideo.play().catch(() => { /* autoplay may be blocked */ });
    }
    // show modal
    if (modal) modal.classList.remove('hidden');
}

// Play a final video and then show overlay with celebratory text
function playFinalVideo() {
    // Hide quiz, show video page and load final clip
    const quizPage = document.getElementById('quiz-page');
    if (quizPage) quizPage.classList.add('hidden');
    const videoPage = document.getElementById('video-page');
    if (videoPage) videoPage.classList.remove('hidden');

    const pageVideo = document.getElementById('page-video');
    const pageVideoSource = document.getElementById('page-video-source');
    const finalOverlay = document.getElementById('final-overlay');

    // Use a special final video file if available, otherwise reuse the same
    pageVideoSource.src = 'final.mp4';
    pageVideo.load();
    pageVideo.play().catch(() => { /* autoplay may be blocked, ignore */ });

    // when the video ends, show the celebratory overlay above it
    pageVideo.onended = function() {
        if (finalOverlay) finalOverlay.classList.remove('hidden');
    };

    // Also allow overlay to be shown after a short delay in case onended isn't fired
    setTimeout(() => { if (pageVideo.ended && finalOverlay) finalOverlay.classList.remove('hidden'); }, 1200);
}

function retryQuiz() {
    const modal = document.getElementById('result-modal');
    if (modal) modal.classList.add('hidden');
    // restart
    startQuiz();
}


// --- Evasive 'Não' behaviour for final question ---
let evasiveEnabled = false;
let evasiveTarget = null; // DOM node for the 'Não' option
let evasiveHandler = null;
let evasiveIntervalId = null;
let simOriginal = { position: '', left: '', top: '', zIndex: '' };
let simTarget = null;

function enableEvasiveNo() {
    evasiveEnabled = true;
    setTimeout(() => {
        const answers = Array.from(document.querySelectorAll('.answer'));
        evasiveTarget = answers.find(a => a.textContent && a.textContent.trim().toLowerCase() === 'não' || a.textContent && a.textContent.trim().toLowerCase() === 'nao');
        if (!evasiveTarget) return;
        // make the 'Não' roam across the viewport
        evasiveTarget.style.position = 'fixed';
        evasiveTarget.style.transition = 'left 400ms ease, top 400ms ease, transform 200ms ease';

        // locate Sim
        const simEl = answers.find(a => a.textContent && a.textContent.trim().toLowerCase() === 'sim');
        simTarget = simEl || null;

        const isSmall = window.innerWidth < 700 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (simTarget) {
            // save original styles
            simOriginal.position = simTarget.style.position || '';
            simOriginal.left = simTarget.style.left || '';
            simOriginal.top = simTarget.style.top || '';
            simOriginal.bottom = simTarget.style.bottom || '';
            simOriginal.transform = simTarget.style.transform || '';
            simOriginal.padding = simTarget.style.padding || '';
            simOriginal.zIndex = simTarget.style.zIndex || '';

            if (isSmall) {
                // deterministic: append Sim into the static holder inside the card so it sits below the question
                const holder = document.getElementById('sim-holder');
                if (holder && holder !== simTarget.parentNode) {
                    try {
                        if (!simOriginal.originalParent) {
                            simOriginal.originalParent = simTarget.parentNode;
                            simOriginal.originalNext = simTarget.nextSibling;
                        }
                    } catch (e) {}
                    holder.appendChild(simTarget);
                    simTarget.classList.add('in-sim-holder');
                    // ensure visual style inside holder
                    simTarget.style.position = 'relative';
                    simTarget.style.left = '';
                    simTarget.style.top = '';
                    simTarget.style.transform = 'none';
                    simTarget.style.padding = '12px 20px';
                    simTarget.style.borderRadius = '12px';
                    simTarget.style.zIndex = '1201';
                }
            } else {
                // on larger screens, keep Sim centered fixed
                simTarget.style.position = 'fixed';
                simTarget.style.left = '50%';
                simTarget.style.top = '48%';
                simTarget.style.transform = 'translate(-50%, -50%)';
                simTarget.style.zIndex = '99999';
            }
        }

        if (evasiveIntervalId) clearInterval(evasiveIntervalId);
        evasiveIntervalId = setInterval(() => moveNoToRandomPosition(evasiveTarget, simTarget), 400);
        moveNoToRandomPosition(evasiveTarget, simTarget);
    }, 30);
}

function disableEvasiveNo() {
    evasiveEnabled = false;
    if (evasiveHandler) {
        document.removeEventListener('mousemove', evasiveHandler);
        evasiveHandler = null;
    }
    if (evasiveIntervalId) { clearInterval(evasiveIntervalId); evasiveIntervalId = null; }
    if (evasiveTarget) {
        evasiveTarget.style.position = 'relative';
        evasiveTarget.style.left = '';
        evasiveTarget.style.top = '';
        evasiveTarget = null;
    }
    if (simTarget) {
        simTarget.style.position = simOriginal.position;
        simTarget.style.left = simOriginal.left;
        simTarget.style.top = simOriginal.top;
    simTarget.style.transform = simOriginal.transform;
    simTarget.style.bottom = simOriginal.bottom;
    simTarget.style.padding = simOriginal.padding;
    simTarget.style.zIndex = simOriginal.zIndex;
        simTarget = null;
    }
    const parent = document.querySelector('.answers-container');
    if (parent) parent.style.position = '';
}

function moveNoIfNearViewport(event, target, avoidEl) {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const threshold = 140; // pixels
    if (dist < threshold) {
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const tW = rect.width;
        const tH = rect.height;

        // Try to find a random spot in viewport that doesn't overlap avoidEl (Sim)
        let attempts = 0;
        while (attempts < 20) {
            const left = Math.floor(Math.random() * Math.max(8, vw - tW - 16)) + 8;
            const top = Math.floor(Math.random() * Math.max(8, vh - tH - 16)) + 8;
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
            target.style.zIndex = '99999';

            if (!avoidEl) break;
            const a = target.getBoundingClientRect();
            const b = avoidEl.getBoundingClientRect();
            const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
            if (!overlap) break;
            attempts++;
        }
        // fallback: place in bottom-right corner if still overlapping
        const aFinal = target.getBoundingClientRect();
        const bFinal = avoidEl ? avoidEl.getBoundingClientRect() : null;
        const overlapFinal = avoidEl ? !(aFinal.right < bFinal.left || aFinal.left > bFinal.right || aFinal.bottom < bFinal.top || aFinal.top > bFinal.bottom) : false;
        if (overlapFinal) {
            target.style.left = `${Math.max(12, vw - tW - 24)}px`;
            target.style.top = `${Math.max(12, vh - tH - 24)}px`;
        }
    }
}

function moveNoToRandomPosition(target, avoidEl) {
    if (!target) return;
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const rect = target.getBoundingClientRect();
    const tW = rect.width;
    const tH = rect.height;

    let attempts = 0;
    while (attempts < 30) {
        const left = Math.floor(Math.random() * Math.max(8, vw - tW - 16)) + 8;
        const top = Math.floor(Math.random() * Math.max(8, vh - tH - 16)) + 8;
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
        target.style.zIndex = '99999';

        if (!avoidEl) break;
        const a = target.getBoundingClientRect();
        const b = avoidEl.getBoundingClientRect();
        const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
        if (!overlap) break;
        attempts++;
    }
    // final fallback: place top-left if still overlapping
    const aFinal = target.getBoundingClientRect();
    const bFinal = avoidEl ? avoidEl.getBoundingClientRect() : null;
    const overlapFinal = avoidEl ? !(aFinal.right < bFinal.left || aFinal.left > bFinal.right || aFinal.bottom < bFinal.top || aFinal.top > bFinal.bottom) : false;
    if (overlapFinal) {
        target.style.left = '12px';
        target.style.top = '12px';
    }
}

// When user selects the evasive 'Não' (if they manage), disable evasive behaviour
document.addEventListener('click', (e) => {
    if (!evasiveEnabled) return;
    if (evasiveTarget && e.target === evasiveTarget) {
        disableEvasiveNo();
    }
});