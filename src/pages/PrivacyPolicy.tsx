import React from 'react';
import { ChevronLeft, Home, Shield, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Privacy Policy</h1>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="min-h-[44px] px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    aria-label="Back to Home"
                >
                     <Home className="w-5 h-5" />
                     <span className="hidden sm:inline text-sm font-medium">Home</span>
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
                <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                            <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MindFlow Privacy Policy</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Version 2.1 • Effective November 2024</p>
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6 text-sm md:text-base leading-relaxed">
                        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Notice under Indian DPDP Act 2023 (Section 5)
                            </h4>
                            <p className="text-xs text-indigo-800/90 dark:text-indigo-200/90 leading-relaxed">
                                MindFlow processes user data (email, full name, learning telemetry, mistake notebook entries) solely to deliver adaptive competitive mock drills, maintain learning streaks, and manage authentication. Personal data is never sold or used for cross-site behavioral advertising.
                            </p>
                        </div>

                        <p>
                            Welcome to MindFlow. Your privacy is critically important to us. This Privacy Policy outlines how we collect, use, and protect your information when you use our application.
                        </p>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Information We Collect</h3>
                            <p>We collect information to provide better services to all our users. The types of information we collect include:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Account Information:</strong> When you register an account, we store your email address and display name via Supabase PostgreSQL infrastructure.</li>
                                <li><strong>Usage & Learning Telemetry:</strong> We collect your quiz scores, accuracy percentages, timing analytics, and saved bookmarks to personalize mock generation.</li>
                                <li><strong>Local Storage & IndexedDB:</strong> MindFlow uses offline-first local browser storage (IndexedDB) to cache quiz history and settings with 0ms latency.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. How We Use Your Information</h3>
                            <p>We use the information we collect for the following purposes:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>To provide, maintain, and personalize the MindFlow academic preparation experience.</li>
                                <li>To track learning streaks, diagnostic sprints, and mistake notebook remediation.</li>
                                <li>To power AI-driven features, such as personalized tutoring and voice interactions.</li>
                                <li>To synchronize your offline progress securely across devices upon reconnecting.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Artificial Intelligence and Third-Party Services</h3>
                            <p>
                                MindFlow integrates with the <strong>Google Gemini API</strong> to provide advanced features like AI explanations and interactive tutoring.
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>When utilizing AI features, question contexts are processed securely on Google's infrastructure.</li>
                                <li>Never include passwords, financial data, or sensitive personal identifiers in prompt inputs.</li>
                                <li>Supabase provides database management and authentication with strict Row-Level Security (RLS) enforcement.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Data Security</h3>
                            <p>
                                We implement industry-standard cryptographic measures to protect your personal data. All sensitive communications utilize TLS/SSL encryption. Database access enforces RLS policies so users can only access their own data.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. Data Retention, Correction and Deletion (DPDP Act 2023)</h3>
                            <p>
                                Under Section 11 of the DPDP Act 2023, you retain full rights to review, update, or permanently delete your account and associated learning telemetry.
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Self-Service Account Deletion:</strong> You can delete your account directly in Settings &gt; Developer &gt; Delete Account.</li>
                                <li>Upon request, all profile records, quiz history, and associated data are irrevocably purged within 30 days.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">6. Statutory Grievance Redressal Officer (Section 8)</h3>
                            <p>
                                In accordance with the Digital Personal Data Protection Act 2023, the designated Grievance Redressal Officer details are:
                            </p>
                            <div className="mt-2 p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm space-y-1">
                                <p><strong>Officer Designation:</strong> Grievance Redressal Officer (Data Protection)</p>
                                <p className="flex items-center gap-1.5">
                                    <Mail className="w-4 h-4 text-indigo-500" />
                                    <span>Official Contact: </span>
                                    <a href="mailto:support@mindflow.com?subject=Attn:%20Grievance%20Redressal%20Officer%20-%20Data%20Protection" className="text-indigo-600 dark:text-indigo-400 font-medium underline">
                                        support@mindflow.com
                                    </a>
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">Statutory Redressal SLA: Acknowledgement within 24 hours, resolution within 48 business hours.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">7. Changes to This Privacy Policy</h3>
                            <p>
                                We review our compliance periodically. Material revisions will be posted with updated effective versions and prominent notice.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
