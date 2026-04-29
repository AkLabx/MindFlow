package com.mindflow.quiz.data.remote.dto

import com.mindflow.quiz.data.local.entity.QuestionEntity
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

fun QuestionDto.toEntity(): QuestionEntity {
    val explanationObj = explanation?.jsonObject

    return QuestionEntity(
        id = id,
        v1Id = v1Id,
        examName = examName ?: "",
        examYear = examYear ?: 0,
        examDateShift = examDateShift,
        subject = subject ?: "",
        topic = topic ?: "",
        subTopic = subTopic,
        tags = tags ?: emptyList(),
        difficulty = difficulty ?: "",
        questionType = questionType ?: "",
        questionEn = question ?: "",
        questionHi = questionHi,
        optionsEn = options ?: emptyList(),
        optionsHi = optionsHi,
        correct = correct ?: "",

        explanationSummary = explanationObj?.get("summary")?.jsonPrimitive?.content,
        explanationAnalysisCorrect = explanationObj?.get("analysisCorrect")?.jsonPrimitive?.content,
        explanationAnalysisIncorrect = explanationObj?.get("analysisIncorrect")?.jsonPrimitive?.content,
        explanationConclusion = explanationObj?.get("conclusion")?.jsonPrimitive?.content,
        explanationFact = explanationObj?.get("fact")?.jsonPrimitive?.content,

        updatedAt = System.currentTimeMillis(), // We could parse `createdAt` but System time works for simple sync.
        syncStatus = "SYNCED"
    )
}
