package com.mindflow.quiz.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.mindflow.quiz.data.local.AppDatabase
import com.mindflow.quiz.data.local.datastore.SyncDataStore
import com.mindflow.quiz.data.remote.SupabaseClientConfig
import com.mindflow.quiz.data.remote.dto.IdiomDto
import com.mindflow.quiz.data.remote.dto.OneWordDto
import com.mindflow.quiz.data.remote.dto.QuestionDto
import com.mindflow.quiz.data.remote.dto.toEntity
import io.github.jan.supabase.postgrest.postgrest
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
            val idiomDao = database.idiomDao()
            val oneWordDao = database.oneWordDao()
            val syncDataStore = SyncDataStore(applicationContext)

            val now = ZonedDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_INSTANT)

            // --- 1. Sync Questions ---
            val lastSyncQuestions = syncDataStore.lastSyncQuestions.firstOrNull()
            val remoteQuestions = if (lastSyncQuestions != null) {
                SupabaseClientConfig.client.postgrest["questions"]
                    .select { filter { gte("created_at", lastSyncQuestions) } }.decodeList<QuestionDto>()
            } else {
                SupabaseClientConfig.client.postgrest["questions"]
                    .select().decodeList<QuestionDto>()
            }
            if (remoteQuestions.isNotEmpty()) {
                questionDao.insertQuestions(remoteQuestions.map { it.toEntity() })
                syncDataStore.saveLastSyncQuestions(now)
            }

            // --- 2. Sync Idioms ---
            val lastSyncIdioms = syncDataStore.lastSyncIdioms.firstOrNull()
            val remoteIdioms = if (lastSyncIdioms != null) {
                SupabaseClientConfig.client.postgrest["idiom"]
                    .select { filter { gte("created_at", lastSyncIdioms) } }.decodeList<IdiomDto>()
            } else {
                SupabaseClientConfig.client.postgrest["idiom"]
                    .select().decodeList<IdiomDto>()
            }
            if (remoteIdioms.isNotEmpty()) {
                idiomDao.insertIdioms(remoteIdioms.map { it.toEntity() })
                syncDataStore.saveLastSyncIdioms(now)
            }

            // --- 3. Sync One Word Substitutions (OWS) ---
            val lastSyncOws = syncDataStore.lastSyncOws.firstOrNull()
            val remoteOws = if (lastSyncOws != null) {
                SupabaseClientConfig.client.postgrest["ows"]
                    .select { filter { gte("created_at", lastSyncOws) } }.decodeList<OneWordDto>()
            } else {
                SupabaseClientConfig.client.postgrest["ows"]
                    .select().decodeList<OneWordDto>()
            }
            if (remoteOws.isNotEmpty()) {
                oneWordDao.insertOneWords(remoteOws.map { it.toEntity() })
                syncDataStore.saveLastSyncOws(now)
            }

            Log.d("SyncWorker", "Background sync completed successfully.")
            Result.success()
        } catch (e: Exception) {
            Log.e("SyncWorker", "Background sync failed", e)
            Result.retry()
        }
    }
}
