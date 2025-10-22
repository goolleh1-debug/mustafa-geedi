// interfaces.ts
export interface QuizItem {
  question: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: string;
}

export interface Lesson {
  title: string;
  content: string;
}

export interface Course {
  title: string;
  outline: string[];
  lessons: Lesson[];
  summary: string;
  quiz: QuizItem[];
  lessonSummaries: string[];
}

export interface FeedbackData {
  rating: number;
  comment: string;
}

export interface Translations {
  so: {
    title: string;
    subtitle: string;
    generatingError: string;
    courseOutline: string;
    mainLessons: string;
    lessonSummaryPrefix: string;
    courseSummary: string;
    knowledgeCheck: string;
    trueOption: string;
    falseOption: string;
    correctFeedback: string;
    incorrectFeedback: string;
    explanationLabel: string;
    loadingExplanation: string;
    failedExplanation: string;
    loadingContent: string;
    downloadCourse: string;
    scanToDownloadApp: string; // This key is now unused by the download bar itself, but kept for historical context or if other uses arise.
    // New download related translations
    chooseDownloadFormat: string;
    formatMarkdown: string;
    formatPlainText: string;
    confirmDownload: string;
    cancelDownload: string;
    // New additions for reload and app download QR dialog
    reloadPage: string;
    getApp: string;
    installApp: string; // Added for PWA install prompt
    appDownloadTitle: string;
    scanToDownloadAppModal: string;
    closeModal: string;
    qrCodeDescription: string; // New for QR code accessibility
    selectLanguage: string; // New for language selector accessibility
    // New feedback related translations
    rateCourse: string;
    rateLesson: string;
    howToRate: string;
    yourComments: string;
    submitFeedback: string;
    thankYouFeedback: string;
    editFeedback: string;
    starRatingLabel: string; // For ARIA label of stars
  };
  en: {
    title: string;
    subtitle: string;
    generatingError: string;
    courseOutline: string;
    mainLessons: string;
    lessonSummaryPrefix: string;
    courseSummary: string;
    knowledgeCheck: string;
    trueOption: string;
    falseOption: string;
    correctFeedback: string;
    incorrectFeedback: string;
    explanationLabel: string;
    loadingExplanation: string;
    failedExplanation: string;
    loadingContent: string;
    downloadCourse: string;
    scanToDownloadApp: string; // This key is now unused by the download bar itself, but kept for historical context or if other uses arise.
    // New download related translations
    chooseDownloadFormat: string;
    formatMarkdown: string;
    formatPlainText: string;
    confirmDownload: string;
    cancelDownload: string;
    // New additions for reload and app download QR dialog
    reloadPage: string;
    getApp: string;
    installApp: string; // Added for PWA install prompt
    appDownloadTitle: string;
    scanToDownloadAppModal: string;
    closeModal: string;
    qrCodeDescription: string; // New for QR code accessibility
    selectLanguage: string; // New for language selector accessibility
    // New feedback related translations
    rateCourse: string;
    rateLesson: string;
    howToRate: string;
    yourComments: string;
    submitFeedback: string;
    thankYouFeedback: string;
    editFeedback: string;
    starRatingLabel: string; // For ARIA label of stars
  };
}

export const translations: Translations = {
  so: {
    title: 'Geeddi – AI Learning Academy',
    subtitle: 'CASHARO TAGNOOLAJIGA AI LAGU BARANAYO OO TAXANE AH',
    generatingError: 'Way ku guuldareysatay soo saarista casharka. Fadlan isku day mar kale.',
    courseOutline: 'Dulmarka Casharka',
    mainLessons: 'Casharada Muhiimka ah',
    lessonSummaryPrefix: 'Soo Koobid',
    courseSummary: 'Qoraal Kooban',
    knowledgeCheck: 'Hubinta Aqoonta',
    trueOption: 'Run',
    falseOption: 'Been',
    correctFeedback: 'Waa Sax!',
    incorrectFeedback: 'Waa Khalad!',
    explanationLabel: 'Sharaxaad:',
    loadingExplanation: 'Sharaxaada ayaa la soo saarayaa...',
    failedExplanation: 'Way ku guuldareysatay soo saarista sharaxaada.',
    loadingContent: 'Waxa la soo saarayaa macluumaadka...',
    downloadCourse: 'Soo Degso Casharka',
    scanToDownloadApp: 'Ku soo degso abka adoo iskaan gareynaya',
    // New download related translations
    chooseDownloadFormat: 'Dooro qaabka soo dejinta',
    formatMarkdown: 'Qaabka Markdown',
    formatPlainText: 'Qoraal Cad',
    confirmDownload: 'Xaqiiji Soo Dejinta',
    cancelDownload: 'Jooji',
    // New additions for reload and app download QR dialog
    reloadPage: 'Dib u shub bogga',
    getApp: 'Hel App-ka',
    installApp: 'Ku rakib App-ka', // Somali for "Install App"
    appDownloadTitle: 'Ku soo degso Geeddi App-ka',
    scanToDownloadAppModal: 'Fadlan ku iskaan garee QR code-kan si aad u soo degsato app-ka.',
    closeModal: 'Xir',
    qrCodeDescription: 'QR code si aad u soo degsato barnaamijka Geeddi',
    selectLanguage: 'Dooro Luqadda',
    rateCourse: 'Qiimee Casharkan',
    rateLesson: 'Qiimee Casharkan',
    howToRate: 'Fadlan qiimee casharkan (1 = aad u liita, 5 = aad u wanaagsan):',
    yourComments: 'Faalooyinkaaga (optional):',
    submitFeedback: 'Dir Faalada',
    thankYouFeedback: 'Waad ku mahadsan tahay faaladaada!',
    editFeedback: 'Wax ka beddel Faalada',
    starRatingLabel: 'xiddig', // 'star'
  },
  en: {
    title: 'Geeddi – AI Learning Academy',
    subtitle: 'A SERIES OF LESSONS TO LEARN AI TECHNOLOGY',
    generatingError: 'Failed to generate the course. Please try again.',
    courseOutline: 'Course Outline',
    mainLessons: 'Main Lessons',
    lessonSummaryPrefix: 'Summary',
    courseSummary: 'Brief Summary',
    knowledgeCheck: 'Knowledge Check',
    trueOption: 'True',
    falseOption: 'False',
    correctFeedback: 'Correct!',
    incorrectFeedback: 'Wrong!',
    explanationLabel: 'Explanation:',
    loadingExplanation: 'Loading explanation...',
    failedExplanation: 'Failed to generate explanation.',
    loadingContent: 'Loading content...',
    downloadCourse: 'Download Course',
    scanToDownloadApp: 'Scan to Download App',
    // New download related translations
    chooseDownloadFormat: 'Choose Download Format',
    formatMarkdown: 'Markdown Format',
    formatPlainText: 'Plain Text',
    confirmDownload: 'Confirm Download',
    cancelDownload: 'Cancel',
    // New additions for reload and app download QR dialog
    reloadPage: 'Reload Page',
    getApp: 'Get App',
    installApp: 'Install App', // English for "Install App"
    appDownloadTitle: 'Download Geeddi App',
    scanToDownloadAppModal: 'Please scan this QR code to download the app.',
    closeModal: 'Close',
    qrCodeDescription: 'QR code to download Geeddi app',
    selectLanguage: 'Select Language',
    rateCourse: 'Rate This Course',
    rateLesson: 'Rate This Lesson',
    howToRate: 'Please rate this (1 = very poor, 5 = excellent):',
    yourComments: 'Your Comments (optional):',
    submitFeedback: 'Submit Feedback',
    thankYouFeedback: 'Thank you for your feedback!',
    editFeedback: 'Edit Feedback',
    starRatingLabel: 'star',
  }
};

export interface CourseLevels {
  so: { title: string; topic: string; }[];
  en: { title: string; topic: string; }[];
}

export const courseLevels: CourseLevels = {
  so: [
    { title: 'Aasaaska Sirdoonka Macmalka ah (Heerka Bilowga)', topic: 'AI Fundamentals for beginners' },
    { title: 'Fikradaha Barashada Mashiinka (Heerka Dhexe)', topic: 'Intermediate Machine Learning Concepts' },
    { title: 'Barashada Qoto Dheer (Heerka Sare)', topic: 'Advanced Deep Learning' },
    { title: 'Isticmaalka Sare ee AI (Heer Jaamacadeed)', topic: 'University-Level Advanced AI Applications' },
  ],
  en: [
    { title: 'AI Fundamentals (Beginner Level)', topic: 'AI Fundamentals for beginners' },
    { title: 'Machine Learning Concepts (Intermediate)', topic: 'Intermediate Machine Learning Concepts' },
    { title: 'Deep Learning (Advanced)', topic: 'Advanced Deep Learning' },
    { title: 'Advanced AI Applications (University Level)', topic: 'University-Level Advanced AI Applications' },
  ]
};