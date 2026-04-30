package com.mindflow.quiz.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.mindflow.quiz.data.local.AppDatabase
import com.mindflow.quiz.data.repository.ProfileStatsRepository
import com.mindflow.quiz.ui.dashboard.DashboardViewModel

class ViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(DashboardViewModel::class.java)) {
            val database = AppDatabase.getDatabase(context)
            val profileStatsRepository = ProfileStatsRepository(database.quizHistoryDao())
            @Suppress("UNCHECKED_CAST")
            return DashboardViewModel(profileStatsRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
