import React, { useState, useEffect } from 'react';
import { Course, Translations, FeedbackData } from './interfaces'; // Import Course, Translations, and FeedbackData

interface CourseDisplayProps {
  course: Course;
  t: Translations['en'] | Translations['so'];
  quizAnswers: string[];
  quizFeedback: Array<'correct' | 'incorrect' | null>;
  quizExplanations: Array<string | null>;
  explanationLoading: boolean[];
  handleAnswerSelection: (qIndex: number, option: string) => void;
  loadingOutline: boolean;
  loadingLessons: boolean;
  loadingSummary: boolean;
  loadingQuiz: boolean;
  // New PWA related props
  deferredPrompt: Event | null;
  isAppInstalled: boolean;
  onInstallApp: () => void;
}

interface FeedbackSectionProps {
  type: 'course' | 'lesson';
  entityId: string; // Unique identifier for the feedback target (e.g., course title, lesson index)
  t: Translations['en'] | Translations['so'];
  courseTitle: string; // Needed to construct localStorage key
  lessonIndex?: number; // Optional, for lesson feedback
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ type, entityId, t, courseTitle, lessonIndex }) => {
  const localStorageKey = type === 'course'
    ? `geeddi-course-feedback-${courseTitle}`
    : `geeddi-lesson-feedback-${courseTitle}-${lessonIndex}`;

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    const storedFeedback = localStorage.getItem(localStorageKey);
    if (storedFeedback) {
      const { rating: storedRating, comment: storedComment } = JSON.parse(storedFeedback);
      setRating(storedRating);
      setComment(storedComment);
      setSubmitted(true);
    }
  }, [localStorageKey]);

  const handleSubmit = () => {
    if (rating === 0) return; // Prevent submission without a rating
    localStorage.setItem(localStorageKey, JSON.stringify({ rating, comment }));
    setSubmitted(true);
    setShowThankYou(true);
    // Hide thank you after a few seconds
    setTimeout(() => setShowThankYou(false), 3000);
  };

  const handleEdit = () => {
    setSubmitted(false);
  };

  const sectionTitle = type === 'course' ? t.rateCourse : t.rateLesson;
  const commentLabelId = `comment-label-${entityId}`;
  const ratingLabelId = `rating-label-${entityId}`;
  const howToRateId = `how-to-rate-${entityId}`;


  return (
    <div className="feedback-section" aria-labelledby={ratingLabelId}>
      <h4 id={ratingLabelId}>{sectionTitle}</h4>
      {submitted ? (
        <div className="submitted-feedback">
          <p>{t.howToRate}: {'⭐'.repeat(rating)}{'☆'.repeat(5 - rating)}</p>
          {comment && <p>{t.yourComments}: {comment}</p>}
          {showThankYou && <p role="status" className="thank-you-message">{t.thankYouFeedback}</p>}
          <button onClick={handleEdit} className="submit-feedback-button">
            {t.editFeedback}
          </button>
        </div>
      ) : (
        <>
          <p id={howToRateId}>{t.howToRate}</p>
          <div className="star-rating" role="radiogroup" aria-labelledby={howToRateId}>
            {[1, 2, 3, 4, 5].map((starNum) => (
              <button
                key={starNum}
                className={`star ${starNum <= rating ? 'selected' : ''}`}
                onClick={() => setRating(starNum)}
                aria-label={`${starNum} ${t.starRatingLabel}`}
                aria-checked={starNum === rating}
                role="radio"
              >
                ⭐
              </button>
            ))}
          </div>
          <label htmlFor={commentLabelId} className="visually-hidden">{t.yourComments}</label>
          <textarea
            id={commentLabelId}
            placeholder={t.yourComments}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-label={t.yourComments}
            rows={3}
          ></textarea>
          <button onClick={handleSubmit} disabled={rating === 0} className="submit-feedback-button">
            {t.submitFeedback}
          </button>
        </>
      )}
    </div>
  );
};


const CourseDisplay: React.FC<CourseDisplayProps> = ({
  course,
  t,
  quizAnswers,
  quizFeedback,
  quizExplanations,
  explanationLoading,
  handleAnswerSelection,
  loadingOutline,
  loadingLessons,
  loadingSummary,
  loadingQuiz,
  // PWA props
  deferredPrompt,
  isAppInstalled,
  onInstallApp,
}) => {
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'markdown' | 'plaintext'>('markdown');
  const [showAppDownloadQR, setShowAppDownloadQR] = useState(false); // New state for app download QR dialog

  // Helper function to convert Markdown to Plain Text
  const markdownToPlainText = (markdown: string): string => {
    let plainText = markdown;

    // Remove markdown links (e.g., [text](url))
    plainText = plainText.replace(/\[(.*?)\]\((.*?)\)/g, '$1');

    // Remove markdown images (e.g., ![alt text](url))
    plainText = plainText.replace(/!\[(.*?)\]\((.*?)\)/g, '$1');

    // Remove headings (#, ##, ###)
    plainText = plainText.replace(/^#+\s/gm, '');

    // Remove bold (**text**, __text__)
    plainText = plainText.replace(/(\*\*|__)(.*?)\1/g, '$2');

    // Remove italics (*text*, _text_) - handle single underscores carefully
    // Only remove if it's not part of a word (e.g., _word_ vs word_part)
    plainText = plainText.replace(/(^|\s)(\*|_)(.*?)\2(\s|$)/g, '$1$3$4'); // for whole words
    plainText = plainText.replace(/(\*|_)(.*?)\1/g, '$2'); // Fallback for embedded

    // Remove bullet points (*, -, +) and numbered lists (1., 2.)
    plainText = plainText.replace(/^(\s*[\*\-\+]|\s*\d+\.)\s+/gm, '');

    // Replace multiple newlines with single newlines, but keep paragraphs separated by two newlines
    plainText = plainText.replace(/\n\s*\n/g, '\n\n');

    return plainText.trim();
  };

  const generateContent = (courseData: Course, format: 'markdown' | 'plaintext'): string => {
    let content = '';

    if (format === 'markdown') {
      content += `# ${courseData.title}\n\n`;

      // Outline
      content += `## ${t.courseOutline}\n`;
      courseData.outline.forEach(item => {
        content += `* ${item}\n`;
      });
      content += '\n';

      // Lessons
      content += `## ${t.mainLessons}\n`;
      courseData.lessons.forEach((lesson, index) => {
        content += `### ${lesson.title}\n`;
        content += `**${t.lessonSummaryPrefix}:** ${courseData.lessonSummaries[index]}\n`;
        content += `${lesson.content}\n\n`;
      });

      // Summary
      content += `## ${t.courseSummary}\n`;
      content += `${courseData.summary}\n\n`;

      // Quiz
      content += `## ${t.knowledgeCheck}\n`;
      courseData.quiz.forEach((q, qIndex) => {
        content += `${qIndex + 1}. ${q.question}\n`;
        content += `   Options: ${q.options.join(', ')}\n`;
        content += `   Correct Answer: ${q.correctAnswer}\n\n`;
      });
    } else { // Plain Text
      content += `${courseData.title}\n\n`;

      // Outline
      content += `${t.courseOutline}:\n`;
      courseData.outline.forEach(item => {
        content += `- ${item}\n`;
      });
      content += '\n';

      // Lessons
      content += `${t.mainLessons}:\n`;
      courseData.lessons.forEach((lesson, index) => {
        content += `Lesson: ${markdownToPlainText(lesson.title)}\n`;
        content += `${t.lessonSummaryPrefix}: ${markdownToPlainText(courseData.lessonSummaries[index])}\n`;
        content += `${markdownToPlainText(lesson.content)}\n\n`;
      });

      // Summary
      content += `${t.courseSummary}:\n`;
      content += `${markdownToPlainText(courseData.summary)}\n\n`;

      // Quiz
      content += `${t.knowledgeCheck}:\n`;
      courseData.quiz.forEach((q, qIndex) => {
        content += `${qIndex + 1}. ${markdownToPlainText(q.question)}\n`;
        content += `   Options: ${q.options.map(opt => markdownToPlainText(opt)).join(', ')}\n`;
        content += `   Correct Answer: ${markdownToPlainText(q.correctAnswer)}\n\n`;
      });
    }

    return content;
  };

  const initiateDownload = () => {
    const content = generateContent(course, downloadFormat);
    const fileExtension = downloadFormat === 'markdown' ? 'md' : 'txt';
    const fileName = `Geeddi-AI-Course-${course.title.replace(/[^a-z0-9]/gi, '_')}.${fileExtension}`;
    const mimeType = downloadFormat === 'markdown' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setShowDownloadConfirm(false); // Close dialog after download
  };

  const handleGetAppClick = () => {
    if (deferredPrompt) {
      onInstallApp(); // Trigger the native install prompt
    } else {
      setShowAppDownloadQR(true); // Fallback to QR code dialog
    }
  };

  return (
    <>
      <div className="course-display">
        <div className="course-header">
          <h2 id="course-title">{course.title}</h2>
        </div>
        <div className="course-content" aria-labelledby="course-title">
          <section className="course-section" aria-labelledby="outline-heading">
            <h3 id="outline-heading">{t.courseOutline}</h3>
            <div className="course-section-content">
              {loadingOutline ? (
                <div className="section-loader" aria-live="polite">
                  <div className="spinner small-spinner"></div> {t.loadingContent}
                </div>
              ) : (
                <ul>
                  {course.outline.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section aria-labelledby="lessons-heading">
            <h3 id="lessons-heading">{t.mainLessons}</h3>
            {loadingLessons ? (
              <div className="section-loader" aria-live="polite">
                <div className="spinner small-spinner"></div> {t.loadingContent}
              </div>
            ) : (
              course.lessons.map((lesson, index) => (
                <details key={index} className="accordion">
                  <summary>{lesson.title}</summary>
                  <div className="accordion-content">
                    <p className="lesson-summary"><strong>{t.lessonSummaryPrefix}:</strong> {course.lessonSummaries[index]}</p>
                    {lesson.content}
                    <FeedbackSection
                      type="lesson"
                      entityId={`lesson-${index}`}
                      t={t}
                      courseTitle={course.title}
                      lessonIndex={index}
                    />
                  </div>
                </details>
              ))
            )}
          </section>

          <section className="course-section" aria-labelledby="summary-heading">
            <h3 id="summary-heading">{t.courseSummary}</h3>
            <div className="course-section-content">
              {loadingSummary ? (
                <div className="section-loader" aria-live="polite">
                  <div className="spinner small-spinner"></div> {t.loadingContent}
                </div>
              ) : (
                <p>{course.summary}</p>
              )}
            </div>
          </section>

          <section aria-labelledby="quiz-heading">
            <h3 id="quiz-heading">{t.knowledgeCheck}</h3>
            <div className="course-section-content">
              {loadingQuiz ? (
                <div className="section-loader" aria-live="polite">
                  <div className="spinner small-spinner"></div> {t.loadingContent}
                </div>
              ) : (
                course.quiz.map((q, qIndex) => (
                  <div key={qIndex} className="quiz-question">
                    <p>{qIndex + 1}. {q.question}</p>
                    <div className={`quiz-options ${q.type === 'true-false' ? 'true-false-options' : ''}`}>
                      {q.options.map((option, oIndex) => {
                        const isSelected = quizAnswers[qIndex] === option;
                        const feedback = quizFeedback[qIndex];
                        const isCorrect = option === q.correctAnswer;

                        let buttonClass = '';
                        if (feedback) { // An answer has been selected
                          if (isSelected && feedback === 'correct') {
                            buttonClass = 'correct-feedback';
                          } else if (isSelected && feedback === 'incorrect') {
                            buttonClass = 'incorrect-feedback';
                          } else if (feedback === 'incorrect' && isCorrect) { // Reveal correct answer on incorrect
                            buttonClass = 'correct-answer-reveal';
                          }
                        }

                        return (
                          <button
                            key={oIndex}
                            className={buttonClass}
                            onClick={() => handleAnswerSelection(qIndex, option)}
                            disabled={feedback !== null || explanationLoading[qIndex]} // Disable if already answered or explanation is loading
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {quizFeedback[qIndex] === 'correct' && (
                      <p role="status" className="feedback-message correct-message">{t.correctFeedback}</p>
                    )}
                    {quizFeedback[qIndex] === 'incorrect' && (
                      <>
                        <p role="status" className="feedback-message incorrect-message">{t.incorrectFeedback}</p>
                        {explanationLoading[qIndex] && (
                          <div className="explanation-loading" aria-live="polite">
                            <span className="spinner small-spinner"></span> {t.loadingExplanation}
                          </div>
                        )}
                        {quizExplanations[qIndex] && !explanationLoading[qIndex] && (
                          <div className="explanation-container">
                            <p className="explanation-label"><strong>{t.explanationLabel}</strong></p>
                            <p className="explanation-text">{quizExplanations[qIndex]}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <FeedbackSection
            type="course"
            entityId="course-feedback"
            t={t}
            courseTitle={course.title}
          />

        </div>
      </div>

      <div className="download-bar" aria-live="polite">
        <button className="download-button" onClick={() => setShowDownloadConfirm(true)}>
          {t.downloadCourse}
        </button>
        <button className="download-button reload-button" onClick={() => window.location.reload()}>
          {t.reloadPage}
        </button>
        {!isAppInstalled && ( // Only show if app is not installed
          <button className="download-button get-app-button" onClick={handleGetAppClick}>
            {deferredPrompt ? t.installApp : t.getApp}
          </button>
        )}
      </div>

      {showDownloadConfirm && (
        <div className="download-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="download-dialog-title">
          <div className="download-dialog">
            <h4 id="download-dialog-title">{t.chooseDownloadFormat}</h4>
            <div className="download-format-options">
              <label className="download-format-option">
                <input
                  type="radio"
                  name="downloadFormat"
                  value="markdown"
                  checked={downloadFormat === 'markdown'}
                  onChange={() => setDownloadFormat('markdown')}
                />
                {t.formatMarkdown}
              </label>
              <label className="download-format-option">
                <input
                  type="radio"
                  name="downloadFormat"
                  value="plaintext"
                  checked={downloadFormat === 'plaintext'}
                  onChange={() => setDownloadFormat('plaintext')}
                />
                {t.formatPlainText}
              </label>
            </div>
            <div className="download-dialog-actions">
              <button className="confirm-button" onClick={initiateDownload}>
                {t.confirmDownload}
              </button>
              <button className="cancel-button" onClick={() => setShowDownloadConfirm(false)}>
                {t.cancelDownload}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAppDownloadQR && (
        <div className="app-qr-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="app-qr-dialog-title">
          <div className="app-qr-dialog">
            <h4 id="app-qr-dialog-title">{t.appDownloadTitle}</h4>
            {/* The QR Code SVG, previously in the download bar */}
            <svg className="qr-code-img" viewBox="0 0 37 37" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={t.qrCodeDescription}>
              <rect x="0" y="0" width="37" height="37" fill="white"/>
              <path fill="#333333" d="M1,1v7h7V1ZM2,2h5v5H2ZM9,1v1h1V1ZM11,1v1h1V1ZM13,1v1h1V1ZM15,1v1h1V1ZM17,1v1h1V1ZM19,1v1h1V1ZM21,1v1h1V1ZM23,1v1h1V1ZM25,1v1h1V1ZM27,1v1h1V1ZM29,1v1h1V1ZM31,1v1h1V1ZM33,1v1h1V1ZM35,1v1h1V1ZM3,9h1V8h-1ZM5,9h1V8h-1ZM7,9h1V8h-1ZM1,9v1h1V9ZM1,11v1h1V11ZM1,13v1h1V13ZM1,15v1h1V15ZM1,17v1h1V17ZM1,19v1h1V19ZM1,21v1h1V21ZM1,23v1h1V23ZM1,25v1h1V25ZM1,27v1h1V27ZM1,29v1h1V29ZM1,31v1h1V31ZM1,33v1h1V33ZM1,35v1h1V35ZM3,35h1V34h-1ZM5,35h1V34h-1ZM7,35h1V34h-1ZM9,35h1V34h-1ZM11,35h1V34h-1ZM13,35h1V34h-1ZM15,35h1V34h-1ZM17,35h1V34h-1ZM19,35h1V34h-1ZM21,35h1V34h-1ZM23,35h1V34h-1ZM25,35h1V34h-1ZM27,35h1V34h-1ZM29,35h1V34h-1ZM31,35h1V34h-1ZM33,35h1V34h-1ZM35,35h1V34h-1ZM35,33h1V32h-1ZM35,31h1V30h-1ZM35,29h1V28h-1ZM35,27h1V26h-1ZM35,25h1V24h-1ZM35,23h1V22h-1ZM35,21h1V20h-1ZM35,19h1V18h-1ZM35,17h1V16h-1ZM35,15h1V14h-1ZM35,13h1V12h-1ZM35,11h1V10h-1ZM35,9h1V8h-1ZM33,9h1V8h-1ZM31,9h1V8h-1ZM29,9h1V8h-1ZM27,9h1V8h-1ZM25,9h1V8h-1ZM23,9h1V8h-1ZM21,9h1V8h-1ZM19,9h1V8h-1ZM17,9h1V8h-1ZM15,9h1V8h-1ZM13,9h1V8h-1ZM11,9h1V8h-1ZM9,9h1V8h-1ZM1,28v-7h7v7ZM2,22h5v5H2ZM9,28v-7h7v7ZM10,22h5v5H10ZM28,1v7h7V1ZM29,2h5v5H29ZM28,28v-7h7v7ZM29,22h5v5H29ZM11,28v-1h1v1ZM14,28v-1h1v1ZM12,25v-1h1v1ZM12,23v-1h1v1ZM14,25v-1h1v1ZM14,23v-1h1v1ZM16,21v1h1V21ZM16,24v-1h1v1ZM17,26v-1h1v1ZM18,24v-1h1v1ZM17,22v-1h1v1ZM19,25v-1h1v1ZM19,23v-1h1v1ZM20,28v-1h1v1ZM22,28v-1h1v1ZM24,28v-1h1v1ZM20,26v-1h1v1ZM22,26v-1h1v1ZM24,26v-1h1v1ZM20,22v-1h1v1ZM22,22v-1h1v1ZM24,22v-1h1v1ZM11,30v1h1V30ZM14,30v1h1V30ZM17,30v1h1V30ZM20,30v1h1V30ZM23,30v1h1V30ZM26,30v1h1V30ZM11,32v1h1V32ZM14,32v1h1V32ZM17,32v1h1V32ZM20,32v1h1V32ZM23,32v1h1V32ZM26,32v1h1V32ZM11,34v1h1V34ZM14,34v1h1V34ZM17,34v1h1V34ZM20,34v1h1V34ZM23,34v1h1V34ZM26,34v1h1V34ZM10,13v1h1V13ZM12,13v1h1V13ZM14,13v1h1V13ZM16,13v1h1V13ZM18,13v1h1V13ZM20,13v1h1V13ZM22,13v1h1V13ZM24,13v1h1V13ZM26,13v1h1V13ZM10,15v1h1V15ZM12,15v1h1V15ZM14,15v1h1V15ZM16,15v1h1V15ZM18,15v1h1V15ZM20,15v1h1V15ZM22,15v1h1V15ZM24,15v1h1V15ZM26,15v1h1V15ZM10,17v1h1V17ZM12,17v1h1V17ZM14,17v1h1V17ZM16,17v1h1V17ZM18,17v1h1V17ZM20,17v1h1V17ZM22,17v1h1V17ZM24,17v1h1V17ZM26,17v1h1V17ZM10,19v1h1V19ZM12,19v1h1V19ZM14,19v1h1V19ZM16,19v1h1V19ZM18,19v1h1V19ZM20,19v1h1V19ZM22,19v1h1V19ZM24,19v1h1V19ZM26,19v1h1V19ZM10,21v1h1V21ZM12,21v1h1V21ZM14,21v1h1V21ZM16,21v1h1V21ZM18,21v1h1V21ZM20,21v1h1V21ZM22,21v1h1V21ZM24,21v1h1V21ZM26,21v1h1V21ZM10,23v1h1V23ZM12,23v1h1V23ZM14,23v1h1V23ZM16,23v1h1V23ZM18,23v1h1V23ZM20,23v1h1V23ZM22,23v1h1V23ZM24,23v1h1V23ZM26,23v1h1V23ZM10,25v1h1V25ZM12,25v1h1V25ZM14,25v1h1V25ZM16,25v1h1V25ZM18,25v1h1V25ZM20,25v1h1V25ZM22,25v1h1V25ZM24,25v1h1V25ZM26,25v1h1V25ZM10,27v1h1V27ZM12,27v1h1V27ZM14,27v1h1V27ZM16,27v1h1V27ZM18,27v1h1V27ZM20,27v1h1V27ZM22,27v1h1V27ZM24,27v1h1V27ZM26,27v1h1V27ZM10,29v1h1V29ZM12,29v1h1V29ZM14,29v1h1V29ZM16,29v1h1V29ZM18,29v1h1V29ZM20,29v1h1V29ZM22,29v1h1V29ZM24,29v1h1V29ZM26,29v1h1V29ZM10,31v1h1V31ZM12,31v1h1V31ZM14,31v1h1V31ZM16,31v1h1V31ZM18,31v1h1V31ZM20,31v1h1V31ZM22,31v1h1V31ZM24,31v1h1V31ZM26,31v1h1V31ZM10,33v1h1V33ZM12,33v1h1V33ZM14,33v1h1V33ZM16,33v1h1V33ZM18,33v1h1V33ZM20,33v1h1V33ZM22,33v1h1V33ZM24,33v1h1V33ZM26,33v1h1V33ZM10,1v7h7V1ZM11,2h5v5H11ZM19,1v7h7V1ZM20,2h5v5H20ZM10,28v7h7V28ZM11,29h5v5H11ZM19,28v7h7V28ZM20,29h5v5H20ZM28,10v1h1V10ZM30,10v1h1V10ZM32,10v1h1V10ZM34,10v1h1V10ZM28,12v1h1V12ZM30,12v1h1V12ZM32,12v1h1V12ZM34,12v1h1V12ZM28,14v1h1V14ZM30,14v1h1V14ZM32,14v1h1V14ZM34,14v1h1V14ZM28,16v1h1V16ZM30,16v1h1V16ZM32,16v1h1V16ZM34,16v1h1V16ZM28,18v1h1V18ZM30,18v1h1V18ZM32,18v1h1V18ZM34,18v1h1V18ZM28,20v1h1V20ZM30,20v1h1V20ZM32,20v1h1V20ZM34,20v1h1V20ZM28,30v1h1V30ZM30,30v1h1V30ZM32,30v1h1V30ZM34,30v1h1V30ZM28,32v1h1V32ZM30,32v1h1V32ZM32,32v1h1V32ZM34,32v1h1V32ZM28,34v1h1V34ZM30,34v1h1V34ZM32,34v1h1V34ZM34,34v1h1V34ZM9,10v1h1V10ZM9,12v1h1V12ZM9,14v1h1V14ZM9,16v1h1V16ZM9,18v1h1V18ZM9,20v1h1V20ZM9,22v1h1V22ZM9,24v1h1V24ZM9,26v1h1V26ZM9,28v1h1V28ZM9,30v1h1V30ZM9,32v1h1V32ZM9,34v1h1V34ZM1v7h7V1ZM2,2h5v5H2ZM1v7h7V1ZM2,2h5v5H2ZM28,1v7h7V1ZM29,2h5v5H29ZM28,28v7h7V28ZM29,29h5v5H29ZM1,28v7h7V28ZM2,29h5v5H2ZM9,12h1V11h-1ZM10,12h1V11h-1ZM12,12h1V11h-1ZM13,12h1V11h-1ZM15,12h1V11h-1ZM16,12h1V11h-1ZM18,12h1V11h-1ZM19,12h1V11h-1ZM21,12h1V11h-1ZM22,12h1V11h-1ZM24,12h1V11h-1ZM25,12h1V11h-1ZM11,10h1V9h-1ZM14,10h1V9h-1ZM17,10h1V9h-1ZM20,10h1V9h-1ZM23,10h1V9h-1ZM26,10h1V9h-1ZM28,8h1V9h-1ZM29,8h1V9h-1ZM31,8h1V9h-1ZM32,8h1V9h-1ZM34,8h1V9h-1ZM35,8h1V9h-1ZM28,11h1V10h-1ZM29,11h1V10h-1ZM31,11h1V10h-1ZM32,11h1V10h-1ZM34,11h1V10h-1ZM35,11h1V10h-1ZM28,13h1V12h-1ZM29,13h1V12h-1ZM31,13h1V12h-1ZM32,13h1V12h-1ZM34,13h1V12h-1ZM35,13h1V12h-1ZM28,15h1V14h-1ZM29,15h1V14h-1ZM31,15h1V14h-1ZM32,15h1V14h-1ZM34,15h1V14h-1ZM35,15h1V14h-1ZM28,17h1V16h-1ZM29,17h1V16h-1ZM31,17h1V16h-1ZM32,17h1V16h-1ZM34,17h1V16h-1ZM35,17h1V16h-1ZM28,19h1V18h-1ZM29,19h1V18h-1ZM31,19h1V18h-1ZM32,19h1V18h-1ZM34,19h1V18h-1ZM35,19h1V18h-1ZM28,21h1V20h-1ZM29,21h1V20h-1ZM31,21h1V20h-1ZM32,21h1V20h-1ZM34,21h1V20h-1ZM35,21h1V20h-1ZM28,23h1V22h-1ZM29,23h1V22h-1ZM31,23h1V22h-1ZM32,23h1V22h-1ZM34,23h1V22h-1ZM35,23h1V22h-1ZM28,25h1V24h-1ZM29,25h1V24h-1ZM31,25h1V24h-1ZM32,25h1V24h-1ZM34,25h1V24h-1ZM35,25h1V24h-1ZM28,27h1V26h-1ZM29,27h1V26h-1ZM31,27h1V26h-1ZM32,27h1V26h-1ZM34,27h1V26h-1ZM35,27h1V26h-1ZM11,28h1V27h-1ZM14,28h1V27h-1ZM17,28h1V27h-1ZM20,28h1V27h-1ZM23,28h1V27h-1ZM26,28h1V27h-1ZM11,29h1V28h-1ZM14,29h1V28h-1ZM17,29h1V28h-1ZM20,29h1V28h-1ZM23,29h1V28h-1ZM26,29h1V28h-1ZM11,31h1V30h-1ZM14,31h1V30h-1ZM17,31h1V30h-1ZM20,31h1V30h-1ZM23,31h1V30h-1ZM26,31h1V30h-1ZM11,33h1V32h-1ZM14,33h1V32h-1ZM17,33h1V32h-1ZM20,33h1V32h-1ZM23,33h1V32h-1ZM26,33h1V32h-1ZM11,34h1V33h-1ZM14,34h1V33h-1ZM17,34h1V33h-1ZM20,34h1V33h-1ZM23,34h1V33h-1ZM26,34h1V33h-1ZM28,29h1V28h-1ZM29,29h1V28h-1ZM31,29h1V28h-1ZM32,29h1V28h-1ZM34,29h1V28h-1ZM35,29h1V28h-1ZM28,31h1V30h-1ZM29,31h1V30h-1ZM31,31h1V30h-1ZM32,31h1V30h-1ZM34,31h1V30h-1ZM35,31h1V30h-1ZM28,33h1V32h-1ZM29,33h1V32h-1ZM31,33h1V32h-1ZM32,33h1V32h-1ZM34,33h1V32h-1ZM35,33h1V32h-1ZM28,35h1V34h-1ZM29,35h1V34h-1ZM31,35h1V34h-1ZM32,35h1V34h-1ZM34,35h1V34h-1ZM35,35h1V34h-1ZM9,22h1V21h-1ZM10,22h1V21h-1ZM12,22h1V21h-1ZM13,22h1V21h-1ZM15,22h1V21h-1ZM16,22h1V21h-1ZM18,22h1V21h-1ZM19,22h1V21h-1ZM21,22h1V21h-1ZM22,22h1V21h-1ZM24,22h1V21h-1ZM25,22h1V21h-1ZM9,20h1V19h-1ZM10,20h1V19h-1ZM12,20h1V19h-1ZM13,20h1V19h-1ZM15,20h1V19h-1ZM16,20h1V19h-1ZM18,20h1V19h-1ZM19,20h1V19h-1ZM21,20h1V19h-1ZM22,20h1V19h-1ZM24,20h1V19h-1ZM25,20h1V19h-1ZM9,18h1V17h-1ZM10,18h1V17h-1ZM12,18h1V17h-1ZM13,18h1V17h-1ZM15,18h1V17h-1ZM16,18h1V17h-1ZM18,18h1V17h-1ZM19,18h1V17h-1ZM21,18h1V17h-1ZM22,18h1V17h-1ZM24,18h1V17h-1ZM25,18h1V17h-1ZM9,16h1V15h-1ZM10,16h1V15h-1ZM12,16h1V15h-1ZM13,16h1V15h-1ZM15,16h1V15h-1ZM16,16h1V15h-1ZM18,16h1V15h-1ZM19,16h1V15h-1ZM21,16h1V15h-1ZM22,16h1V15h-1ZM24,16h1V15h-1ZM25,16h1V15h-1ZM9,14h1V13h-1ZM10,14h1V13h-1ZM12,14h1V13h-1ZM13,14h1V13h-1ZM15,14h1V13h-1ZM16,14h1V13h-1ZM18,14h1V13h-1ZM19,14h1V13h-1ZM21,14h1V13h-1ZM22,14h1V13h-1ZM24,14h1V13h-1ZM25,14h1V13h-1ZM9,10h1V9h-1ZM10,10h1V9h-1ZM12,10h1V9h-1ZM13,10h1V9h-1ZM15,10h1V9h-1ZM16,10h1V9h-1ZM18,10h1V9h-1ZM19,10h1V9h-1ZM21,10h1V9h-1ZM22,10h1V9h-1ZM24,10h1V9h-1ZM25,10h1V9h-1ZM1,8h1V9h-1ZM1,10h1V11h-1ZM1,12h1V13h-1ZM1,14h1V15h-1ZM1,16h1V17h-1ZM1,18h1V19h-1ZM1,20h1V21h-1ZM1,22h1V23h-1ZM1,24h1V25h-1ZM1,26h1V27h-1ZM1,28h1V29h-1ZM1,30h1V31h-1ZM1,32h1V33h-1ZM1,34h1V35h-1ZM3,8h1V9h-1ZM3,10h1V11h-1ZM3,12h1V13h-1ZM3,14h1V15h-1ZM3,16h1V17h-1ZM3,18h1V19h-1ZM3,20h1V21h-1ZM3,22h1V23h-1ZM3,24h1V25h-1ZM3,26h1V27h-1ZM3,28h1V29h-1ZM3,30h1V31h-1ZM3,32h1V33h-1ZM3,34h1V35h-1ZM5,8h1V9h-1ZM5,10h1V11h-1ZM5,12h1V13h-1ZM5,14h1V15h-1ZM5,16h1V17h-1ZM5,18h1V19h-1ZM5,20h1V21h-1ZM5,22h1V23h-1ZM5,24h1V25h-1ZM5,26h1V27h-1ZM5,28h1V29h-1ZM5,30h1V31h-1ZM5,32h1V33h-1ZM5,34h1V35h-1ZM7,8h1V9h-1ZM7,10h1V11h-1ZM7,12h1V13h-1ZM7,14h1V15h-1ZM7,16h1V17h-1ZM7,18h1V19h-1ZM7,20h1V21h-1ZM7,22h1V23h-1ZM7,24h1V25h-1ZM7,26h1V27h-1ZM7,28h1V29h-1ZM7,30h1V31h-1ZM7,32h1V33h-1ZM7,34h1V35h-1ZM8,3h1V2h-1ZM8,5h1V4h-1ZM8,7h1V6h-1ZM8,9h1V8h-1ZM8,11h1V10h-1ZM8,13h1V12h-1ZM8,15h1V14h-1ZM8,17h1V16h-1ZM8,19h1V18h-1ZM8,21h1V20h-1ZM8,23h1V22h-1ZM8,25h1V24h-1ZM8,27h1V26h-1ZM8,29h1V28h-1ZM8,31h1V30h-1ZM8,33h1V32h-1ZM8,35h1V34h-1ZM29,8h1V9h-1ZM30,8h1V9h-1ZM32,8h1V9h-1ZM33,8h1V9h-1ZM35,8h1V9h-1ZM36,8h1V9h-1ZM29,10h1V11h-1ZM30,10h1V11h-1ZM32,10h1V11h-1ZM33,10h1V11h-1ZM35,10h1V11h-1ZM36,10h1V11h-1ZM29,12h1V13h-1ZM30,12h1V13h-1ZM32,12h1V13h-1ZM33,12h1V13h-1ZM35,12h1V13h-1ZM36,12h1V13h-1ZM29,14h1V15h-1ZM30,14h1V15h-1ZM32,14h1V15h-1ZM33,14h1V15h-1ZM35,14h1V15h-1ZM36,14h1V15h-1ZM29,16h1V17h-1ZM30,16h1V17h-1ZM32,16h1V17h-1ZM33,16h1V17h-1ZM35,16h1V17h-1ZM36,16h1V17h-1ZM29,18h1V19h-1ZM30,18h1V19h-1ZM32,18h1V19h-1ZM33,18h1V19h-1ZM35,18h1V19h-1ZM36,18h1V19h-1ZM29,20h1V21h-1ZM30,20h1V21h-1ZM32,20h1V21h-1ZM33,20h1V21h-1ZM35,20h1V21h-1ZM36,20h1V21h-1ZM29,22h1V23h-1ZM30,22h1V23h-1ZM32,22h1V23h-1ZM33,22h1V23h-1ZM35,22h1V23h-1ZM36,22h1V23h-1ZM29,24h1V25h-1ZM30,24h1V25h-1ZM32,24h1V25h-1ZM33,24h1V25h-1ZM35,24h1V25h-1ZM36,24h1V25h-1ZM29,26h1V27h-1ZM30,26h1V27h-1ZM32,26h1V27h-1ZM33,26h1V27h-1ZM35,26h1V27h-1ZM36,26h1V27h-1ZM29,28h1V29h-1ZM30,28h1V29h-1ZM32,28h1V29h-1ZM33,28h1V29h-1ZM35,28h1V29h-1ZM36,28h1V29h-1ZM29,30h1V31h-1ZM30,30h1V31h-1ZM32,30h1V31h-1ZM33,30h1V31h-1ZM35,30h1V31h-1ZM36,30h1V31h-1ZM29,32h1V33h-1ZM30,32h1V33h-1ZM32,32h1V33h-1ZM33,32h1V33h-1ZM35,32h1V33h-1ZM36,32h1V33h-1ZM29,34h1V35h-1ZM30,34h1V35h-1ZM32,34h1V35h-1ZM33,34h1V35h-1ZM35,34h1V35h-1ZM36,34h1V35h-1ZM9,22h1V21h-1ZM10,22h1V21h-1ZM12,22h1V21h-1ZM13,22h1V21h-1ZM15,22h1V21h-1ZM16,22h1V21h-1ZM18,22h1V21h-1ZM19,22h1V21h-1ZM21,22h1V21h-1ZM22,22h1V21h-1ZM24,22h1V21h-1ZM25,22h1V21h-1ZM9,20h1V19h-1ZM10,20h1V19h-1ZM12,20h1V19h-1ZM13,20h1V19h-1ZM15,20h1V19h-1ZM16,20h1V19h-1ZM18,20h1V19h-1ZM19,20h1V19h-1ZM21,20h1V19h-1ZM22,20h1V19h-1ZM24,20h1V19h-1ZM25,20h1V19h-1ZM9,18h1V17h-1ZM10,18h1V17h-1ZM12,18h1V17h-1ZM13,18h1V17h-1ZM15,18h1V17h-1ZM16,18h1V17h-1ZM18,18h1V17h-1ZM19,18h1V17h-1ZM21,18h1V17h-1ZM22,18h1V17h-1ZM24,18h1V17h-1ZM25,18h1V17h-1ZM9,16h1V15h-1ZM10,16h1V15h-1ZM12,16h1V15h-1ZM13,16h1V15h-1ZM15,16h1V15h-1ZM16,16h1V15h-1ZM18,16h1V15h-1ZM19,16h1V15h-1ZM21,16h1V15h-1ZM22,16h1V15h-1ZM24,16h1V15h-1ZM25,16h1V15h-1ZM9,14h1V13h-1ZM10,14h1V13h-1ZM12,14h1V13h-1ZM13,14h1V13h-1ZM15,14h1V13h-1ZM16,14h1V13h-1ZM18,14h1V13h-1ZM19,14h1V13h-1ZM21,14h1V13h-1ZM22,14h1V13h-1ZM24,14h1V13h-1ZM25,14h1V13h-1ZM9,10h1V9h-1ZM10,10h1V9h-1ZM12,10h1V9h-1ZM13,10h1V9h-1ZM15,10h1V9h-1ZM16,10h1V9h-1ZM18,10h1V9h-1ZM19,10h1V9h-1ZM21,10h1V9h-1ZM22,10h1V9h-1ZM24,10h1V9h-1ZM25,10h1V9h-1ZM1,8h1V9h-1ZM1,10h1V11h-1ZM1,12h1V13h-1ZM1,14h1V15h-1ZM1,16h1V17h-1ZM1,18h1V19h-1ZM1,20h1V21h-1ZM1,22h1V23h-1ZM1,24h1V25h-1ZM1,26h1V27h-1ZM1,28h1V29h-1ZM1,30h1V31h-1ZM1,32h1V33h-1ZM1,34h1V35h-1ZM3,8h1V9h-1ZM3,10h1V11h-1ZM3,12h1V13h-1ZM3,14h1V15h-1ZM3,16h1V17h-1ZM3,18h1V19h-1ZM3,20h1V21h-1ZM3,22h1V23h-1ZM3,24h1V25h-1ZM3,26h1V27h-1ZM3,28h1V29h-1ZM3,30h1V31h-1ZM3,32h1V33h-1ZM3,34h1V35h-1ZM5,8h1V9h-1ZM5,10h1V11h-1ZM5,12h1V13h-1ZM5,14h1V15h-1ZM5,16h1V17h-1ZM5,18h1V19h-1ZM5,20h1V21h-1ZM5,22h1V23h-1ZM5,24h1V25h-1ZM5,26h1V27h-1ZM5,28h1V29h-1ZM5,30h1V31h-1ZM5,32h1V33h-1ZM5,34h1V35h-1ZM7,8h1V9h-1ZM7,10h1V11h-1ZM7,12h1V13h-1ZM7,14h1V15h-1ZM7,16h1V17h-1ZM7,18h1V19h-1ZM7,20h1V21h-1ZM7,22h1V23h-1ZM7,24h1V25h-1ZM7,26h1V27h-1ZM7,28h1V29h-1ZM7,30h1V31h-1ZM7,32h1V33h-1ZM7,34h1V35h-1ZM8,3h1V2h-1ZM8,5h1V4h-1ZM8,7h1V6h-1ZM8,9h1V8h-1ZM8,11h1V10h-1ZM8,13h1V12h-1ZM8,15h1V14h-1ZM8,17h1V16h-1ZM8,19h1V18h-1ZM8,21h1V20h-1ZM8,23h1V22h-1ZM8,25h1V24h-1ZM8,27h1V26h-1ZM8,29h1V28h-1ZM8,31h1V30h-1ZM8,33h1V32h-1ZM8,35h1V34h-1ZM29,8h1V9h-1ZM30,8h1V9h-1ZM32,8h1V9h-1ZM33,8h1V9h-1ZM35,8h1V9h-1ZM36,8h1V9h-1ZM29,10h1V11h-1ZM30,10h1V11h-1ZM32,10h1V11h-1ZM33,10h1V11h-1ZM35,10h1V11h-1ZM36,10h1V11h-1ZM29,12h1V13h-1ZM30,12h1V13h-1ZM32,12h1V13h-1ZM33,12h1V13h-1ZM35,12h1V13h-1ZM36,12h1V13h-1ZM29,14h1V15h-1ZM30,14h1V15h-1ZM32,14h1V15h-1ZM33,14h1V15h-1ZM35,14h1V15h-1ZM36,14h1V15h-1ZM29,16h1V17h-1ZM30,16h1V17h-1ZM32,16h1V17h-1ZM33,16h1V17h-1ZM35,16h1V17h-1ZM36,16h1V17h-1ZM29,18h1V19h-1ZM30,18h1V19h-1ZM32,18h1V19h-1ZM33,18h1V19h-1ZM35,18h1V19h-1ZM36,18h1V19h-1ZM29,20h1V21h-1ZM30,20h1V21h-1ZM32,20h1V21h-1ZM33,20h1V21h-1ZM35,20h1V21h-1ZM36,20h1V21h-1ZM29,22h1V23h-1ZM30,22h1V23h-1ZM32,22h1V23h-1ZM33,22h1V23h-1ZM35,22h1V23h-1ZM36,22h1V23h-1ZM29,24h1V25h-1ZM30,24h1V25h-1ZM32,24h1V25h-1ZM33,24h1V25h-1ZM35,24h1V25h-1ZM36,24h1V25h-1ZM29,26h1V27h-1ZM30,26h1V27h-1ZM32,26h1V27h-1ZM33,26h1V27h-1ZM35,26h1V27h-1ZM36,26h1V27h-1ZM29,28h1V29h-1ZM30,28h1V29h-1ZM32,28h1V29h-1ZM33,28h1V29h-1ZM35,28h1V29h-1ZM36,28h1V29h-1ZM29,30h1V31h-1ZM30,30h1V31h-1ZM32,30h1V31h-1ZM33,30h1V31h-1ZM35,30h1V31h-1ZM36,30h1V31h-1ZM29,32h1V33h-1ZM30,32h1V33h-1ZM32,32h1V33h-1ZM33,32h1V33h-1ZM35,32h1V33h-1ZM36,32h1V33h-1ZM29,34h1V35h-1ZM30,34h1V35h-1ZM32,34h1V35h-1ZM33,34h1V35h-1ZM35,34h1V35h-1ZM36,34h1V35h-1Z"/>
            </svg>
            <p>{t.scanToDownloadAppModal}</p>
            <button className="close-button" onClick={() => setShowAppDownloadQR(false)}>
              {t.closeModal}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseDisplay;