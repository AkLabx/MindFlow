package com.mindflow.quiz.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SubjectStatsDto(
    @SerialName("attempted") val attempted: Int? = 0,
    @SerialName("correct") val correct: Int? = 0,
    @SerialName("incorrect") val incorrect: Int? = 0,
    @SerialName("skipped") val skipped: Int? = 0,
    @SerialName("accuracy") val accuracy: Double? = 0.0
)

@Serializable
data class QuizHistoryDto(
    @SerialName("id") val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("date") val date: Long,
    @SerialName("total_questions") val totalQuestions: Int,
    @SerialName("total_correct") val totalCorrect: Int,
    @SerialName("total_incorrect") val totalIncorrect: Int,
    @SerialName("total_skipped") val totalSkipped: Int,
    @SerialName("total_time_spent") val totalTimeSpent: Int,
    @SerialName("overall_accuracy") val overallAccuracy: Double,
    @SerialName("difficulty") val difficulty: String,
    @SerialName("subject_stats") val subjectStats: Map<String, SubjectStatsDto>? = emptyMap()
)
