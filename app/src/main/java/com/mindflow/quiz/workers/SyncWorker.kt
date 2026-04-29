package com.mindflow.quiz.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.mindflow.quiz.data.local.AppDatabase
import com.mindflow.quiz.data.local.datastore.SyncDataStore
import com.mindflow.quiz.data.remote.SupabaseClientConfig
import com.mindflow.quiz.data.remote.dto.QuestionDto
import com.mindflow.quiz.data.remote.dto.toEntity
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

class SyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d("SyncWorker", "Starting background sync with Supabase...")

            val database = AppDatabase.getDatabase(applicationContext)
            val questionDao = database.questionDao()
            val syncDataStore = SyncDataStore(applicationContext)

            val lastSync = syncDataStore.lastSyncQuestions.firstOrNull()

            // Fetch updated questions
            val remoteData = if (lastSync != null) {
                Log.d("SyncWorker", "Fetching questions updated after $lastSync")
                SupabaseClientConfig.client.postgrest["questions"]
                    .select {
                        filter {
                            gte("created_at", lastSync)
                        }
                    }.decodeList<QuestionDto>()
            } else {
                Log.d("SyncWorker", "Fetching all questions (first sync)")
                SupabaseClientConfig.client.postgrest["questions"]
                    .select()
                    .decodeList<QuestionDto>()
            }

            if (remoteData.isNotEmpty()) {
                val entities = remoteData.map { it.toEntity() }
                questionDao.insertQuestions(entities)

                // Save new lastSync timestamp
                val now = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_INSTANT)
                syncDataStore.saveLastSyncQuestions(now)

                Log.d("SyncWorker", "Synced ${entities.size} questions successfully.")
            } else {
                Log.d("SyncWorker", "No new questions to sync.")
            }

            Log.d("SyncWorker", "Background sync completed successfully.")
            Result.success()
        } catch (e: Exception) {
            Log.e("SyncWorker", "Background sync failed", e)
            Result.retry()
        }
    }
}
