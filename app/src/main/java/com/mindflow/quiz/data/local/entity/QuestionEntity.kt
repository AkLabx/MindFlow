package com.mindflow.quiz.data.local.entity

import android.os.Parcelable
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.parcelize.Parcelize

@Entity(tableName = "questions")
@Parcelize
data class QuestionEntity(
    @PrimaryKey val id: String,
    val v1Id: String?,
    val examName: String,
    val examYear: Int,
    val examDateShift: String?,
    val subject: String,
    val topic: String,
    val subTopic: String?,
    val tags: List<String>,
    val difficulty: String,
    val questionType: String,
    val questionEn: String,
    val questionHi: String?,
    val optionsEn: List<String>,
    val optionsHi: List<String>?,
    val correct: String,
    val explanationSummary: String?,
    val explanationAnalysisCorrect: String?,
    val explanationAnalysisIncorrect: String?,
    val explanationConclusion: String?,
    val explanationFact: String?,

    // Sync fields
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "SYNCED"
) : Parcelable
