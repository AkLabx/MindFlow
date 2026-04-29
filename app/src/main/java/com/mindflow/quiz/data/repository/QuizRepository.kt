package com.mindflow.quiz.data.repository

import com.mindflow.quiz.data.local.dao.QuestionDao
import com.mindflow.quiz.data.local.entity.QuestionEntity
import com.mindflow.quiz.data.remote.SupabaseClientConfig
import com.mindflow.quiz.data.remote.dto.QuestionDto
import com.mindflow.quiz.data.remote.dto.toEntity
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class QuizRepository(
    private val questionDao: QuestionDao
) {
    /**
     * An offline-first approach to fetching questions.
     */
    fun getQuestionsBySubject(subject: String): Flow<List<QuestionEntity>> = flow {
        // 1. Emit what we have in the local database first
        val localData = questionDao.getQuestionsBySubject(subject)
        if (localData.isNotEmpty()) {
            emit(localData)
        }

        // 2. Fetch fresh data from Supabase if needed
        try {
            val remoteData = SupabaseClientConfig.client.postgrest["questions"]
                .select {
                    filter {
                        eq("subject", subject)
                    }
                }.decodeList<QuestionDto>()

            val entities = remoteData.map { it.toEntity() }
            questionDao.insertQuestions(entities)

            // Re-fetch from local to ensure we return the DB source of truth
            emit(questionDao.getQuestionsBySubject(subject))

        } catch (e: Exception) {
            // If network fails, and we already emitted localData, we just swallow or log
            e.printStackTrace()
            if (localData.isEmpty()) {
                // Could emit an error state here if needed
                emit(emptyList())
            }
        }
    }
}
