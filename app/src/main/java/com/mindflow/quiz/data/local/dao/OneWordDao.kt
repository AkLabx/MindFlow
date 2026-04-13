package com.mindflow.quiz.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.mindflow.quiz.data.local.entity.OneWordEntity

@Dao
interface OneWordDao {
    @Query("SELECT * FROM one_words")
    suspend fun getAllOneWords(): List<OneWordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOneWords(oneWords: List<OneWordEntity>)

    @Query("DELETE FROM one_words")
    suspend fun clearAll()
}
