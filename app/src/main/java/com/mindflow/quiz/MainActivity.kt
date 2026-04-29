package com.mindflow.quiz

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.work.WorkInfo
import androidx.work.WorkManager
import com.mindflow.quiz.ui.navigation.AppNavigation
import com.mindflow.quiz.ui.theme.MindFlowQuizTheme
import kotlinx.coroutines.flow.collectLatest

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MindFlowQuizTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    BootstrappingWrapper {
                        AppNavigation()
                    }
                }
            }
        }
    }
}

@Composable
fun BootstrappingWrapper(content: @Composable () -> Unit) {
    val workManager = WorkManager.getInstance(androidx.compose.ui.platform.LocalContext.current)
    var isBootstrapping by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        val workInfosFlow = workManager.getWorkInfosForUniqueWorkFlow("ImmediateDataSync")
        workInfosFlow.collectLatest { workInfos ->
            if (workInfos.isNotEmpty()) {
                val workInfo = workInfos.first()
                // If it's succeeded, failed, or cancelled, we consider bootstrapping "done" so the user isn't stuck forever.
                if (workInfo.state.isFinished) {
                    isBootstrapping = false
                }
            } else {
                // If there's no work info, maybe it hasn't been enqueued yet or already got pruned.
                // We'll just let it through.
                isBootstrapping = false
            }
        }
    }

    if (isBootstrapping) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else {
        content()
    }
}
