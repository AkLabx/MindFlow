package com.mindflow.quiz.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "one_words")
data class OneWordEntity(
    @PrimaryKey val id: String,
    val v1Id: String?,
    val sourcePdf: String?,
    val examYear: Int,
    val difficulty: String,
    val status: String,
    val pos: String,
    val word: String,
    val meaningEn: String,
    val meaningHi: String,
    val usageSentences: List<String>,
    val synonyms: List<String>,
    val antonyms: List<String>,

    // Sync fields
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "SYNCED"
)
