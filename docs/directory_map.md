# Codebase Directory Map

```text
.
├── AGENTS.md
├── GOOGLE_SIGN_IN_Method_GUIDE.md
├── README.md
├── android
│   ├── app
│   │   ├── build.gradle
│   │   ├── capacitor.build.gradle
│   │   ├── proguard-rules.pro
│   │   └── src
│   │       ├── androidTest
│   │       │   └── java
│   │       │       └── com
│   │       │           └── getcapacitor
│   │       │               └── myapp
│   │       │                   └── ExampleInstrumentedTest.java
│   │       ├── main
│   │       │   ├── AndroidManifest.xml
│   │       │   ├── java
│   │       │   │   └── com
│   │       │   │       └── aklabxmindflow
│   │       │   │           └── app
│   │       │   │               └── MainActivity.java
│   │       │   └── res
│   │       │       ├── drawable
│   │       │       │   ├── ic_launcher_background.xml
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-hdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-ldpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-mdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-night-hdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-night-ldpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-night-mdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-night-xhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-night-xxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-night-xxxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-xhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-xxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-land-xxxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-night
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-hdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-ldpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-mdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-night-hdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-night-ldpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-night-mdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-night-xhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-night-xxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-night-xxxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-xhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-xxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-port-xxxhdpi
│   │       │       │   └── splash.png
│   │       │       ├── drawable-v24
│   │       │       │   └── ic_launcher_foreground.xml
│   │       │       ├── layout
│   │       │       │   └── activity_main.xml
│   │       │       ├── mipmap-anydpi-v26
│   │       │       │   ├── ic_launcher.xml
│   │       │       │   └── ic_launcher_round.xml
│   │       │       ├── mipmap-hdpi
│   │       │       │   ├── ic_launcher.png
│   │       │       │   ├── ic_launcher_background.png
│   │       │       │   ├── ic_launcher_foreground.png
│   │       │       │   └── ic_launcher_round.png
│   │       │       ├── mipmap-ldpi
│   │       │       │   ├── ic_launcher.png
│   │       │       │   ├── ic_launcher_background.png
│   │       │       │   ├── ic_launcher_foreground.png
│   │       │       │   └── ic_launcher_round.png
│   │       │       ├── mipmap-mdpi
│   │       │       │   ├── ic_launcher.png
│   │       │       │   ├── ic_launcher_background.png
│   │       │       │   ├── ic_launcher_foreground.png
│   │       │       │   └── ic_launcher_round.png
│   │       │       ├── mipmap-xhdpi
│   │       │       │   ├── ic_launcher.png
│   │       │       │   ├── ic_launcher_background.png
│   │       │       │   ├── ic_launcher_foreground.png
│   │       │       │   └── ic_launcher_round.png
│   │       │       ├── mipmap-xxhdpi
│   │       │       │   ├── ic_launcher.png
│   │       │       │   ├── ic_launcher_background.png
│   │       │       │   ├── ic_launcher_foreground.png
│   │       │       │   └── ic_launcher_round.png
│   │       │       ├── mipmap-xxxhdpi
│   │       │       │   ├── ic_launcher.png
│   │       │       │   ├── ic_launcher_background.png
│   │       │       │   ├── ic_launcher_foreground.png
│   │       │       │   └── ic_launcher_round.png
│   │       │       ├── values
│   │       │       │   ├── colors.xml
│   │       │       │   ├── ic_launcher_background.xml
│   │       │       │   ├── strings.xml
│   │       │       │   └── styles.xml
│   │       │       └── xml
│   │       │           └── file_paths.xml
│   │       └── test
│   │           └── java
│   │               └── com
│   │                   └── getcapacitor
│   │                       └── myapp
│   │                           └── ExampleUnitTest.java
│   ├── build.gradle
│   ├── capacitor.settings.gradle
│   ├── gradle
│   │   └── wrapper
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── gradle.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── settings.gradle
│   └── variables.gradle
├── benchmark.ts
├── capacitor.config.ts
├── chat-ai-bundle.ts
├── current_tree.txt
├── deploy_functions.js
├── docs
│   ├── AI SECTION
│   │   ├── CHECK.TXT
│   │   └── SamvadChat.tsx.txt
│   ├── AI_TUTOR_MANIFESTO.md
│   ├── ANDROID_BUILD.md
│   ├── CTO_REPORT.md
│   ├── DEPLOYMENT.md
│   ├── FULL_SYSTEM_AUDIT_REPORT.md
│   ├── GK_QUIZ_AUDIT_REPORT.md
│   ├── IG_MEMORY.md
│   ├── OAUTH_HASH_ROUTER_GUIDE.md
│   ├── Presence_Avatar_Architecture_Guide.txt
│   ├── REPORT.md
│   ├── SLEEP_COMA_DIAGNOSTIC_REPORT.md
│   ├── SLEEP_COMA_IMPLEMENTATION_SAFETY_REVIEW.md
│   ├── SLEEP_COMA_RUNTIME_VERIFICATION_ADDENDUM.md
│   ├── SLEEP_COMA_STABILIZATION_PLAN.md
│   ├── VERIFICATION_REPORT.md
│   ├── VERIFICATION_SWEEP_REPORT.md
│   ├── ai_tutor_observability.md
│   ├── architecture
│   │   ├── 01-high-level-architecture.md
│   │   ├── 02-frontend.md
│   │   ├── 03-backend.md
│   │   ├── 04-database.md
│   │   ├── 05-data-flow.md
│   │   ├── 06-feature-inventory.md
│   │   ├── 07-session-system.md
│   │   ├── 08-performance-audit.md
│   │   ├── 09-security-audit.md
│   │   ├── 10-reliability.md
│   │   ├── 11-code-quality.md
│   │   ├── 12-developer-experience.md
│   │   ├── 13-hidden-knowledge.md
│   │   ├── 14-architecture-risks.md
│   │   ├── 15-improvement-roadmap.md
│   │   ├── 16-developer-onboarding.md
│   │   ├── AI_TUTOR_PIPELINE.md
│   │   ├── AUTHENTICATION.md
│   │   ├── COMPONENT_MAP.md
│   │   ├── CONTRIBUTING_ARCHITECTURE.md
│   │   ├── DEAD_CODE_ANALYSIS.md
│   │   ├── FEATURES.md
│   │   ├── FILE_INDEX.md
│   │   ├── FOLDER_STRUCTURE.md
│   │   ├── FUTURE_REFACTOR_BLUEPRINT.md
│   │   ├── README.md
│   │   ├── REPOSITORY_ARCHITECTURE.md
│   │   ├── ROUTES.md
│   │   ├── SERVICES.md
│   │   ├── STATE_MANAGEMENT.md
│   │   ├── SYSTEM_MAINTENANCE.md
│   │   ├── backend_and_db.md
│   │   ├── dashboard_ui_redesign_guide.md
│   │   ├── data_flow.md
│   │   ├── developer_experience.md
│   │   ├── frontend.md
│   │   ├── index.md
│   │   ├── navigation_architecture_audit.md
│   │   └── security_and_reliability.md
│   ├── audit
│   │   ├── FINAL_NETWORK_CONSISTENCY_REVIEW.md
│   │   ├── FINAL_RUNTIME_HARDENING_REPORT.md
│   │   ├── MIND_FLOW_RUNTIME_STABILIZATION_SUMMARY.md
│   │   ├── SLEEP_COMA_PRODUCTION_READINESS_REPORT.md
│   │   ├── ai_gateway_validation_report.md
│   │   └── live_audio_architecture_audit.md
│   ├── capacitor-github-pages-guide.md
│   ├── directory_map.md
│   ├── live-update-system.md
│   ├── maintenance
│   │   ├── STORAGE_GUIDE.md
│   │   └── system-log-cleanup-2026-10-13.md
│   └── repo_map.json
├── google-play-assets
│   ├── PLAY_STORE_METADATA.md
│   ├── app-icon-512x512.png
│   └── feature-graphic-1024x500.png
├── index.html
├── live-proxy-server
│   ├── package-lock.json
│   ├── package.json
│   └── src
│       └── index.js
├── metadata.json
├── package-lock.json
├── package.json
├── postcss.config.js
├── providers
│   └── AppProvider.tsx
├── public
│   ├── 404.html
│   ├── googlef2cc72f43f58845a.html
│   ├── images
│   │   ├── Temp
│   │   ├── backend-profile.png
│   │   ├── ceo-profile.png
│   │   ├── marketing-profile.png
│   │   └── owner-profile.png
│   ├── mindflow-icon.svg
│   ├── og-image.png
│   ├── robots.txt
│   └── sitemap.xml
├── sql_metrics.sql
├── src
│   ├── App.tsx
│   ├── archive
│   │   └── legacy-landing-page
│   │       ├── LandingPage.tsx
│   │       └── README.md
│   ├── assets
│   │   ├── aalok.jpg
│   │   └── default-avatar.svg
│   ├── assets.d.ts
│   ├── components
│   │   ├── Background
│   │   │   └── Fireballs.tsx
│   │   ├── Button
│   │   │   └── Button.tsx
│   │   ├── common
│   │   │   ├── CentralizedTabbedPage.tsx
│   │   │   ├── InstallPwaModal.tsx
│   │   │   ├── PWAUpdateManager.tsx
│   │   │   └── VersionBanner.tsx
│   │   ├── debug
│   │   │   └── HydrationDebugger.tsx
│   │   └── ui
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── DownloadOptionsModal.tsx
│   │       ├── DownloadReadyModal.tsx
│   │       ├── ErrorState
│   │       │   ├── ErrorState.tsx
│   │       │   ├── QueryStateHandler.tsx
│   │       │   └── index.ts
│   │       ├── FlashcardImage.tsx
│   │       ├── FlashcardSidePanel
│   │       │   ├── FlashcardSidePanel.tsx
│   │       │   └── index.ts
│   │       ├── KeyboardAwareBottomBar.tsx
│   │       ├── KeyboardAwareSurface.tsx
│   │       ├── MarkdownRenderer.tsx
│   │       ├── Notification
│   │       │   ├── Popup.tsx
│   │       │   ├── Toast.tsx
│   │       │   └── ToastContainer.tsx
│   │       ├── PresenceAvatar.tsx
│   │       ├── PresenceDot.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── ShimmerBlock.tsx
│   │       └── SynapticLoader.tsx
│   ├── config
│   │   ├── api.ts
│   │   ├── app.ts
│   │   ├── branding.ts
│   │   ├── environment.ts
│   │   ├── features.ts
│   │   ├── index.ts
│   │   ├── permissions.ts
│   │   ├── routes.ts
│   │   └── storage.ts
│   ├── constants
│   │   └── config.ts
│   ├── features
│   │   ├── about
│   │   │   ├── components
│   │   │   │   ├── AalokProfile.tsx
│   │   │   │   ├── AboutSVGs.tsx
│   │   │   │   ├── AboutUs.tsx
│   │   │   │   ├── DeveloperProfile.tsx
│   │   │   │   ├── TeamMemberProfile.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── admin
│   │   │   ├── api
│   │   │   │   ├── adminApi.ts
│   │   │   │   ├── adminIdiomsApi.ts
│   │   │   │   ├── adminOwsApi.ts
│   │   │   │   └── adminSynonymsApi.ts
│   │   │   ├── app-config
│   │   │   │   └── pages
│   │   │   │       └── AppConfigHub.tsx
│   │   │   ├── components
│   │   │   │   ├── AdminBulkUpdate.tsx
│   │   │   │   ├── AdminBulkUpdateIdioms.tsx
│   │   │   │   ├── AdminBulkUpdateOWS.tsx
│   │   │   │   ├── AdminBulkUpdateSynonyms.tsx
│   │   │   │   ├── AdminEditMaterialModal.tsx
│   │   │   │   ├── AdminEditQuestionModal.tsx
│   │   │   │   ├── AdminEditVocabModal.tsx
│   │   │   │   ├── AdminManageMaterials.tsx
│   │   │   │   ├── AdminReportsQueue.tsx
│   │   │   │   ├── AdminSVGs.tsx
│   │   │   │   ├── AdminUploadGK.tsx
│   │   │   │   ├── AdminUploadIdioms.tsx
│   │   │   │   ├── AdminUploadMaterials.tsx
│   │   │   │   ├── AdminUploadOWS.tsx
│   │   │   │   ├── AdminUploadSynonyms.tsx
│   │   │   │   ├── MutationErrorBanner.tsx
│   │   │   │   └── index.ts
│   │   │   ├── content
│   │   │   │   ├── components
│   │   │   │   │   ├── AdminEditExtractedModal.tsx
│   │   │   │   │   ├── AdminIngestionJob.tsx
│   │   │   │   │   ├── AdminReviewCard.tsx
│   │   │   │   │   └── AdminReviewQueue.tsx
│   │   │   │   ├── pages
│   │   │   │   │   └── AdminContentStudio.tsx
│   │   │   │   ├── services
│   │   │   │   │   ├── contentAdminService.ts
│   │   │   │   │   └── reviewAdminService.ts
│   │   │   │   └── types
│   │   │   │       ├── index.ts
│   │   │   │       └── review.ts
│   │   │   ├── enrichment
│   │   │   │   ├── components
│   │   │   │   │   ├── ActionPanel.tsx
│   │   │   │   │   ├── DLQInspector.tsx
│   │   │   │   │   ├── DLQInspectorModal.tsx
│   │   │   │   │   ├── PhaseLatencyChart.tsx
│   │   │   │   │   ├── PipelineHeroCard.tsx
│   │   │   │   │   ├── ProgressMatrix.tsx
│   │   │   │   │   ├── QualityMetrics.tsx
│   │   │   │   │   ├── QueueIntelligence.tsx
│   │   │   │   │   ├── TaskTuningPanel.tsx
│   │   │   │   │   └── TokenEconomicsPanel.tsx
│   │   │   │   ├── constants
│   │   │   │   │   └── pipelineRegistry.ts
│   │   │   │   ├── hooks
│   │   │   │   │   ├── useEnrichmentMetrics.ts
│   │   │   │   │   ├── useQueueControls.ts
│   │   │   │   │   └── useWordLineage.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── pages
│   │   │   │   │   └── AdminEnrichmentControlCenter.tsx
│   │   │   │   ├── services
│   │   │   │   │   ├── enrichmentAdminService.ts
│   │   │   │   │   └── pipelineMetricsService.ts
│   │   │   │   ├── stores
│   │   │   │   │   └── usePipelineStore.ts
│   │   │   │   ├── types
│   │   │   │   │   └── enrichmentAdmin.ts
│   │   │   │   └── utils
│   │   │   │       └── scoring.ts
│   │   │   ├── hooks
│   │   │   │   ├── useAdminBulkUpdate.ts
│   │   │   │   ├── useAdminBulkUpdateIdioms.ts
│   │   │   │   ├── useAdminBulkUpdateOWS.ts
│   │   │   │   ├── useAdminBulkUpdateSynonyms.ts
│   │   │   │   ├── useAdminUploadGK.ts
│   │   │   │   ├── useAdminUploadIdioms.ts
│   │   │   │   ├── useAdminUploadOWS.ts
│   │   │   │   └── useAdminUploadSynonyms.ts
│   │   │   ├── index.ts
│   │   │   ├── question-builder
│   │   │   │   ├── api
│   │   │   │   │   └── questionBuilderApi.ts
│   │   │   │   ├── components
│   │   │   │   │   ├── QuestionBuilder.tsx
│   │   │   │   │   ├── QuestionFilterBar.tsx
│   │   │   │   │   ├── QuestionPreviewDrawer.tsx
│   │   │   │   │   ├── QuestionResultCard.tsx
│   │   │   │   │   ├── QuestionSearchPanel.tsx
│   │   │   │   │   ├── SelectedQuestionsPanel.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── types
│   │   │   │       └── questionBuilder.types.ts
│   │   │   └── test-series
│   │   │       ├── api
│   │   │       │   └── adminTestSeriesApi.ts
│   │   │       ├── components
│   │   │       │   ├── CategoryCard.tsx
│   │   │       │   ├── CategoryDrawer.tsx
│   │   │       │   ├── ConfirmDialog.tsx
│   │   │       │   ├── EmptyState.tsx
│   │   │       │   ├── KPICard.tsx
│   │   │       │   ├── RightDrawer.tsx
│   │   │       │   ├── SearchBar.tsx
│   │   │       │   ├── SeriesCard.tsx
│   │   │       │   ├── SeriesDrawer.tsx
│   │   │       │   ├── SkeletonLoader.tsx
│   │   │       │   ├── StatusBadge.tsx
│   │   │       │   ├── TestCard.tsx
│   │   │       │   ├── TestDrawer.tsx
│   │   │       │   └── index.ts
│   │   │       ├── hooks
│   │   │       │   ├── index.ts
│   │   │       │   ├── useCategories.ts
│   │   │       │   ├── useSeries.ts
│   │   │       │   └── useTests.ts
│   │   │       └── pages
│   │   │           └── AdminTestSeriesDashboard.tsx
│   │   ├── ai
│   │   │   ├── AIHome.tsx
│   │   │   ├── AIHomeSVGs.tsx
│   │   │   ├── Icons.tsx
│   │   │   ├── chat
│   │   │   │   ├── AIChatPage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── useAIChat.ts
│   │   │   │   ├── useQuota.ts
│   │   │   │   └── utils
│   │   │   │       └── fileProcessing.ts
│   │   │   ├── live
│   │   │   │   ├── LiveConnection.ts
│   │   │   │   └── useLiveSession.ts
│   │   │   └── talk
│   │   │       ├── AITalkPage.tsx
│   │   │       ├── AITalkSummary.tsx
│   │   │       ├── README.md
│   │   │       ├── VoiceBlobVisualizer.tsx
│   │   │       ├── audio-helpers.ts
│   │   │       ├── audio-player.ts
│   │   │       ├── audio-recorder.ts
│   │   │       └── useLiveAPI.ts
│   │   ├── auth
│   │   │   ├── components
│   │   │   │   ├── AuthPage.tsx
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── RestoreAccountModal.tsx
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── SignupPage.tsx
│   │   │   │   ├── SubscriptionPage.tsx
│   │   │   │   ├── SupportPage.tsx
│   │   │   │   └── index.ts
│   │   │   ├── context
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks
│   │   │   │   ├── index.ts
│   │   │   │   └── useProfileStats.ts
│   │   │   ├── index.ts
│   │   │   └── utils
│   │   │       └── cropImage.ts
│   │   ├── blueprints
│   │   │   ├── components
│   │   │   │   ├── BlueprintBuilder.tsx
│   │   │   │   ├── BlueprintPreview.tsx
│   │   │   │   ├── BlueprintPreviewWrapper.tsx
│   │   │   │   └── index.ts
│   │   │   ├── engine
│   │   │   │   └── blueprintMath.ts
│   │   │   ├── index.ts
│   │   │   ├── services
│   │   │   │   ├── blueprintService.ts
│   │   │   │   └── index.ts
│   │   │   └── types
│   │   │       ├── blueprint.ts
│   │   │       └── index.ts
│   │   ├── community
│   │   │   ├── api
│   │   │   │   ├── chatApi.ts
│   │   │   │   ├── communityApi.ts
│   │   │   │   ├── deletionService.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── reportsApi.ts
│   │   │   │   └── uploadMedia.ts
│   │   │   ├── components
│   │   │   │   ├── ChatListSkeleton.tsx
│   │   │   │   ├── CommentSkeleton.tsx
│   │   │   │   ├── CommentThread.tsx
│   │   │   │   ├── ConfirmDeleteModal.tsx
│   │   │   │   ├── CreatePostModal.tsx
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── PostCardSkeleton.tsx
│   │   │   │   ├── ReelSkeleton.tsx
│   │   │   │   ├── ReelUploadModal.tsx
│   │   │   │   ├── SocialHeader.tsx
│   │   │   │   ├── index.ts
│   │   │   │   └── reports
│   │   │   │       ├── BlockUserPromptModal.tsx
│   │   │   │       └── ReportModal.tsx
│   │   │   ├── hooks
│   │   │   │   ├── index.ts
│   │   │   │   ├── useCreatePost.ts
│   │   │   │   ├── useDeletion.ts
│   │   │   │   └── useSocialRealtime.ts
│   │   │   ├── index.ts
│   │   │   ├── pages
│   │   │   │   ├── ChatInputBar.tsx
│   │   │   │   ├── ChatIntro.tsx
│   │   │   │   ├── ChatMessageItem.tsx
│   │   │   │   ├── ChatRooms.tsx
│   │   │   │   ├── CommunityFeed.tsx
│   │   │   │   ├── CommunitySearch.tsx
│   │   │   │   ├── PostPage.tsx
│   │   │   │   ├── ReelCommentsPage.tsx
│   │   │   │   ├── ReelsFeed.tsx
│   │   │   │   └── UserProfile.tsx
│   │   │   ├── stores
│   │   │   │   └── useSocialStore.ts
│   │   │   └── utils
│   │   │       └── errorTranslation.ts
│   │   ├── dashboard
│   │   │   ├── components
│   │   │   │   ├── DashboardGreeting.tsx
│   │   │   │   ├── DashboardHeader.tsx
│   │   │   │   ├── ImportantForSscStrip.tsx
│   │   │   │   ├── QuickActionsGrid.tsx
│   │   │   │   ├── SubjectStrip.tsx
│   │   │   │   ├── SuggestedDrillCard.tsx
│   │   │   │   ├── UserProgressCard.tsx
│   │   │   │   └── subject
│   │   │   │       ├── ActionCard.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       ├── QuizStartBottomSheet.tsx
│   │   │   │       ├── SubjectHeader.tsx
│   │   │   │       ├── SubjectSkeleton.tsx
│   │   │   │       ├── TopicCard.tsx
│   │   │   │       └── TopicCardContainer.tsx
│   │   │   ├── constants
│   │   │   │   └── sscDashboardConfig.ts
│   │   │   ├── index.ts
│   │   │   ├── pages
│   │   │   │   ├── SubjectsPage.tsx
│   │   │   │   └── subject
│   │   │   │       ├── SubjectHubPage.tsx
│   │   │   │       └── SubjectTopicsPage.tsx
│   │   │   └── services
│   │   │       └── subjectService.ts
│   │   ├── english
│   │   │   ├── components
│   │   │   │   ├── placeholders
│   │   │   │   │   ├── ComingSoonPlaceholder.tsx
│   │   │   │   │   ├── GrammarComingSoon.tsx
│   │   │   │   │   └── MockComingSoon.tsx
│   │   │   │   └── workspace
│   │   │   │       ├── ContinueLearningBanner.tsx
│   │   │   │       ├── DomainStatsRow.tsx
│   │   │   │       ├── QuickActionsGrid.tsx
│   │   │   │       └── index.ts
│   │   │   ├── constants
│   │   │   │   └── EnglishTabs.ts
│   │   │   ├── index.ts
│   │   │   └── pages
│   │   │       └── EnglishHub.tsx
│   │   ├── flashcards
│   │   │   ├── components
│   │   │   │   ├── FlashcardSummary.tsx
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   └── utils
│   │   │       └── pdfGenerator.ts
│   │   ├── intro
│   │   │   ├── IntroEngine.tsx
│   │   │   ├── index.ts
│   │   │   ├── modules
│   │   │   │   ├── blue
│   │   │   │   │   ├── BlueIntro.css
│   │   │   │   │   └── BlueIntro.tsx
│   │   │   │   ├── minimal-fade
│   │   │   │   │   └── MinimalFadeIntro.tsx
│   │   │   │   └── particle
│   │   │   │       └── ParticleIntro.tsx
│   │   │   └── registry
│   │   │       ├── IntroRegistry.ts
│   │   │       ├── index.ts
│   │   │       └── types.ts
│   │   ├── mock-tests
│   │   │   ├── api
│   │   │   │   └── mockTestsApi.ts
│   │   │   ├── components
│   │   │   │   ├── BrandedThumbnail.tsx
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── Skeletons.tsx
│   │   │   └── pages
│   │   │       ├── ExamCategoriesPage.tsx
│   │   │       ├── ExamPlaceholderPage.tsx
│   │   │       ├── TestDetailPage.tsx
│   │   │       ├── TestSeriesPage.tsx
│   │   │       └── TestsListPage.tsx
│   │   ├── notifications
│   │   │   ├── admin
│   │   │   │   ├── AdminEditNotificationModal.tsx
│   │   │   │   └── AdminNotifications.tsx
│   │   │   ├── components
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   ├── NotificationSettings.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks
│   │   │   │   ├── index.ts
│   │   │   │   ├── useNotificationPreferences.ts
│   │   │   │   ├── useNotifications.ts
│   │   │   │   └── usePushNotifications.ts
│   │   │   ├── index.ts
│   │   │   └── types
│   │   │       └── index.ts
│   │   ├── onboarding
│   │   │   └── pages
│   │   │       └── OnboardingFlow.tsx
│   │   ├── quiz
│   │   │   ├── components
│   │   │   │   ├── AiExplanationButton.tsx
│   │   │   │   ├── AttemptedQuizCard.tsx
│   │   │   │   ├── AttemptedQuizzesList.tsx
│   │   │   │   ├── CookingLoader.tsx
│   │   │   │   ├── DashboardSVGs.tsx
│   │   │   │   ├── GodQuizResult.tsx
│   │   │   │   ├── Landing
│   │   │   │   │   ├── AnimatedLogo.tsx
│   │   │   │   │   ├── DemoCard.tsx
│   │   │   │   │   ├── MobileDemoCard.tsx
│   │   │   │   │   ├── Typewriter.tsx
│   │   │   │   │   └── WelcomeIntro.tsx
│   │   │   │   ├── MockQuizResult.tsx
│   │   │   │   ├── PerformanceAnalytics.tsx
│   │   │   │   ├── QuestionSolutionCard.tsx
│   │   │   │   ├── QuizBottomNav.tsx
│   │   │   │   ├── QuizBreadcrumbs.tsx
│   │   │   │   ├── QuizConfig.tsx
│   │   │   │   ├── QuizExplanation.tsx
│   │   │   │   ├── QuizLibrary.tsx
│   │   │   │   ├── QuizLibraryToolbar.tsx
│   │   │   │   ├── QuizNavigationPanel.tsx
│   │   │   │   ├── QuizOption.test.tsx
│   │   │   │   ├── QuizOption.tsx
│   │   │   │   ├── QuizOverallProgress.tsx
│   │   │   │   ├── QuizProgress.tsx
│   │   │   │   ├── QuizQuestionDisplay.tsx
│   │   │   │   ├── QuizQuestionHeader.tsx
│   │   │   │   ├── QuizResult.tsx
│   │   │   │   ├── QuizResultBase.tsx
│   │   │   │   ├── QuizReview.tsx
│   │   │   │   ├── QuizSessionGuard.tsx
│   │   │   │   ├── QuizStats.tsx
│   │   │   │   ├── ResultGuard.tsx
│   │   │   │   ├── SavedQuizCard.tsx
│   │   │   │   ├── SavedQuizzesList.tsx
│   │   │   │   ├── ShareGatekeeper.tsx
│   │   │   │   ├── archive
│   │   │   │   │   ├── AnimatedCounter.tsx
│   │   │   │   │   ├── DonutChart.tsx
│   │   │   │   │   ├── QuizResult.tsx
│   │   │   │   │   └── README.md
│   │   │   │   ├── index.ts
│   │   │   │   └── ui
│   │   │   │       ├── Accordion.tsx
│   │   │   │       ├── ActiveFiltersBar.tsx
│   │   │   │       ├── ClaymorphismSwitch.css
│   │   │   │       ├── ClaymorphismSwitch.tsx
│   │   │   │       ├── FilterGroup.tsx
│   │   │   │       ├── InstallPWA.tsx
│   │   │   │       ├── MultiSelectDropdown.tsx
│   │   │   │       ├── QuickStartButtons.tsx
│   │   │   │       ├── QuizSettingsModal.tsx
│   │   │   │       ├── ScrollableCapsules.tsx
│   │   │   │       ├── SegmentedControl.tsx
│   │   │   │       ├── SettingsModal.tsx
│   │   │   │       └── SettingsToggle.tsx
│   │   │   ├── context
│   │   │   │   ├── QuizContext.tsx
│   │   │   │   └── index.ts
│   │   │   ├── data
│   │   │   │   ├── Synonym data.json
│   │   │   │   ├── idioms.json
│   │   │   │   ├── ows.json
│   │   │   │   ├── questions.ts
│   │   │   │   ├── starterDiagnosticQuestions.ts
│   │   │   │   ├── validate_synonyms_data.js
│   │   │   │   └── validation_report.json
│   │   │   ├── engine
│   │   │   │   ├── TestEngineController.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── plugins
│   │   │   │   │   ├── mcqPlugin.ts
│   │   │   │   │   └── synonymPlugin.ts
│   │   │   │   ├── quizEngine.ts
│   │   │   │   ├── quizPlugin.ts
│   │   │   │   └── timerWorker.ts
│   │   │   ├── hooks
│   │   │   │   ├── index.ts
│   │   │   │   ├── useAntiCheat.ts
│   │   │   │   ├── useDependentFilters.ts
│   │   │   │   ├── useFilterCounts.ts
│   │   │   │   ├── useGodSessionTimer.ts
│   │   │   │   ├── useLearningTimer.ts
│   │   │   │   ├── useMockSessionTimer.ts
│   │   │   │   ├── useMockTimer.ts
│   │   │   │   ├── useOptimizedFilterCounts.ts
│   │   │   │   ├── usePerformanceAnalytics.ts
│   │   │   │   ├── useQuestionIndex.ts
│   │   │   │   ├── useQuestionMetadata.ts
│   │   │   │   ├── useQuiz.ts
│   │   │   │   ├── useQuizProgress.ts
│   │   │   │   ├── useQuizSessionTimer.ts
│   │   │   │   ├── useQuizSounds.ts
│   │   │   │   ├── useTextToSpeech.test.tsx
│   │   │   │   └── useTextToSpeech.ts
│   │   │   ├── index.ts
│   │   │   ├── layouts
│   │   │   │   ├── ActiveQuizLayout.tsx
│   │   │   │   └── index.ts
│   │   │   ├── learning
│   │   │   │   └── LearningSession.tsx
│   │   │   ├── live
│   │   │   │   ├── LiveQuizRoom.tsx
│   │   │   │   └── useGenAILive.ts
│   │   │   ├── mock
│   │   │   │   ├── GodModeSession.tsx
│   │   │   │   └── MockSession.tsx
│   │   │   ├── pages
│   │   │   │   └── UploadCustomQuizPage.tsx
│   │   │   ├── services
│   │   │   │   ├── analyticsService.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── questionService.ts
│   │   │   │   ├── quizCreationService.ts
│   │   │   │   └── quizProgressService.ts
│   │   │   ├── stores
│   │   │   │   ├── quizReducer.test.ts
│   │   │   │   ├── quizReducer.ts
│   │   │   │   ├── useAnalyticsStore.ts
│   │   │   │   ├── useBookmarkStore.ts
│   │   │   │   ├── useFlashcardStore.ts
│   │   │   │   ├── useQuizSessionStore.ts
│   │   │   │   ├── useQuizSettingsStore.ts
│   │   │   │   └── useSyncStore.ts
│   │   │   ├── types
│   │   │   │   ├── index.ts
│   │   │   │   └── store.ts
│   │   │   ├── utils
│   │   │   │   └── adminMaterialUtils.ts
│   │   │   └── workers
│   │   │       └── filterWorker.ts
│   │   ├── school
│   │   │   ├── SchoolDownloads.tsx
│   │   │   ├── SchoolSVGs.tsx
│   │   │   └── index.ts
│   │   ├── settings
│   │   │   ├── components
│   │   │   │   ├── AppPreferencesPage.tsx
│   │   │   │   ├── DeleteAccountPage.tsx
│   │   │   │   ├── MyReportsPage.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── tools
│   │   │   ├── ToolsHome.tsx
│   │   │   ├── ToolsSVGs.tsx
│   │   │   ├── ascii-art
│   │   │   │   ├── AsciiArtHub.tsx
│   │   │   │   ├── invisible-ink
│   │   │   │   │   └── InvisibleInk.tsx
│   │   │   │   ├── number-art
│   │   │   │   │   └── NumberArt.tsx
│   │   │   │   └── stego
│   │   │   │       └── MyStego.tsx
│   │   │   ├── bilingual-pdf-maker
│   │   │   │   ├── BilingualPdfMaker.tsx
│   │   │   │   └── utils
│   │   │   │       └── pdfGenerator.ts
│   │   │   ├── flashcard-maker
│   │   │   │   ├── FlashcardMaker.tsx
│   │   │   │   ├── components
│   │   │   │   │   ├── Editor.tsx
│   │   │   │   │   └── Preview.tsx
│   │   │   │   ├── types.ts
│   │   │   │   └── utils
│   │   │   │       └── canvasDrawing.ts
│   │   │   ├── quiz-pdf-ppt-generator
│   │   │   │   ├── QuizPdfPptGenerator.tsx
│   │   │   │   ├── components
│   │   │   │   │   └── GeneratorModal.tsx
│   │   │   │   └── utils
│   │   │   │       ├── pdfGenerator.ts
│   │   │   │       └── pptGenerator.ts
│   │   │   └── text-exporter
│   │   │       └── TextExporter.tsx
│   │   └── vocab
│   │       ├── components
│   │       │   ├── DeckSession.tsx
│   │       │   ├── DeckSessionGuard.tsx
│   │       │   ├── VocabLibrary.tsx
│   │       │   └── VocabResult.tsx
│   │       ├── hooks
│   │       │   ├── useAdminDeleteVocab.ts
│   │       │   └── useAdminEditVocab.ts
│   │       ├── idioms
│   │       │   ├── IdiomsConfig.tsx
│   │       │   ├── IdiomsHub.tsx
│   │       │   ├── components
│   │       │   │   ├── IdiomCard.tsx
│   │       │   │   ├── IdiomNavigationPanel.tsx
│   │       │   │   ├── IdiomSession.tsx
│   │       │   │   └── index.ts
│   │       │   ├── hooks
│   │       │   │   ├── index.ts
│   │       │   │   ├── useIdiomFilterCounts.ts
│   │       │   │   └── useIdiomProgress.ts
│   │       │   ├── index.ts
│   │       │   └── utils
│   │       │       └── supabaseIdioms.ts
│   │       ├── ows
│   │       │   ├── OWSConfig.tsx
│   │       │   ├── OWSHub.tsx
│   │       │   ├── components
│   │       │   │   ├── OWSCard.tsx
│   │       │   │   ├── OWSNavigationPanel.tsx
│   │       │   │   ├── OWSSession.tsx
│   │       │   │   └── index.ts
│   │       │   ├── hooks
│   │       │   │   ├── index.ts
│   │       │   │   ├── useOWSProgress.ts
│   │       │   │   └── useOwsFilterCounts.ts
│   │       │   ├── index.ts
│   │       │   └── utils
│   │       │       ├── pdfGenerator.ts
│   │       │       └── supabaseOws.ts
│   │       ├── services
│   │       │   └── deckService.ts
│   │       ├── stores
│   │       │   └── useDeckSessionStore.ts
│   │       ├── synonyms
│   │       │   ├── SynapticLoader.tsx
│   │       │   ├── Synonym.html
│   │       │   ├── SynonymsConfig.tsx
│   │       │   ├── SynonymsHub.tsx
│   │       │   ├── components
│   │       │   │   ├── ConnectGame.tsx
│   │       │   │   ├── ImposterGame.tsx
│   │       │   │   ├── SpeedGame.tsx
│   │       │   │   ├── SynonymCard.tsx
│   │       │   │   ├── SynonymClusterList.tsx
│   │       │   │   ├── SynonymFlashcardSession.tsx
│   │       │   │   ├── SynonymNavigationPanel.tsx
│   │       │   │   ├── SynonymPhase1Session.tsx
│   │       │   │   ├── SynonymQuizSession.tsx
│   │       │   │   ├── SynonymsSVGs.tsx
│   │       │   │   ├── WordDetailModal.tsx
│   │       │   │   └── index.ts
│   │       │   ├── hooks
│   │       │   │   ├── index.ts
│   │       │   │   ├── useSynonymFilterCounts.ts
│   │       │   │   ├── useSynonymProgress.ts
│   │       │   │   └── useSynonymsData.ts
│   │       │   ├── index.ts
│   │       │   ├── services
│   │       │   │   ├── index.ts
│   │       │   │   └── synonymService.ts
│   │       │   └── utils
│   │       │       ├── pdfGenerator.ts
│   │       │       └── supabaseSynonyms.ts
│   │       └── types
│   │           ├── deck.ts
│   │           └── index.ts
│   ├── hooks
│   │   ├── index.ts
│   │   ├── useAppBootstrap.ts
│   │   ├── useAppVisibilityReawakening.ts
│   │   ├── useHardwareBackButton.ts
│   │   ├── useJSONDownloader.spec.ts
│   │   ├── useJSONDownloader.ts
│   │   ├── useLocalStorageState.test.ts
│   │   ├── useLocalStorageState.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useNavSpinner.ts
│   │   ├── useNotification.ts
│   │   ├── usePDFGenerator.ts
│   │   ├── usePWAInstall.ts
│   │   ├── useScrollDirection.ts
│   │   ├── useSound.test.ts
│   │   ├── useSound.ts
│   │   └── useTimer.ts
│   ├── index.css
│   ├── index.tsx
│   ├── layouts
│   │   ├── AppLayout.tsx
│   │   ├── MainLayout.tsx
│   │   └── SidePanel.tsx
│   ├── lib
│   │   ├── db.ts
│   │   ├── fetchWithTimeout.test.ts
│   │   ├── fetchWithTimeout.ts
│   │   ├── haptics.test.ts
│   │   ├── haptics.ts
│   │   ├── navigation
│   │   │   ├── NavigationManager.tsx
│   │   │   ├── index.ts
│   │   │   ├── policies
│   │   │   │   ├── AuthPolicy.ts
│   │   │   │   ├── IntentPolicy.ts
│   │   │   │   ├── OnboardingPolicy.ts
│   │   │   │   └── PlatformPolicy.ts
│   │   │   ├── types.ts
│   │   │   └── utils
│   │   │       ├── analytics.ts
│   │   │       └── logger.ts
│   │   ├── runtimeConfig.ts
│   │   ├── supabase.ts
│   │   ├── syncService.ts
│   │   └── tools
│   │       ├── downloadHelper.ts
│   │       ├── invisibleInk.ts
│   │       ├── numberArt.ts
│   │       └── stego.ts
│   ├── pages
│   │   ├── AdminHomePage.tsx
│   │   ├── BookmarksPage.tsx
│   │   ├── DailyMissionPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EnglishQuizHomePage.tsx
│   │   ├── ExamBlueprintsHubPage.tsx
│   │   ├── McqsQuizHomePage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   ├── SchoolHomePage.tsx
│   │   ├── TermsOfUse.tsx
│   │   └── TodaysPlanPage.tsx
│   ├── providers
│   │   ├── AppProvider.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── PresenceProvider.tsx
│   │   └── ThemeAndBrandingInjector.tsx
│   ├── routes
│   │   └── AppRoutes.tsx
│   ├── services
│   │   └── mediaUploadService.ts
│   ├── stores
│   │   ├── useAppConfigStore.ts
│   │   ├── useDebugStore.ts
│   │   ├── useLayoutStore.ts
│   │   ├── useNotificationStore.ts
│   │   ├── usePresenceStore.ts
│   │   └── useSettingsStore.ts
│   ├── types
│   │   ├── mammoth.d.ts
│   │   └── models.ts
│   ├── utils
│   │   ├── avatar.test.ts
│   │   ├── avatar.ts
│   │   ├── cn.test.ts
│   │   ├── cn.ts
│   │   ├── html.test.ts
│   │   ├── html.ts
│   │   ├── learning
│   │   │   ├── index.ts
│   │   │   └── statusColors.ts
│   │   ├── platform.test.ts
│   │   ├── platform.ts
│   │   ├── withTimeout.test.ts
│   │   └── withTimeout.ts
│   └── vite-env.d.ts
├── supabase
│   ├── functions
│   │   ├── _shared
│   │   │   └── ai
│   │   │       ├── governance.ts
│   │   │       ├── providers
│   │   │       │   └── gemini.ts
│   │   │       └── telemetry.ts
│   │   ├── ask-ai-tutor
│   │   │   └── index.ts
│   │   ├── chat-ai
│   │   │   ├── deno.json
│   │   │   └── index.ts
│   │   ├── enrich-synonyms
│   │   │   └── index.ts
│   │   ├── push-notifications
│   │   │   ├── deno.json
│   │   │   └── index.ts
│   │   └── tts-gateway
│   │       ├── deno.json
│   │       └── index.ts
│   └── migrations
│       ├── 20240101000000_create_chat_message_likes.sql
│       ├── 20240101000000_soft_delete_and_rpc.sql
│       ├── 20240311000000_create_user_synonym_interactions.sql
│       ├── 20240401000000_create_reels_tables.sql
│       ├── 20240401000001_seed_reels_data.sql
│       ├── 20250328_notification_system.sql
│       ├── 20250328_notification_system_fix.sql
│       ├── 20250329000000_deduplicate_idioms.sql
│       ├── 20250329000001_deduplicate_idioms_by_phrase.sql
│       ├── 20250401000000_account_deletion.sql
│       ├── 20250401000001_account_deletion_rpc.sql
│       ├── 20250501000000_community_blocking.sql
│       ├── 20250510000000_create_reporting_system.sql
│       ├── 20250511000000_create_user_active_sessions.sql
│       ├── 20250512000000_add_delete_policy_user_active_sessions.sql
│       ├── 20250512000000_export_user_data_rpc.sql
│       ├── 20250601000000_add_image_url_to_idioms.sql
│       ├── 20250602000000_add_idiom_admin_rls.sql
│       ├── 20260513081332_update_reels_policies_and_feed_rpc.sql
│       ├── 20260516000000_quiz_hard_delete_cron.sql
│       ├── 20260516200010_create_quiz_session_rpc_and_cleanup.sql
│       ├── 20260517000000_clone_shared_quiz_rpc.sql
│       ├── 20260517000001_submit_quiz_session_rpc.sql
│       ├── 20260517000001_update_clone_shared_quiz_rpc.sql
│       ├── 20260517000002_fix_clone_shared_quiz_rpc.sql
│       ├── 20260517094911_cleanup_orphaned_bridge_rows.sql
│       ├── 20260517100000_create_analytics_events.sql
│       ├── 20260517100001_fix_submit_rpc.sql
│       ├── 20260517100002_make_rpc_idempotent.sql
│       ├── 20260517100003_add_relational_status.sql
│       ├── 20260517100004_fix_rpc_accuracy_type.sql
│       ├── 20260517100005_update_user_synonym_interactions.sql
│       ├── 20260601000000_enrichment_admin_control_center.sql
│       ├── 20260626000000_enable_delta_sync.sql
│       ├── 20260626174800_add_questions_delta_sync.sql
│       ├── 20260627000000_add_ows_synonym_admin_rls.sql
│       ├── 20260702100000_ai_governance_atomic_quota.sql
│       ├── 20260705000000_create_mock_tests_system.sql
│       ├── 20260706000000_update_enrichment_admin.sql
│       ├── 20260706000001_update_enrichment_dlq_schema.sql
│       ├── 20260707000000_questions_soft_deletes.sql
│       ├── 20260707000001_questions_tombstones.sql
│       ├── 20260801000000_ai_pipeline_observability.sql
│       ├── 20260901000000_create_app_ui_config.sql
│       ├── 20260901000001_fix_app_ui_config_rls.sql
│       ├── 20261011055349_create_branding_storage.sql
│       └── 20261013160000_system_logs_maintenance.sql
├── tailwind.config.js
├── tsconfig.json
├── tts-gateway-bundle.ts
├── utils
│   └── cn.ts
├── vite.config.ts
└── vitest.config.ts

256 directories, 808 files
```
