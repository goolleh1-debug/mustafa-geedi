import React, { useState, useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { translations, courseLevels, Course } from './interfaces'; // Import from new interfaces file, including Course type

// Lazy load the CourseDisplay component
const LazyCourseDisplay = React.lazy(() => import('./CourseDisplay'));

const App = () => {
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null); // Use Course type
  const [language, setLanguage] = useState<'so' | 'en'>('so');
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<Array<'correct' | 'incorrect' | null>>([]);
  const [quizExplanations, setQuizExplanations] = useState<Array<string | null>>([]);
  const [explanationLoading, setExplanationLoading] = useState<boolean[]>([]);

  // New states for granular loading
  const [loadingOutline, setLoadingOutline] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // PWA Install Prompt states
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const t = translations[language];

  useEffect(() => {
    // Check if the app is already installed as a PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the app
      console.log('beforeinstallprompt fired.');
    };

    const handleAppInstalled = () => {
      // The app was successfully installed
      console.log('PWA was installed!');
      setIsAppInstalled(true);
      // Clear the deferred prompt since it's no longer needed
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      (deferredPrompt as any).prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await (deferredPrompt as any).userChoice;
      // Optionally, send analytics event with outcome of user choice
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and it can't be used again. Clear it.
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsAppInstalled(true); // Assume installed if accepted
      } else {
        // User dismissed the prompt, might still want QR or try again later
        // The button text will revert to "Get App" or similar if no deferredPrompt
      }
    }
  };

  const handleGenerateCourse = async (topic: string) => {
    if (isGeneratingCourse) return;

    setIsGeneratingCourse(true);
    setError(null);
    setCourse(null);
    setQuizAnswers([]);
    setQuizFeedback([]);
    setQuizExplanations([]);
    setExplanationLoading([]);
    // Reset granular loading states
    setLoadingOutline(false);
    setLoadingLessons(false);
    setLoadingSummary(false);
    setLoadingQuiz(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const languageName = language === 'so' ? 'Somali' : 'English';
      
      const prompt = `You are an expert instructional designer for a corporate training platform. 
      Based on the topic "${topic}", generate a comprehensive learning course. The course content should be in the ${languageName} language.
      For each lesson, provide a brief one-sentence summary.
      The "Knowledge Check" section should include a mix of multiple-choice and true/false questions.
      The output must be a single, valid JSON object that strictly adheres to the provided schema. Do not include any text, markdown formatting, or code block syntax before or after the JSON object.
      All generated text in the JSON response (titles, outlines, lessons, summaries, quizzes) MUST be in the ${languageName} language.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: `The title of the course in ${languageName}.` },
                    outline: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: `A bulleted list of topics covered in the course, in ${languageName}.`
                    },
                    lessons: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.STRING, description: `Detailed content for the lesson, in ${languageName}.` }
                            },
                            required: ["title", "content"]
                        },
                        description: "An array of lesson objects."
                    },
                    lessonSummaries: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: `An array of brief one-sentence summaries in ${languageName}, one for each lesson, in the same order.`
                    },
                    summary: { type: Type.STRING, description: `A concise summary of the entire course in ${languageName}.` },
                    quiz: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                type: { type: Type.STRING, description: "The type of question, either 'multiple-choice' or 'true-false'." },
                                options: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: `For 'multiple-choice', a list of answers. For 'true-false', this must be ['${t.trueOption}', '${t.falseOption}'].`
                                },
                                correctAnswer: { type: Type.STRING, description: "The exact string of the correct option." }
                            },
                            required: ["question", "type", "options", "correctAnswer"]
                        },
                        description: `An array of quiz question objects in ${languageName} with varied types.`
                    }
                },
                 required: ["title", "outline", "lessons", "lessonSummaries", "summary", "quiz"]
            }
        }
      });
      
      const jsonText = response.text.trim();
      const parsedCourse: Course = JSON.parse(jsonText); // Use Course type
      setCourse(parsedCourse);
      setQuizAnswers(new Array(parsedCourse.quiz.length).fill(null));
      setQuizFeedback(new Array(parsedCourse.quiz.length).fill(null));
      setQuizExplanations(new Array(parsedCourse.quiz.length).fill(null));
      setExplanationLoading(new Array(parsedCourse.quiz.length).fill(false));

      // After course is successfully parsed, stop global loading and trigger granular loading simulation
      setIsGeneratingCourse(false); 
      
      setLoadingOutline(true);
      setTimeout(() => {
        setLoadingOutline(false);
        setLoadingLessons(true);
        setTimeout(() => {
          setLoadingLessons(false);
          setLoadingSummary(true);
          setTimeout(() => {
            setLoadingSummary(false);
            setLoadingQuiz(true);
            setTimeout(() => {
              setLoadingQuiz(false);
            }, 500); // Quiz loads after 500ms from summary
          }, 500); // Summary loads after 500ms from lessons
        }, 500); // Lessons loads after 500ms from outline
      }, 500); // Outline loads after 500ms from course generation finish


    } catch (err) {
      console.error(err);
      setError(t.generatingError);
      setIsGeneratingCourse(false); // Ensure global loading stops on error
      // Also stop granular loading in case of error
      setLoadingOutline(false);
      setLoadingLessons(false);
      setLoadingSummary(false);
      setLoadingQuiz(false);
    }
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as 'so' | 'en');
      setCourse(null);
      setQuizAnswers([]);
      setQuizFeedback([]);
      setQuizExplanations([]);
      setExplanationLoading([]);
      // Clear granular loading states and overall generation status
      setLoadingOutline(false);
      setLoadingLessons(false);
      setLoadingSummary(false);
      setLoadingQuiz(false);
      setIsGeneratingCourse(false); 
  }
  
  const handleAnswerSelection = async (qIndex: number, option: string) => {
    // Prevent answering if already answered or explanation is loading for this question
    if (quizAnswers[qIndex] !== null || explanationLoading[qIndex]) return; 

    const newAnswers = [...quizAnswers];
    newAnswers[qIndex] = option;
    setQuizAnswers(newAnswers);

    const newFeedback = [...quizFeedback];
    if (option === course?.quiz[qIndex].correctAnswer) {
      newFeedback[qIndex] = 'correct';
      setQuizFeedback(newFeedback);
    } else {
      newFeedback[qIndex] = 'incorrect';
      setQuizFeedback(newFeedback);

      // Trigger AI for explanation if the answer is incorrect
      const newExplanationLoading = [...explanationLoading];
      newExplanationLoading[qIndex] = true;
      setExplanationLoading(newExplanationLoading);

      const newExplanations = [...quizExplanations];
      newExplanations[qIndex] = t.loadingExplanation; // Set loading placeholder
      setQuizExplanations(newExplanations);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const languageName = language === 'so' ? 'Somali' : 'English';
        const question = course?.quiz[qIndex].question;
        const correctAnswer = course?.quiz[qIndex].correctAnswer;
        const selectedAnswer = option;

        const explanationPrompt = `For the question: "${question}", the correct answer is "${correctAnswer}". If someone chose "${selectedAnswer}", why would that be wrong? Provide a brief explanation of why the correct answer is right and the chosen answer is wrong, in less than 100 words. Respond in ${languageName}.`;
        
        const explanationResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash', // Using a lighter model for explanations
          contents: explanationPrompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 150, 
            thinkingConfig: { thinkingBudget: 50 } 
          }
        });

        const explanationText = explanationResponse.text.trim();
        const updatedExplanations = [...newExplanations]; // Use newExplanations to avoid race condition if state updates before API call finishes
        updatedExplanations[qIndex] = explanationText;
        setQuizExplanations(updatedExplanations);

      } catch (explanationErr) {
        console.error("Error generating explanation:", explanationErr);
        const updatedExplanations = [...newExplanations]; // Use newExplanations
        updatedExplanations[qIndex] = t.failedExplanation;
        setQuizExplanations(updatedExplanations);
      } finally {
        const newExplanationLoading = [...explanationLoading];
        newExplanationLoading[qIndex] = false;
        setExplanationLoading(newExplanationLoading);
      }
    }
  };

  return (
    <div className="container">
      <header>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <select className="language-selector" value={language} onChange={handleLanguageChange} aria-label={t.selectLanguage}>
            <option value="so">Soomaali</option>
            <option value="en">English</option>
        </select>
      </header>

      <div className="input-section">
        <div className="curriculum-grid">
          {courseLevels[language].map((level, index) => (
            <button 
              key={index} 
              className="level-button"
              onClick={() => handleGenerateCourse(level.topic)}
              disabled={isGeneratingCourse}
            >
              {level.title}
            </button>
          ))}
        </div>
      </div>

      {isGeneratingCourse && (
        <div className="loader" aria-live="polite">
          <div className="spinner"></div>
        </div>
      )}

      {error && <div className="error" role="alert">{error}</div>}

      {course && (
        <Suspense fallback={
          <div className="loader" aria-live="polite">
            <div className="spinner"></div>
          </div>
        }>
          <LazyCourseDisplay
            course={course}
            t={t}
            quizAnswers={quizAnswers}
            quizFeedback={quizFeedback}
            quizExplanations={quizExplanations}
            explanationLoading={explanationLoading}
            handleAnswerSelection={handleAnswerSelection}
            loadingOutline={loadingOutline}
            loadingLessons={loadingLessons}
            loadingSummary={loadingSummary}
            loadingQuiz={loadingQuiz}
            deferredPrompt={deferredPrompt}
            isAppInstalled={isAppInstalled}
            onInstallApp={handleInstallApp}
          />
        </Suspense>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);