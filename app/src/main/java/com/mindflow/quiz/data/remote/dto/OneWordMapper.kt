package com.mindflow.quiz.data.remote.dto

import com.mindflow.quiz.data.local.entity.OneWordEntity

fun OneWordDto.toEntity(): OneWordEntity {
    return OneWordEntity(
        id = id,
        v1Id = v1Id,
        sourcePdf = sourcePdf,
        examYear = examYear ?: 0,
        difficulty = difficulty ?: "",
        status = status ?: "active",
        pos = pos ?: "",
        word = word ?: "",
        meaningEn = meaningEnglish ?: "",
        meaningHi = meaningHindi ?: "",
        usageSentences = usageSentences ?: emptyList(),
        synonyms = synonyms ?: emptyList(),
        antonyms = antonyms ?: emptyList(),

        updatedAt = System.currentTimeMillis(),
        syncStatus = "SYNCED"
    )
}
