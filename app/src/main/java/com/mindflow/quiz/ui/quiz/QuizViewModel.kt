package com.mindflow.quiz.ui.quiz

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mindflow.quiz.data.local.entity.QuestionEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class QuizViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(QuizState())
    val uiState: StateFlow<QuizState> = _uiState.asStateFlow()

    init {
        loadMockQuestions()
    }

    private fun loadMockQuestions() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
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
            _uiState.value = _uiState.value.copy(isLoading = false)
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

                _uiState.value = currentState.copy(
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

                _uiState.value = currentState.copy(
                    answers = currentState.answers + (event.questionId to event.answer),
                    timeTaken = currentState.timeTaken + (event.questionId to (prevTime + event.timeTaken)),
                    score = newScore
                )
            }
            is QuizEvent.LogTimeSpent -> {
                val prevTime = currentState.timeTaken[event.questionId] ?: 0
                _uiState.value = currentState.copy(
                    timeTaken = currentState.timeTaken + (event.questionId to (prevTime + event.timeTaken))
                )
            }
            is QuizEvent.SaveTimer -> {
                _uiState.value = currentState.copy(
                    remainingTimes = currentState.remainingTimes + (event.questionId to event.time)
                )
            }
            is QuizEvent.SyncGlobalTimer -> {
                _uiState.value = currentState.copy(
                    quizTimeRemaining = event.time
                )
            }
            is QuizEvent.NextQuestion -> {
                val nextIndex = currentState.currentQuestionIndex + 1
                if (nextIndex >= currentState.activeQuestions.size) {
                    _uiState.value = currentState.copy(status = "result")
                } else {
                    _uiState.value = currentState.copy(currentQuestionIndex = nextIndex)
                }
            }
            is QuizEvent.PrevQuestion -> {
                val prevIndex = maxOf(0, currentState.currentQuestionIndex - 1)
                _uiState.value = currentState.copy(currentQuestionIndex = prevIndex)
            }
            is QuizEvent.JumpToQuestion -> {
                _uiState.value = currentState.copy(currentQuestionIndex = event.index)
            }
            is QuizEvent.ToggleBookmark -> {
                val isBookmarked = currentState.bookmarks.contains(event.questionId)
                val newBookmarks = if (isBookmarked) {
                    currentState.bookmarks.filter { it != event.questionId }
                } else {
                    currentState.bookmarks + event.questionId
                }
                _uiState.value = currentState.copy(bookmarks = newBookmarks)
            }
            is QuizEvent.ToggleReview -> {
                val isMarked = currentState.markedForReview.contains(event.questionId)
                val newMarked = if (isMarked) {
                    currentState.markedForReview.filter { it != event.questionId }
                } else {
                    currentState.markedForReview + event.questionId
                }
                _uiState.value = currentState.copy(markedForReview = newMarked)
            }
            is QuizEvent.UseFiftyFifty -> {
                _uiState.value = currentState.copy(
                    hiddenOptions = currentState.hiddenOptions + (event.questionId to event.hiddenOptions)
                )
            }
            is QuizEvent.PauseQuiz -> {
                var newRemainingTimes = currentState.remainingTimes
                if (event.questionId != null && event.remainingTime != null) {
                    newRemainingTimes = newRemainingTimes + (event.questionId to event.remainingTime)
                }
                _uiState.value = currentState.copy(
                    isPaused = true,
                    remainingTimes = newRemainingTimes
                )
            }
            is QuizEvent.ResumeQuiz -> {
                _uiState.value = currentState.copy(isPaused = false)
            }
            is QuizEvent.FinishQuiz -> {
                _uiState.value = currentState.copy(status = "result")
            }
            is QuizEvent.RestartQuiz -> {
                val globalTime = if (currentState.mode == "mock" || currentState.mode == "god") {
                    currentState.activeQuestions.size * 60
                } else 0

                val remainingTimes = if (currentState.mode == "learning") {
                    currentState.activeQuestions.associate { it.id to 60 }
                } else emptyMap()

                _uiState.value = currentState.copy(
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
            }
        }
    }
}
