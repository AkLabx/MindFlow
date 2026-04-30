package com.mindflow.quiz.data.local.entity

import kotlinx.serialization.Serializable

@Serializable
data class SubjectStats(
    val attempted: Int,
    val correct: Int,
    val incorrect: Int,
    val skipped: Int,
    val accuracy: Double
)
