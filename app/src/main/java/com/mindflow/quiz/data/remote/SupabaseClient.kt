package com.mindflow.quiz.data.remote

import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest

/**
 * Initializes and provides the Supabase client instance for the Android app.
 *
 * It uses the Supabase Kotlin SDK with the required plugins (GoTrue for Auth, Postgrest for DB).
 */
object SupabaseClientConfig {
    private const val SUPABASE_URL = "https://sjcfagpjstbfxuiwhlps.supabase.co"
    private const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY2ZhZ3Bqc3RiZnh1aXdobHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDQ5OTUsImV4cCI6MjA3NjUyMDk5NX0.8p6tIdBum2uhi0mRYENtF81WryaVlZFCwukwAAwJwJA"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Postgrest)
        install(Auth)
    }
}
