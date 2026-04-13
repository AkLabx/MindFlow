package com.mindflow.quiz.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.mindflow.quiz.data.local.converters.RoomConverters
import com.mindflow.quiz.data.local.dao.IdiomDao
import com.mindflow.quiz.data.local.dao.OneWordDao
import com.mindflow.quiz.data.local.dao.QuestionDao
import com.mindflow.quiz.data.local.entity.IdiomEntity
import com.mindflow.quiz.data.local.entity.OneWordEntity
import com.mindflow.quiz.data.local.entity.QuestionEntity

@Database(
    entities = [
        QuestionEntity::class,
        IdiomEntity::class,
        OneWordEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(RoomConverters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun questionDao(): QuestionDao
    abstract fun idiomDao(): IdiomDao
    abstract fun oneWordDao(): OneWordDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "mindflow_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
