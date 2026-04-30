package com.mindflow.quiz.ui.quiz

import com.mindflow.quiz.data.local.entity.QuestionEntity

sealed class QuizEvent {
    data class StartQuiz(val questions: List<QuestionEntity>, val mode: String = "learning") : QuizEvent()
    data class AnswerQuestion(val questionId: String, val answer: String, val timeTaken: Int = 0) : QuizEvent()
    data class LogTimeSpent(val questionId: String, val timeTaken: Int) : QuizEvent()
    data class SaveTimer(val questionId: String, val time: Int) : QuizEvent()
    data class SyncGlobalTimer(val time: Int) : QuizEvent()
    object NextQuestion : QuizEvent()
    object PrevQuestion : QuizEvent()
    data class JumpToQuestion(val index: Int) : QuizEvent()
    data class ToggleBookmark(val questionId: String) : QuizEvent()
    data class ToggleReview(val questionId: String) : QuizEvent()
    data class UseFiftyFifty(val questionId: String, val hiddenOptions: List<String>) : QuizEvent()
    data class PauseQuiz(val questionId: String? = null, val remainingTime: Int? = null) : QuizEvent()
    object ResumeQuiz : QuizEvent()
    object FinishQuiz : QuizEvent()
    object RestartQuiz : QuizEvent()
}
