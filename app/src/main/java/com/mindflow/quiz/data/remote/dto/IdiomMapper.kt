package com.mindflow.quiz.data.remote.dto

import com.mindflow.quiz.data.local.entity.IdiomEntity

fun IdiomDto.toEntity(): IdiomEntity {
    return IdiomEntity(
        id = id,
        v1Id = v1Id,
        sourcePdf = sourcePdf,
        examYear = examYear ?: 0,
        difficulty = difficulty ?: "",
        status = status ?: "active",
        phrase = phrase ?: "",
        meaningEnglish = meaningEnglish ?: "",
        meaningHindi = meaningHindi ?: "",
        usage = usage ?: "",
        mnemonic = mnemonic ?: "",

        updatedAt = System.currentTimeMillis(),
        syncStatus = "SYNCED"
    )
}
