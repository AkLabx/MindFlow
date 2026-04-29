package com.mindflow.quiz.data.local.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "sync_prefs")

class SyncDataStore(private val context: Context) {

    companion object {
        val LAST_SYNC_QUESTIONS = stringPreferencesKey("last_sync_questions")
    }

    val lastSyncQuestions: Flow<String?> = context.dataStore.data
        .map { preferences ->
            preferences[LAST_SYNC_QUESTIONS]
        }

    suspend fun saveLastSyncQuestions(timestampIso: String) {
        context.dataStore.edit { preferences ->
            preferences[LAST_SYNC_QUESTIONS] = timestampIso
        }
    }
}
