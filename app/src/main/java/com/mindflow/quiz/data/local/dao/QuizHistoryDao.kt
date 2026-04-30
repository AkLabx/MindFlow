package com.mindflow.quiz.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.mindflow.quiz.data.local.entity.QuizHistoryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface QuizHistoryDao {
    @Query("SELECT * FROM quiz_history ORDER BY date DESC")
    fun getAllHistoryFlow(): Flow<List<QuizHistoryEntity>>

    @Query("SELECT * FROM quiz_history ORDER BY date DESC")
    suspend fun getAllHistory(): List<QuizHistoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistory(history: QuizHistoryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistories(histories: List<QuizHistoryEntity>)

    @Query("DELETE FROM quiz_history")
    suspend fun clearAll()
}
