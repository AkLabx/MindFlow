package com.mindflow.quiz.data.repository

import com.mindflow.quiz.data.local.dao.QuizHistoryDao
import com.mindflow.quiz.data.local.entity.QuizHistoryEntity
import com.mindflow.quiz.data.remote.SupabaseClientConfig
import com.mindflow.quiz.data.remote.dto.QuizHistoryDto
import com.mindflow.quiz.data.remote.dto.toEntity
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlin.math.roundToInt

data class ProfileStats(
    val quizzesCompleted: Int = 0,
    val correctAnswers: Int = 0,
    val averageScore: Int = 0,
    val weakTopics: List<String> = emptyList(),
    val totalTimeSpentFormatted: String = "0s"
)

class ProfileStatsRepository(
    private val quizHistoryDao: QuizHistoryDao
) {

    val profileStatsFlow: Flow<ProfileStats> = quizHistoryDao.getAllHistoryFlow().map { historyList ->
        calculateStats(historyList)
    }

    suspend fun fetchAndSyncHistoryFromSupabase() {
        try {
            val user = SupabaseClientConfig.client.auth.currentUserOrNull() ?: return

            val remoteHistories = SupabaseClientConfig.client.postgrest["quiz_history"]
                .select(Columns.ALL) {
                    filter {
                        eq("user_id", user.id)
                    }
                }.decodeList<QuizHistoryDto>()

            quizHistoryDao.insertHistories(remoteHistories.map { it.toEntity() })
        } catch (e: Exception) {
            e.printStackTrace()
            // In a real app, handle errors via Result or custom exceptions
        }
    }

    private fun calculateStats(historyList: List<QuizHistoryEntity>): ProfileStats {
        var quizzesCompleted = 0
        var correctAnswers = 0
        var totalQuestionsAnswered = 0
        var totalTimeSpent = 0

        val subjectTotals = mutableMapOf<String, Pair<Int, Int>>() // Pair(Correct, Incorrect)

        if (historyList.isNotEmpty()) {
            quizzesCompleted = historyList.size

            historyList.forEach { record ->
                correctAnswers += record.totalCorrect
                totalQuestionsAnswered += record.totalCorrect + record.totalIncorrect
                totalTimeSpent += record.totalTimeSpent

                record.subjectStats.forEach { (subject, stats) ->
                    val current = subjectTotals[subject] ?: Pair(0, 0)
                    subjectTotals[subject] = Pair(
                        current.first + stats.correct,
                        current.second + stats.incorrect
                    )
                }
            }
        }

        var averageScore = 0
        if (totalQuestionsAnswered > 0) {
            averageScore = ((correctAnswers.toDouble() / totalQuestionsAnswered) * 100).roundToInt()
        }

        val weakTopicsList = mutableListOf<Pair<String, Double>>()
        subjectTotals.forEach { (subject, stats) ->
            val attempts = stats.first + stats.second
            if (attempts >= 5) { // Minimum 5 attempts to be considered
                val accuracy = (stats.first.toDouble() / attempts) * 100
                weakTopicsList.add(Pair(subject, accuracy))
            }
        }

        weakTopicsList.sortBy { it.second }
        val weakTopics = weakTopicsList.take(2).map { it.first }

        return ProfileStats(
            quizzesCompleted = quizzesCompleted,
            correctAnswers = correctAnswers,
            averageScore = averageScore,
            weakTopics = weakTopics,
            totalTimeSpentFormatted = formatTime(totalTimeSpent)
        )
    }

    private fun formatTime(seconds: Int): String {
        if (seconds <= 0) return "0s"
        val h = seconds / 3600
        val m = (seconds % 3600) / 60
        val s = seconds % 60

        if (h > 0) return "${h}h ${m}m"
        if (m > 0) return "${m}m ${s}s"
        return "${s}s"
    }
}
