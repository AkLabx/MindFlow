package com.mindflow.quiz.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.mindflow.quiz.data.local.entity.IdiomEntity

@Dao
interface IdiomDao {
    @Query("SELECT * FROM idioms")
    suspend fun getAllIdioms(): List<IdiomEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIdioms(idioms: List<IdiomEntity>)

    @Query("DELETE FROM idioms")
    suspend fun clearAll()
}
