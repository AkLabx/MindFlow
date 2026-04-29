package com.mindflow.quiz.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class OneWordDto(
    val id: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("v1_id") val v1Id: String? = null,
    val pos: String? = null,
    val word: String? = null,
    @SerialName("meaning_english") val meaningEnglish: String? = null,
    @SerialName("meaning_hindi") val meaningHindi: String? = null,
    @SerialName("usage_sentences") val usageSentences: List<String>? = null,
    val synonyms: List<String>? = null,
    val antonyms: List<String>? = null,
    @SerialName("source_pdf") val sourcePdf: String? = null,
    @SerialName("exam_year") val examYear: Int? = null,
    val difficulty: String? = null,
    val status: String? = null
)
