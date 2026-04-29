package com.mindflow.quiz.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "idioms")
data class IdiomEntity(
    @PrimaryKey val id: String,
    val v1Id: String?,
    val sourcePdf: String?,
    val examYear: Int,
    val difficulty: String,
    val status: String,
    val phrase: String,
    val meaningEnglish: String,
    val meaningHindi: String,
    val usage: String,
    val mnemonic: String,

    // Sync fields
    val updatedAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "SYNCED"
)
