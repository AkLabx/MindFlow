package com.mindflow.quiz.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class QuestionDto(
    val id: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("v1_id") val v1Id: String? = null,
    val subject: String? = null,
    val topic: String? = null,
    val subTopic: String? = null,
    val examName: String? = null,
    val examYear: Int? = null,
    val examDateShift: String? = null,
    val difficulty: String? = null,
    val questionType: String? = null,
    val question: String? = null,
    @SerialName("question_hi") val questionHi: String? = null,
    val options: List<String>? = null,
    @SerialName("options_hi") val optionsHi: List<String>? = null,
    val correct: String? = null,
    val tags: List<String>? = null,
    val explanation: JsonElement? = null
)
