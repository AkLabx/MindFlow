package com.mindflow.quiz.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "one_words")
data class OneWordEntity(
    @PrimaryKey val id: String,
    val pdfName: String,
    val examYear: Int,
    val difficulty: String,
    val status: String,
    val sourceId: Int,
    val pos: String,
    val word: String,
    val meaningEn: String,
    val meaningHi: String,
    val usageSentences: List<String>,
    val note: String?,
    val origin: String?
)
