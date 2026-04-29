package com.mindflow.quiz.ui.flashcards

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mindflow.quiz.data.local.entity.IdiomEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FlashcardState(
    val idioms: List<IdiomEntity> = emptyList(),
    val currentIndex: Int = 0,
    val isFlipped: Boolean = false,
    val isLoading: Boolean = true
)

class FlashcardViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(FlashcardState())
    val uiState: StateFlow<FlashcardState> = _uiState.asStateFlow()

    init {
        loadMockIdioms()
    }

    private fun loadMockIdioms() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            // Simulate fetching from Room/Supabase
            delay(500)

            val mockIdioms = listOf(
                IdiomEntity(
                    id = "1",
                    v1Id = null,
                    sourcePdf = "SSC_Idioms",
                    examYear = 2022,
                    difficulty = "Medium",
                    status = "Unseen",
                    phrase = "A blessing in disguise",
                    meaningEnglish = "A good thing that seemed bad at first",
                    meaningHindi = "भेष में आशीर्वाद (शुरुआत में बुरा लगने वाला पर अंत में अच्छा)",
                    usage = "Losing that job was a blessing in disguise because it led me to my true passion.",
                    mnemonic = "Imagine a disguise falling off to reveal a blessing."
                ),
                IdiomEntity(
                    id = "2",
                    v1Id = null,
                    sourcePdf = "SSC_Idioms",
                    examYear = 2021,
                    difficulty = "Easy",
                    status = "Unseen",
                    phrase = "Bite the bullet",
                    meaningEnglish = "To endure a painful or otherwise unpleasant situation that is seen as unavoidable",
                    meaningHindi = "मजबूरी में स्वीकार करना",
                    usage = "I hate going to the dentist, but I'll just have to bite the bullet.",
                    mnemonic = "Soldiers biting a bullet to endure pain without anesthesia."
                )
            )

            _uiState.value = _uiState.value.copy(
                idioms = mockIdioms,
                isLoading = false
            )
        }
    }

    fun flipCard() {
        _uiState.value = _uiState.value.copy(isFlipped = !_uiState.value.isFlipped)
    }

    fun nextCard() {
        val currentState = _uiState.value
        if (currentState.currentIndex < currentState.idioms.size - 1) {
            _uiState.value = currentState.copy(
                currentIndex = currentState.currentIndex + 1,
                isFlipped = false
            )
        }
    }

    fun previousCard() {
        val currentState = _uiState.value
        if (currentState.currentIndex > 0) {
            _uiState.value = currentState.copy(
                currentIndex = currentState.currentIndex - 1,
                isFlipped = false
            )
        }
    }
}
