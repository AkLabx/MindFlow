package com.mindflow.quiz.utils

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.*

class TTSManager(context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isInitialized = false

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true
            // Set default language to English US, but can switch dynamically
            tts?.language = Locale.US
        }
    }

    fun speak(text: String, locale: Locale = Locale.US) {
        if (isInitialized) {
            tts?.language = locale
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
        }
    }

    fun stop() {
        if (isInitialized) {
            tts?.stop()
        }
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
    }
}
