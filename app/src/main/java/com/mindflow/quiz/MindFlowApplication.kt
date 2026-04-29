package com.mindflow.quiz

import android.app.Application
import android.util.Log
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.mindflow.quiz.workers.SyncWorker
import java.util.concurrent.TimeUnit

class MindFlowApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        Log.d("MindFlowApplication", "Application started. Initializing background sync.")
        setupSyncWorker()
    }

    private fun setupSyncWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        // Periodic Sync (Every 24 hours)
        val periodicSyncRequest = PeriodicWorkRequestBuilder<SyncWorker>(24, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build()

        val workManager = WorkManager.getInstance(this)

        workManager.enqueueUniquePeriodicWork(
            "PeriodicDataSync",
            ExistingPeriodicWorkPolicy.KEEP,
            periodicSyncRequest
        )

        // Bootstrapping: Also enqueue a one-time request to run immediately (if needed)
        // WorkManager handles uniqueness and network availability.
        val immediateSyncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .build()

        workManager.enqueueUniqueWork(
            "ImmediateDataSync",
            ExistingWorkPolicy.KEEP,
            immediateSyncRequest
        )
    }
}
