package com.mindflow.quiz.data.repository

import com.mindflow.quiz.data.local.dao.OneWordDao
import com.mindflow.quiz.data.local.entity.OneWordEntity
import com.mindflow.quiz.data.remote.SupabaseClientConfig
import com.mindflow.quiz.data.remote.dto.OneWordDto
import com.mindflow.quiz.data.remote.dto.toEntity
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class OneWordRepository(
    private val oneWordDao: OneWordDao
) {
    fun getAllOneWords(): Flow<List<OneWordEntity>> = flow {
        // Emit local DB first
        val localData = oneWordDao.getAllOneWords()
        if (localData.isNotEmpty()) {
            emit(localData)
        }

        // Fetch fresh data if needed
        try {
            val remoteData = SupabaseClientConfig.client.postgrest["ows"]
                .select().decodeList<OneWordDto>()

            val entities = remoteData.map { it.toEntity() }
            oneWordDao.insertOneWords(entities)

            emit(oneWordDao.getAllOneWords())
        } catch (e: Exception) {
            e.printStackTrace()
            if (localData.isEmpty()) {
                emit(emptyList())
            }
        }
    }
}
