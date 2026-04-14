package com.mindflow.quiz.ui.quiz

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mindflow.quiz.data.local.entity.QuestionEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class QuizState(
    val questions: List<QuestionEntity> = emptyList(),
    val currentQuestionIndex: Int = 0,
    val selectedAnswer: String? = null,
    val score: Int = 0,
    val isFinished: Boolean = false,
    val isLoading: Boolean = true
)

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

            _uiState.value = _uiState.value.copy(
                questions = mockQuestions,
                isLoading = false
            )
        }
    }

    fun selectAnswer(answer: String) {
        if (!_uiState.value.isFinished) {
            _uiState.value = _uiState.value.copy(selectedAnswer = answer)
        }
    }

    fun submitAnswer() {
        val currentState = _uiState.value
        val currentQuestion = currentState.questions[currentState.currentQuestionIndex]

        val isCorrect = currentState.selectedAnswer == currentQuestion.correct
        val newScore = if (isCorrect) currentState.score + 1 else currentState.score

        if (currentState.currentQuestionIndex < currentState.questions.size - 1) {
            // Move to next question
            _uiState.value = currentState.copy(
                currentQuestionIndex = currentState.currentQuestionIndex + 1,
                score = newScore,
                selectedAnswer = null
            )
        } else {
            // Finish quiz
            _uiState.value = currentState.copy(
                score = newScore,
                isFinished = true
            )
        }
    }

    fun resetQuiz() {
        _uiState.value = QuizState(
            questions = _uiState.value.questions,
            isLoading = false
        )
    }
}
