import React from 'react';
import { ChevronLeft, User, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AboutUs: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">About Us</h1>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-8 space-y-8">

                {/* Developer Profile Section */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                            <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Developer Profile</h2>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 space-y-4 leading-relaxed">
                        <p>
                            MindFlow is developed with a passion for creating accessible and engaging learning tools. Our mission is to empower learners through interactive quizzes, rich vocabulary builders, and AI-driven insights.
                        </p>
                        <p>
                            We believe in continuous learning and aim to provide a seamless, intuitive experience to help you achieve your educational goals.
                        </p>
                    </div>
                </section>

                {/* Privacy Policy Section */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 space-y-4 leading-relaxed text-sm">
                        <p className="font-semibold italic">Last updated: {new Date().toLocaleDateString()}</p>
                        <p>
                            This Privacy Policy is published in accordance with the provisions of the Information Technology Act, 2000 ("IT Act") and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 ("SPDI Rules").
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">1. Collection of Information</h3>
                        <p>
                            We collect personal information such as your name, email address, and learning progress to provide you with a personalized experience. We also collect non-personal data such as usage statistics and device information to improve our services.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">2. Use of Information</h3>
                        <p>
                            The information collected is strictly used for providing, maintaining, and improving the MindFlow app. We do not sell, rent, or trade your personal information to third parties. Your data is used to tailor content, analyze app performance, and manage your account.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">3. Data Security & Storage</h3>
                        <p>
                            We employ industry-standard security measures, including encryption and secure servers, to protect your data against unauthorized access, alteration, or destruction. We retain your information only for as long as necessary for the purposes outlined in this policy or as required by Indian law.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">4. User Rights & Grievance Officer</h3>
                        <p>
                            Under the IT Act and SPDI Rules, you have the right to review, update, or request deletion of your personal data. For any privacy-related concerns or grievances, please contact our Grievance Officer via the support channels provided in the app. We are committed to resolving your concerns within the timeframes stipulated by applicable laws.
                        </p>
                    </div>
                </section>

                {/* Terms of Use Section */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                            <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Use</h2>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 space-y-4 leading-relaxed text-sm">
                        <p>
                            Welcome to MindFlow. By accessing or using our application, you agree to comply with and be bound by the following Terms of Use, which are governed by the laws of India.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">1. Acceptance of Terms</h3>
                        <p>
                            By registering an account or using the app, you acknowledge that you have read, understood, and agree to these terms. If you do not agree with any part of these terms, you must discontinue the use of the app immediately.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">2. User Conduct</h3>
                        <p>
                            You agree to use the application strictly for lawful purposes. You shall not engage in any activity that disrupts, damages, or interferes with the functioning of the app or its servers. Any unauthorized access or attempt to reverse-engineer the app is strictly prohibited.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">3. Intellectual Property Rights</h3>
                        <p>
                            All content, trademarks, logos, and intellectual property associated with MindFlow are the exclusive property of its developers. You may not reproduce, distribute, or create derivative works from our content without explicit written permission.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">4. Limitation of Liability</h3>
                        <p>
                            MindFlow is provided on an "as is" and "as available" basis. While we strive for accuracy, we make no warranties regarding the completeness, reliability, or accuracy of the content. We shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the app.
                        </p>
                        <h3 className="font-bold text-gray-900 dark:text-white mt-4">5. Governing Law and Jurisdiction</h3>
                        <p>
                            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
};
