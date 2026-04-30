package com.mindflow.quiz.ui.quiz

import com.mindflow.quiz.data.local.entity.QuestionEntity

data class QuizState(
    val status: String = "intro", // intro, config, quiz, result
    val mode: String = "learning", // learning, mock
    val currentQuestionIndex: Int = 0,
    val score: Int = 0,
    val answers: Map<String, String> = emptyMap(),
    val timeTaken: Map<String, Int> = emptyMap(),
    val remainingTimes: Map<String, Int> = emptyMap(),
    val quizTimeRemaining: Int = 0,
    val bookmarks: List<String> = emptyList(),
    val markedForReview: List<String> = emptyList(),
    val hiddenOptions: Map<String, List<String>> = emptyMap(),
    val activeQuestions: List<QuestionEntity> = emptyList(),
    val isPaused: Boolean = false,
    val isLoading: Boolean = true
)
