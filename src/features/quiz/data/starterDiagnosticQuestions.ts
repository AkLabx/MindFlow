import { Question } from '@/types/models';

export const STARTER_DIAGNOSTIC_QUESTIONS: Question[] = [
  {
    id: 'starter-1',
    sourceInfo: {
      examName: 'SSC CGL',
      examYear: 2023
    },
    classification: {
      subject: 'Polity',
      topic: 'Constitution',
      subTopic: 'Fundamental Rights'
    },
    tags: ['Polity', 'Constitution', 'Fundamental Rights'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'Which Article of the Indian Constitution is related to the Abolition of Untouchability?',
    question_hi: 'भारतीय संविधान का कौन सा अनुच्छेद अस्पृश्यता के उन्मूलन से संबंधित है?',
    options: ['Article 15', 'Article 16', 'Article 17', 'Article 18'],
    options_hi: ['अनुच्छेद 15', 'अनुच्छेद 16', 'अनुच्छेद 17', 'अनुच्छेद 18'],
    correct: 'Article 17',
    explanation: {
      summary: 'Article 17 of the Indian Constitution deals with the abolition of untouchability.',
      analysis_correct: 'Article 17 abolishes "untouchability" and its practice in any form is forbidden.',
      analysis_incorrect: 'Article 15 deals with discrimination on grounds of religion, race, caste, sex or place of birth. Article 16 deals with equality of opportunity in public employment. Article 18 deals with the abolition of titles.',
      conclusion: 'Therefore, Article 17 is the correct answer.',
      fact: 'The Protection of Civil Rights Act, 1955, prescribes punishment for the preaching and practice of "Untouchability" for the enforcement of any disability arising therefrom.'
    }
  },
  {
    id: 'starter-2',
    sourceInfo: {
      examName: 'SSC CHSL',
      examYear: 2022
    },
    classification: {
      subject: 'History',
      topic: 'Modern History',
      subTopic: 'Indian National Movement'
    },
    tags: ['History', 'Modern History', 'Indian National Movement'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'Who founded the Ramakrishna Mission in 1897?',
    question_hi: '1897 में रामकृष्ण मिशन की स्थापना किसने की थी?',
    options: ['Swami Vivekananda', 'Ramakrishna Paramahamsa', 'Raja Ram Mohan Roy', 'Dayananda Saraswati'],
    options_hi: ['स्वामी विवेकानंद', 'रामकृष्ण परमहंस', 'राजा राम मोहन राय', 'दयानंद सरस्वती'],
    correct: 'Swami Vivekananda',
    explanation: {
      summary: 'Swami Vivekananda founded the Ramakrishna Mission in 1897.',
      analysis_correct: 'Swami Vivekananda, the chief disciple of the 19th-century Indian mystic Ramakrishna, established the mission to carry out philanthropic and spiritual activities.',
      analysis_incorrect: 'Ramakrishna Paramahamsa was Vivekananda\'s guru. Raja Ram Mohan Roy founded the Brahmo Samaj. Dayananda Saraswati founded the Arya Samaj.',
      conclusion: 'Swami Vivekananda is the founder.',
      fact: 'The headquarters of the Ramakrishna Math and Ramakrishna Mission are situated at an area named Belur in the district of Howrah, West Bengal.'
    }
  },
  {
    id: 'starter-3',
    sourceInfo: {
      examName: 'SSC CPO',
      examYear: 2021
    },
    classification: {
      subject: 'Geography',
      topic: 'Physical Geography',
      subTopic: 'Rivers'
    },
    tags: ['Geography', 'Physical Geography', 'Rivers'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'Majuli, the largest river island in the world, is located on which river?',
    question_hi: 'दुनिया का सबसे बड़ा नदी द्वीप माजुली किस नदी पर स्थित है?',
    options: ['Ganga', 'Brahmaputra', 'Godavari', 'Indus'],
    options_hi: ['गंगा', 'ब्रह्मपुत्र', 'गोदावरी', 'सिंधु'],
    correct: 'Brahmaputra',
    explanation: {
      summary: 'Majuli island is situated on the Brahmaputra River in Assam.',
      analysis_correct: 'Majuli is a river island in the Brahmaputra River, Assam and in 2016 it became the first island to be made a district in India.',
      analysis_incorrect: 'It is not located on Ganga, Godavari or Indus rivers.',
      conclusion: 'The correct river is Brahmaputra.',
      fact: 'Majuli shrank from 1,250 square kilometres in 1890 to only 352 square kilometres in 2014, due to erosion.'
    }
  },
  {
    id: 'starter-4',
    sourceInfo: {
      examName: 'SSC MTS',
      examYear: 2020
    },
    classification: {
      subject: 'Science',
      topic: 'Biology',
      subTopic: 'Human Body'
    },
    tags: ['Science', 'Biology', 'Human Body'],
    properties: {
      difficulty: 'Easy',
      questionType: 'MCQ'
    },
    question: 'Which is the largest gland in the human body?',
    question_hi: 'मानव शरीर की सबसे बड़ी ग्रंथि कौन सी है?',
    options: ['Liver', 'Pancreas', 'Thyroid', 'Pituitary'],
    options_hi: ['यकृत (Liver)', 'अग्न्याशय (Pancreas)', 'थायरॉयड (Thyroid)', 'पीयूष (Pituitary)'],
    correct: 'Liver',
    explanation: {
      summary: 'The liver is the largest internal organ and the largest gland in the human body.',
      analysis_correct: 'The liver carries out over 500 essential tasks, including producing bile and regulating chemical levels in the blood.',
      analysis_incorrect: 'The pancreas is an organ of the digestive system and endocrine system. The thyroid is a butterfly-shaped gland in the neck. The pituitary is a pea-sized gland at the base of the brain.',
      conclusion: 'Liver is the correct answer.',
      fact: 'The liver is the only visceral organ that possesses the remarkable capacity to regenerate.'
    }
  },
  {
    id: 'starter-5',
    sourceInfo: {
      examName: 'SSC CGL',
      examYear: 2022
    },
    classification: {
      subject: 'English',
      topic: 'Vocabulary',
      subTopic: 'One Word Substitution'
    },
    tags: ['English', 'Vocabulary', 'OWS'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'Select the word which means the same as the group of words given: "A person who is indifferent to the pains and pleasures of life."',
    question_hi: 'उस शब्द का चयन करें जिसका अर्थ दिए गए शब्दों के समूह के समान है: "एक व्यक्ति जो जीवन के दर्द और सुख के प्रति उदासीन है।"',
    options: ['Stoic', 'Sadist', 'Psychiatrist', 'Aristocrat'],
    options_hi: ['Stoic', 'Sadist', 'Psychiatrist', 'Aristocrat'],
    correct: 'Stoic',
    explanation: {
      summary: 'A "stoic" is a person who can endure pain or hardship without showing their feelings or complaining.',
      analysis_correct: 'Stoic perfectly fits the description of being indifferent to pain and pleasure.',
      analysis_incorrect: 'A sadist derives pleasure from inflicting pain. A psychiatrist is a medical practitioner specializing in mental illness. An aristocrat is a member of the aristocracy.',
      conclusion: 'Stoic is the correct substitute.',
      fact: 'Stoicism was an ancient Greek school of philosophy founded at Athens by Zeno of Citium.'
    }
  },
  {
    id: 'starter-6',
    sourceInfo: {
      examName: 'SSC CHSL',
      examYear: 2021
    },
    classification: {
      subject: 'English',
      topic: 'Vocabulary',
      subTopic: 'Idioms and Phrases'
    },
    tags: ['English', 'Vocabulary', 'Idioms'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'Select the most appropriate meaning of the given idiom: "To spill the beans"',
    question_hi: 'दिए गए मुहावरे का सबसे उपयुक्त अर्थ चुनें: "To spill the beans"',
    options: ['To reveal a secret', 'To drop something', 'To cook a meal', 'To be very clumsy'],
    options_hi: ['रहस्य उजागर करना', 'कुछ गिराना', 'भोजन पकाना', 'बहुत अनाड़ी होना'],
    correct: 'To reveal a secret',
    explanation: {
      summary: '"To spill the beans" means to reveal secret information unintentionally or indiscreetly.',
      analysis_correct: 'Revealing a secret is the established figurative meaning of this idiom.',
      analysis_incorrect: 'The other options are literal or incorrect interpretations.',
      conclusion: 'The correct meaning is to reveal a secret.',
      fact: 'The origin of this idiom is thought to relate to an ancient Greek voting process using white and black beans.'
    }
  },
  {
    id: 'starter-7',
    sourceInfo: {
      examName: 'SSC CGL',
      examYear: 2023
    },
    classification: {
      subject: 'Economics',
      topic: 'Macroeconomics',
      subTopic: 'Banking'
    },
    tags: ['Economics', 'Banking', 'RBI'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'Which institution regulates the monetary policy in India?',
    question_hi: 'भारत में मौद्रिक नीति को कौन सी संस्था नियंत्रित करती है?',
    options: ['Reserve Bank of India (RBI)', 'Ministry of Finance', 'State Bank of India (SBI)', 'SEBI'],
    options_hi: ['भारतीय रिज़र्व बैंक (RBI)', 'वित्त मंत्रालय', 'भारतीय स्टेट बैंक (SBI)', 'सेबी (SEBI)'],
    correct: 'Reserve Bank of India (RBI)',
    explanation: {
      summary: 'The Reserve Bank of India (RBI) is responsible for formulating and implementing the monetary policy in India.',
      analysis_correct: 'The RBI uses various instruments like Repo Rate, Reverse Repo Rate, CRR, and SLR to manage inflation and economic growth.',
      analysis_incorrect: 'The Ministry of Finance handles fiscal policy. SBI is a commercial bank. SEBI regulates the securities market.',
      conclusion: 'RBI is the correct answer.',
      fact: 'The Monetary Policy Committee (MPC) of the RBI, a six-member body, is entrusted with the task of fixing the benchmark policy interest rate (repo rate).'
    }
  },
  {
    id: 'starter-8',
    sourceInfo: {
      examName: 'SSC CGL',
      examYear: 2020
    },
    classification: {
      subject: 'Science',
      topic: 'Physics',
      subTopic: 'Light'
    },
    tags: ['Science', 'Physics', 'Light'],
    properties: {
      difficulty: 'Easy',
      questionType: 'MCQ'
    },
    question: 'The splitting of white light into its component colors is called:',
    question_hi: 'श्वेत प्रकाश का उसके घटक रंगों में विभक्त होना क्या कहलाता है?',
    options: ['Dispersion', 'Reflection', 'Refraction', 'Scattering'],
    options_hi: ['विक्षेपण (Dispersion)', 'परावर्तन (Reflection)', 'अपवर्तन (Refraction)', 'प्रकीर्णन (Scattering)'],
    correct: 'Dispersion',
    explanation: {
      summary: 'Dispersion is the phenomenon of splitting of white light into its seven constituent colors when passed through a prism.',
      analysis_correct: 'This happens because different colors of light travel at different speeds in the glass of the prism.',
      analysis_incorrect: 'Reflection is the bouncing back of light. Refraction is the bending of light. Scattering is the deflection of light rays by particles.',
      conclusion: 'Dispersion is the correct answer.',
      fact: 'A rainbow is a natural manifestation of dispersion, refraction, and internal reflection of sunlight by water droplets.'
    }
  },
  {
    id: 'starter-9',
    sourceInfo: {
      examName: 'SSC CHSL',
      examYear: 2022
    },
    classification: {
      subject: 'Polity',
      topic: 'Parliament',
      subTopic: 'Lok Sabha'
    },
    tags: ['Polity', 'Parliament', 'Lok Sabha'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'What is the maximum strength of the Lok Sabha as envisaged by the Constitution of India?',
    question_hi: 'भारत के संविधान द्वारा परिकल्पित लोकसभा की अधिकतम संख्या कितनी है?',
    options: ['550', '545', '552', '543'],
    options_hi: ['550', '545', '552', '543'],
    correct: '552',
    explanation: {
      summary: 'The maximum strength of the Lok Sabha can be 552.',
      analysis_correct: 'According to the Constitution, the maximum strength of the House is 552 members - 530 representing States, 20 representing Union Territories, and 2 nominated from the Anglo-Indian community (Note: The nomination provision was removed by the 104th Amendment Act, 2019, making the effective maximum 550 for future, but historically 552 is often tested).',
      analysis_incorrect: '545 was the actual strength before the removal of the Anglo-Indian seats.',
      conclusion: '552 is the constitutional maximum strength often cited in exams.',
      fact: 'The 104th Constitutional Amendment Act, 2019, ended the reservation of seats for the Anglo-Indian community in the Lok Sabha and state assemblies.'
    }
  },
  {
    id: 'starter-10',
    sourceInfo: {
      examName: 'SSC CGL',
      examYear: 2021
    },
    classification: {
      subject: 'English',
      topic: 'Grammar',
      subTopic: 'Voice'
    },
    tags: ['English', 'Grammar', 'Active-Passive'],
    properties: {
      difficulty: 'Medium',
      questionType: 'MCQ'
    },
    question: 'Select the correct passive form of the given sentence: "They are building a new hospital."',
    question_hi: 'दिए गए वाक्य का सही निष्क्रिय (passive) रूप चुनें: "They are building a new hospital."',
    options: ['A new hospital is being built by them.', 'A new hospital is built by them.', 'A new hospital has been built by them.', 'A new hospital was being built by them.'],
    options_hi: ['A new hospital is being built by them.', 'A new hospital is built by them.', 'A new hospital has been built by them.', 'A new hospital was being built by them.'],
    correct: 'A new hospital is being built by them.',
    explanation: {
      summary: 'The sentence is in Present Continuous tense. Its passive voice uses "is being + past participle".',
      analysis_correct: 'Active: Subject + is/are/am + V-ing + Object. Passive: Object + is/are/am + being + V3 + by + Subject. "A new hospital" (singular object) takes "is being built".',
      analysis_incorrect: '"is built" is simple present. "has been built" is present perfect. "was being built" is past continuous.',
      conclusion: 'The correct passive form is "A new hospital is being built by them."',
      fact: 'In passive voice, the focus is on the action or the receiver of the action rather than who is performing the action.'
    }
  }
];
