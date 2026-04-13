package com.mindflow.quiz.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "idioms")
data class IdiomEntity(
    @PrimaryKey val id: String,
    val pdfName: String,
    val examYear: Int,
    val difficulty: String,
    val status: String,
    val phrase: String,
    val meaningEnglish: String,
    val meaningHindi: String,
    val usage: String,
    val mnemonic: String,
    val origin: String
)
