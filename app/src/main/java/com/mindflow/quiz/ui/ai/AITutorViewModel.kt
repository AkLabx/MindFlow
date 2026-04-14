package com.mindflow.quiz.ui.ai

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.mindflow.quiz.BuildConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatMessage(
    val id: String,
    val text: String,
    val isUser: Boolean,
    val isError: Boolean = false
)

data class AITutorState(
    val messages: List<ChatMessage> = emptyList(),
    val isLoading: Boolean = false
)

class AITutorViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(AITutorState())
    val uiState: StateFlow<AITutorState> = _uiState.asStateFlow()

    private val generativeModel = GenerativeModel(
        modelName = "gemini-2.5-flash-lite",
        apiKey = BuildConfig.GEMINI_API_KEY
    )

    // We maintain a Chat instance to preserve context natively
    private val chat = generativeModel.startChat(
        history = listOf(
            content(role = "user") { text("I am studying for competitive exams.") },
            content(role = "model") { text("I am MindFlow AI, your highly adaptive and helpful learning assistant. How can I help you today?") }
        )
    )

    init {
        // Initial greeting
        _uiState.value = AITutorState(
            messages = listOf(
                ChatMessage(
                    id = java.util.UUID.randomUUID().toString(),
                    text = "I am MindFlow AI, your highly adaptive and helpful learning assistant. How can I help you today?",
                    isUser = false
                )
            )
        )
    }

    fun sendMessage(userMessage: String, contextData: String? = null) {
        if (userMessage.isBlank()) return

        val newMessage = ChatMessage(
            id = java.util.UUID.randomUUID().toString(),
            text = userMessage,
            isUser = true
        )

        // Add user message to UI immediately and show loading
        _uiState.value = _uiState.value.copy(
            messages = _uiState.value.messages + newMessage,
            isLoading = true
        )

        viewModelScope.launch {
            try {
                // Prepend context data to the prompt if provided (e.g. from the Quiz engine)
                val fullPrompt = if (contextData != null) {
                    "Context: \$contextData\n\nQuestion: \$userMessage"
                } else {
                    userMessage
                }

                val response = chat.sendMessage(fullPrompt)

                val aiResponse = ChatMessage(
                    id = java.util.UUID.randomUUID().toString(),
                    text = response.text ?: "I am sorry, I couldn't generate a response.",
                    isUser = false
                )

                _uiState.value = _uiState.value.copy(
                    messages = _uiState.value.messages + aiResponse,
                    isLoading = false
                )
            } catch (e: Exception) {
                val errorResponse = ChatMessage(
                    id = java.util.UUID.randomUUID().toString(),
                    text = "Error communicating with AI: \${e.localizedMessage}",
                    isUser = false,
                    isError = true
                )

                _uiState.value = _uiState.value.copy(
                    messages = _uiState.value.messages + errorResponse,
                    isLoading = false
                )
            }
        }
    }
}
