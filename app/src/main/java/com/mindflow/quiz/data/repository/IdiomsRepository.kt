package com.mindflow.quiz.data.repository

import com.mindflow.quiz.data.local.dao.IdiomDao
import com.mindflow.quiz.data.local.entity.IdiomEntity
import com.mindflow.quiz.data.remote.SupabaseClientConfig
import com.mindflow.quiz.data.remote.dto.IdiomDto
import com.mindflow.quiz.data.remote.dto.toEntity
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class IdiomsRepository(
    private val idiomDao: IdiomDao
) {
    fun getAllIdioms(): Flow<List<IdiomEntity>> = flow {
        // Emit local DB first
        val localData = idiomDao.getAllIdioms()
        if (localData.isNotEmpty()) {
            emit(localData)
        }

        // Fetch fresh data if needed
        try {
            val remoteData = SupabaseClientConfig.client.postgrest["idiom"]
                .select().decodeList<IdiomDto>()

            val entities = remoteData.map { it.toEntity() }
            idiomDao.insertIdioms(entities)

            emit(idiomDao.getAllIdioms())
        } catch (e: Exception) {
            e.printStackTrace()
            if (localData.isEmpty()) {
                emit(emptyList())
            }
        }
    }
}
