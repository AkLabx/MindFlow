package com.mindflow.quiz.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mindflow.quiz.data.repository.ProfileStats
import com.mindflow.quiz.data.repository.ProfileStatsRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class DashboardViewModel(
    private val profileStatsRepository: ProfileStatsRepository
) : ViewModel() {

    val profileStats: StateFlow<ProfileStats> = profileStatsRepository.profileStatsFlow
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = ProfileStats()
        )

    init {
        viewModelScope.launch {
            profileStatsRepository.fetchAndSyncHistoryFromSupabase()
        }
    }
}
