package com.mindflow.quiz.data.remote.dto

import com.mindflow.quiz.data.local.entity.QuizHistoryEntity
import com.mindflow.quiz.data.local.entity.SubjectStats

fun QuizHistoryDto.toEntity(): QuizHistoryEntity {
    return QuizHistoryEntity(
        id = this.id,
        date = this.date,
        totalQuestions = this.totalQuestions,
        totalCorrect = this.totalCorrect,
        totalIncorrect = this.totalIncorrect,
        totalSkipped = this.totalSkipped,
        totalTimeSpent = this.totalTimeSpent,
        overallAccuracy = this.overallAccuracy,
        difficulty = this.difficulty,
        subjectStats = this.subjectStats?.mapValues {
            SubjectStats(
                attempted = it.value.attempted ?: 0,
                correct = it.value.correct ?: 0,
                incorrect = it.value.incorrect ?: 0,
                skipped = it.value.skipped ?: 0,
                accuracy = it.value.accuracy ?: 0.0
            )
        } ?: emptyMap()
    )
}
