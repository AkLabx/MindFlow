package com.mindflow.quiz.ui.quiz

import androidx.lifecycle.ViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.viewModelScope
import com.mindflow.quiz.data.local.entity.QuestionEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive

class QuizViewModel(private val savedStateHandle: SavedStateHandle) : ViewModel() {

private var timerJob: Job? = null
    private val _uiState = MutableStateFlow(savedStateHandle.get<QuizState>("quiz_state") ?: QuizState())
    val uiState: StateFlow<QuizState> = _uiState.asStateFlow()

    init {
        // Only load mock questions if we don't have active ones
        if (_uiState.value.activeQuestions.isEmpty() && _uiState.value.isLoading) {
            loadMockQuestions()
        } else if (_uiState.value.status == "quiz" && !_uiState.value.isPaused) {
            // Resume timer if we were in the middle of a quiz
            startTimer()
        }
    }

    private fun loadMockQuestions() {
        viewModelScope.launch {
                val newState = _uiState.value.copy(isLoading = true)
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            // Simulate network/database delay
            delay(1000)

            val mockQuestions = listOf(
                QuestionEntity(
                    id = "1", v1Id = null, examName = "SSC", examYear = 2023, examDateShift = null,
                    subject = "History", topic = "Modern India", subTopic = null, tags = listOf("Independence"),
                    difficulty = "Medium", questionType = "MCQ", questionEn = "Who was the first Prime Minister of India?",
                    questionHi = null, optionsEn = listOf("Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "B.R. Ambedkar"),
                    optionsHi = null, correct = "Jawaharlal Nehru", explanationSummary = null,
                    explanationAnalysisCorrect = null, explanationAnalysisIncorrect = null,
                    explanationConclusion = null, explanationFact = null
                ),
                QuestionEntity(
                    id = "2", v1Id = null, examName = "SSC", examYear = 2023, examDateShift = null,
                    subject = "Geography", topic = "Solar System", subTopic = null, tags = listOf("Planets"),
                    difficulty = "Easy", questionType = "MCQ", questionEn = "Which planet is known as the Red Planet?",
                    questionHi = null, optionsEn = listOf("Earth", "Venus", "Mars", "Jupiter"),
                    optionsHi = null, correct = "Mars", explanationSummary = null,
                    explanationAnalysisCorrect = null, explanationAnalysisIncorrect = null,
                    explanationConclusion = null, explanationFact = null
                )
            )

            // Auto-start mock quiz for now to match previous behavior
            onEvent(QuizEvent.StartQuiz(mockQuestions, "learning"))
                val newStateMock = _uiState.value.copy(isLoading = false)
                _uiState.value = newStateMock
                savedStateHandle["quiz_state"] = newStateMock
        }
    }

    fun onEvent(event: QuizEvent) {
        val currentState = _uiState.value

        when (event) {
            is QuizEvent.StartQuiz -> {
                val globalTime = if (event.mode == "mock" || event.mode == "god") {
                    // Default to 60s per question for global time
                    event.questions.size * 60
                } else 0

                val remainingTimes = if (event.mode == "learning") {
                    event.questions.associate { it.id to 60 }
                } else emptyMap()

                val newState = currentState.copy(
                    status = "quiz",
                    mode = event.mode,
                    activeQuestions = event.questions,
                    quizTimeRemaining = globalTime,
                    remainingTimes = remainingTimes,
                    currentQuestionIndex = 0,
                    score = 0,
                    answers = emptyMap(),
                    timeTaken = emptyMap(),
                    bookmarks = emptyList(),
                    markedForReview = emptyList(),
                    hiddenOptions = emptyMap(),
                    isPaused = false
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
                startTimer()
            }
            is QuizEvent.AnswerQuestion -> {
                val question = currentState.activeQuestions.find { it.id == event.questionId }
                val isCorrect = question?.correct == event.answer

                val prevAnswer = currentState.answers[event.questionId]
                var newScore = currentState.score

                if (prevAnswer == null) {
                    if (isCorrect) newScore++
                } else {
                    val wasCorrect = question?.correct == prevAnswer
                    if (wasCorrect && !isCorrect) newScore--
                    if (!wasCorrect && isCorrect) newScore++
                }

                val prevTime = currentState.timeTaken[event.questionId] ?: 0

                val newState = currentState.copy(
                    answers = currentState.answers + (event.questionId to event.answer),
                    timeTaken = currentState.timeTaken + (event.questionId to (prevTime + event.timeTaken)),
                    score = newScore
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.LogTimeSpent -> {
                val prevTime = currentState.timeTaken[event.questionId] ?: 0
                val newState = currentState.copy(
                    timeTaken = currentState.timeTaken + (event.questionId to (prevTime + event.timeTaken))
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.SaveTimer -> {
                val newState = currentState.copy(
                    remainingTimes = currentState.remainingTimes + (event.questionId to event.time)
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.SyncGlobalTimer -> {
                val newState = currentState.copy(
                    quizTimeRemaining = event.time
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.NextQuestion -> {
                val nextIndex = currentState.currentQuestionIndex + 1
                if (nextIndex >= currentState.activeQuestions.size) {
                val newState = currentState.copy(status = "result")
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
                    stopTimer()
                } else {
                val newState = currentState.copy(currentQuestionIndex = nextIndex)
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
                }
            }
            is QuizEvent.PrevQuestion -> {
                val prevIndex = maxOf(0, currentState.currentQuestionIndex - 1)
                val newState = currentState.copy(currentQuestionIndex = prevIndex)
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.JumpToQuestion -> {
                val newState = currentState.copy(currentQuestionIndex = event.index)
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.ToggleBookmark -> {
                val isBookmarked = currentState.bookmarks.contains(event.questionId)
                val newBookmarks = if (isBookmarked) {
                    currentState.bookmarks.filter { it != event.questionId }
                } else {
                    currentState.bookmarks + event.questionId
                }
                val newState = currentState.copy(bookmarks = newBookmarks)
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.ToggleReview -> {
                val isMarked = currentState.markedForReview.contains(event.questionId)
                val newMarked = if (isMarked) {
                    currentState.markedForReview.filter { it != event.questionId }
                } else {
                    currentState.markedForReview + event.questionId
                }
                val newState = currentState.copy(markedForReview = newMarked)
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.UseFiftyFifty -> {
                val newState = currentState.copy(
                    hiddenOptions = currentState.hiddenOptions + (event.questionId to event.hiddenOptions)
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.PauseQuiz -> {
                var newRemainingTimes = currentState.remainingTimes
                if (event.questionId != null && event.remainingTime != null) {
                    newRemainingTimes = newRemainingTimes + (event.questionId to event.remainingTime)
                }
                val newState = currentState.copy(
                    isPaused = true,
                    remainingTimes = newRemainingTimes
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.ResumeQuiz -> {
                val newState = currentState.copy(isPaused = false)
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.FinishQuiz -> {
                stopTimer()
                val newState = currentState.copy(status = "result")
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
            is QuizEvent.RestartQuiz -> {
                val globalTime = if (currentState.mode == "mock" || currentState.mode == "god") {
                    currentState.activeQuestions.size * 60
                } else 0

                val remainingTimes = if (currentState.mode == "learning") {
                    currentState.activeQuestions.associate { it.id to 60 }
                } else emptyMap()

                val newState = currentState.copy(
                    status = "quiz",
                    currentQuestionIndex = 0,
                    score = 0,
                    answers = emptyMap(),
                    timeTaken = emptyMap(),
                    quizTimeRemaining = globalTime,
                    remainingTimes = remainingTimes,
                    bookmarks = emptyList(),
                    markedForReview = emptyList(),
                    hiddenOptions = emptyMap(),
                    isPaused = false
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
                startTimer()
            }
        }
    }

    private fun startTimer() {
        stopTimer()
        timerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                tickTimer()
            }
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        timerJob = null
    }

    private fun tickTimer() {
        val currentState = _uiState.value
        if (currentState.isPaused || currentState.status != "quiz" || currentState.activeQuestions.isEmpty()) return

        val currentQuestionId = currentState.activeQuestions.getOrNull(currentState.currentQuestionIndex)?.id ?: return

        // Always update time taken for current question
        val prevTimeTaken = currentState.timeTaken[currentQuestionId] ?: 0
        val newTimeTakenMap = currentState.timeTaken + (currentQuestionId to (prevTimeTaken + 1))

        if (currentState.mode == "learning") {
            val prevRemaining = currentState.remainingTimes[currentQuestionId] ?: 60
            if (prevRemaining > 0) {
                val newRemainingMap = currentState.remainingTimes + (currentQuestionId to (prevRemaining - 1))
                val newState = currentState.copy(
                    timeTaken = newTimeTakenMap,
                    remainingTimes = newRemainingMap
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            } else {
                val newState = currentState.copy(
                    timeTaken = newTimeTakenMap
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
        } else if (currentState.mode == "mock" || currentState.mode == "god") {
            if (currentState.quizTimeRemaining > 0) {
                val newState = currentState.copy(
                    timeTaken = newTimeTakenMap,
                    quizTimeRemaining = currentState.quizTimeRemaining - 1
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            } else if (currentState.mode == "mock") {
                // Auto finish if time is up in mock mode
                onEvent(QuizEvent.FinishQuiz)
            } else {
                // God mode - time can go negative or stop
                val newState = currentState.copy(
                    timeTaken = newTimeTakenMap
                )
                _uiState.value = newState
                savedStateHandle["quiz_state"] = newState
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopTimer()
    }
}
