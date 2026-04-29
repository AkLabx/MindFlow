package com.mindflow.quiz.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class IdiomDto(
    val id: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("v1_id") val v1Id: String? = null,
    val phrase: String? = null,
    @SerialName("meaning_english") val meaningEnglish: String? = null,
    @SerialName("meaning_hindi") val meaningHindi: String? = null,
    val usage: String? = null,
    val mnemonic: String? = null,
    @SerialName("source_pdf") val sourcePdf: String? = null,
    @SerialName("exam_year") val examYear: Int? = null,
    val difficulty: String? = null,
    val status: String? = null
)
