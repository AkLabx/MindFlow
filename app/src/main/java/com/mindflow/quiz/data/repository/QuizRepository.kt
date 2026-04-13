package com.mindflow.quiz.data.repository

import com.mindflow.quiz.data.local.dao.QuestionDao
import com.mindflow.quiz.data.local.entity.QuestionEntity
import com.mindflow.quiz.data.remote.SupabaseClientConfig
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class QuizRepository(
    private val questionDao: QuestionDao
) {
    /**
     * An example offline-first approach to fetching questions.
     * In a full implementation, you would decode the JSON from Supabase into DTOs,
     * convert DTOs to Room Entities, save to Room, and return.
     */
    fun getQuestionsBySubject(subject: String): Flow<List<QuestionEntity>> = flow {
        // 1. Emit what we have in the local database first
        val localData = questionDao.getQuestionsBySubject(subject)
        emit(localData)

        // 2. Fetch fresh data from Supabase
        try {
            // Note: Decoding requires kotlinx.serialization and a QuestionDto data class.
            // This is a placeholder showing the Kotlin syntax for Postgrest.
            /*
            val remoteData = SupabaseClientConfig.client.postgrest["questions"]
                .select {
                    filter {
                        eq("classification->>subject", subject)
                    }
                }.decodeList<QuestionDto>()

            val entities = remoteData.map { it.toEntity() }
            questionDao.insertQuestions(entities)
            emit(entities)
            */
        } catch (e: Exception) {
            // In a real app, handle exceptions (e.g. offline status) properly
            e.printStackTrace()
        }
    }
}
