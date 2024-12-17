let currentQuestionIndex = 0;
let correctAnswerSelected = false;

// Function to start the quiz and hide the intro page
function startQuiz() {
    document.getElementById('intro-page').classList.add('hidden');
    document.getElementById('quiz-page').classList.remove('hidden');
    loadQuestion(0);
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
    document.getElementById('question').textContent = questionData.question;
    const answersContainer = document.querySelector('.answers-container');
    const nextButton = document.getElementById('next-btn');
    
    // Clear previous answers
    answersContainer.innerHTML = '';
    
    // Dynamically create answer boxes based on the number of answers
    questionData.answers.forEach((answerText, i) => {
        const answerDiv = document.createElement('div');
        answerDiv.classList.add('answer');
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

    // Reset state variables
    correctAnswerSelected = false;
    nextButton.disabled = true;
    nextButton.classList.add('disabled');
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
        nextButton.disabled = false;
        nextButton.classList.remove('disabled');

        // Trigger confetti if it's the last question and "Sim" was selected
        if (
            currentQuestionIndex === questions.length - 1 &&
            selected.textContent.trim().toLowerCase() === "sim"
        ) {
            launchConfetti();
        }
    } else {
        selected.classList.add('incorrect');
    }
}

// Function to launch confetti
function launchConfetti() {
    const duration = 5 * 1000; // 5 seconds
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
            alert('Ops! Você só selecionou respostas incorretas. Tente novamente!');
        } else {
            alert('Por favor, selecione uma resposta antes de prosseguir.');
        }
        return;
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
        alert('Parabéns!! Você concluiu o quiz :))');
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