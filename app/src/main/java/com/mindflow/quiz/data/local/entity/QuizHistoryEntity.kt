package com.mindflow.quiz.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "quiz_history")
data class QuizHistoryEntity(
    @PrimaryKey val id: String,
    val date: Long,
    val totalQuestions: Int,
    val totalCorrect: Int,
    val totalIncorrect: Int,
    val totalSkipped: Int,
    val totalTimeSpent: Int,
    val overallAccuracy: Double,
    val difficulty: String,
    val subjectStats: Map<String, SubjectStats>
)
