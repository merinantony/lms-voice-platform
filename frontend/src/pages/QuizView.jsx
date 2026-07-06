import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import api from '../api';
import FloatingChatbot from '../components/FloatingChatbot';

export default function QuizView() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    const cardRef = useRef(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await api.get(`/quizzes/${id}`);
                setQuiz(response.data);
                setQuestions(response.data.questions || []);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching quiz:", error);
                navigate('/dashboard');
            }
        };

        fetchQuiz();
    }, [id, navigate]);

    // Animate question transitions
    useEffect(() => {
        if (!loading && questions.length > 0 && !results) {
            gsap.fromTo(cardRef.current,
                { opacity: 0, x: 50 },
                { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
            );
        }
    }, [currentStep, loading, questions.length, results]);

    const handleOptionSelect = (questionId, optionKey) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: optionKey
        });
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        // Double check all answered
        if (Object.keys(selectedAnswers).length < questions.length) {
            alert("Please answer all questions before submitting!");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post(`/quizzes/${id}/submit`, {
                answers: selectedAnswers
            });
            setResults(response.data);
            
            // Trigger celebration confetti if passed (60% or higher score)
            if (response.data.percentage >= 60) {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }
        } catch (error) {
            console.error("Error submitting quiz:", error);
            alert("Failed to submit assessment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-slate-400">Loading Assessment Questions...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 text-center">
                <h2 className="text-2xl font-bold">No Questions Found</h2>
                <p className="text-slate-400 mt-2">This assessment currently doesn't have any questions seeded.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-2.5 bg-indigo-600 rounded-lg font-bold">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentStep];
    const isAnswered = !!selectedAnswers[currentQuestion.id];
    const progressPercentage = Math.round(((currentStep + 1) / questions.length) * 100);

    // If quiz is completed, show results screen
    if (results) {
        const scorePercentage = results.percentage;
        const total = results.total_questions;
        const score = results.score;
        const pass = scorePercentage >= 60; // 60% passing mark

        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6 flex items-center justify-center">
                <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    {/* Result Circle Header */}
                    <div className="text-center mb-8">
                        <span className="text-5xl">{pass ? "🏆" : "💪"}</span>
                        <h2 className="text-3xl font-black mt-4 text-white">Quiz Evaluation Completed!</h2>
                        <p className="text-slate-400 mt-1">Here is your immediate performance card</p>
                    </div>

                    {/* Score display */}
                    <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-950/60 border border-slate-850 p-6 rounded-2xl">
                        <div className="text-center border-r border-slate-800">
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Accuracy Score</span>
                            <h3 className={`text-4xl font-black mt-2 ${pass ? 'text-emerald-400' : 'text-amber-500'}`}>
                                {scorePercentage}%
                            </h3>
                            <span className="text-xs text-slate-400 mt-1 block">{score} of {total} Correct</span>
                        </div>
                        <div className="text-center flex flex-col justify-center items-center">
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Status</span>
                            <span className={`px-4 py-1.5 rounded-full font-black mt-3 text-sm border ${
                                pass 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                                {pass ? "PASSED" : "KEEP TRYING"}
                            </span>
                        </div>
                    </div>

                    {/* Review Section */}
                    <h4 className="text-lg font-bold text-slate-200 mb-4">Question Breakdown:</h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-8 border-b border-slate-800 pb-6">
                        {questions.map((q, idx) => {
                            const details = results.details?.find(d => d.question_id === q.id) || {};
                            const userAns = selectedAnswers[q.id];
                            const isCorrect = details.is_correct;
                            const correctOptionText = q[`option_${details.correct_option?.toLowerCase()}`];
                            const userOptionText = q[`option_${userAns?.toLowerCase()}`];

                            return (
                                <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-rose-950/20 border-rose-900/30'}`}>
                                    <p className="text-sm font-semibold text-slate-200">
                                        Q{idx + 1}: {q.question_text}
                                    </p>
                                    <div className="mt-2 text-xs space-y-1">
                                        <p className={`${isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`}>
                                            Your choice: {userAns}) {userOptionText || 'No Answer'}
                                        </p>
                                        {!isCorrect && (
                                            <p className="text-emerald-400 font-bold">
                                                Correct choice: {details.correct_option}) {correctOptionText}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition duration-200 shadow-md shadow-indigo-900/20 text-center"
                    >
                        Back to Learning Dashboard
                    </button>
                    {/* Floating Support Chatbot */}
                    <FloatingChatbot />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-6 flex flex-col justify-between max-w-3xl mx-auto">
            {/* Header */}
            <header className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
                            {quiz?.title || 'Course Assessment'}
                        </span>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">
                        Question {currentStep + 1} of {questions.length}
                    </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                    <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </header>

            {/* Question Card */}
            <main ref={cardRef} className="flex-grow flex items-center justify-center my-6">
                <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl">
                    <h3 className="text-xl md:text-2xl font-bold leading-relaxed text-white">
                        {currentQuestion.question_text}
                    </h3>
                    
                    {/* Option Grid */}
                    <div className="grid grid-cols-1 gap-4 mt-8">
                        {['A', 'B', 'C', 'D'].map((key) => {
                            const optionText = currentQuestion[`option_${key.toLowerCase()}`];
                            const isSelected = selectedAnswers[currentQuestion.id] === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleOptionSelect(currentQuestion.id, key)}
                                    className={`text-left p-4 rounded-xl border transition duration-200 flex items-start space-x-3 group ${
                                        isSelected
                                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                            : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-950/80 hover:border-slate-700 hover:text-white'
                                    }`}
                                >
                                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isSelected
                                            ? 'bg-indigo-600 border-indigo-400 text-white'
                                            : 'border-slate-700 text-slate-400 group-hover:border-slate-500'
                                    }`}>
                                        {key}
                                    </span>
                                    <span className="text-sm font-medium leading-relaxed">{optionText}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Navigation controls */}
            <footer className="flex justify-between items-center mt-8">
                <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={`px-6 py-2.5 rounded-xl font-bold border transition ${
                        currentStep === 0
                            ? 'opacity-40 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'border-slate-700 hover:bg-slate-900 text-slate-300'
                    }`}
                >
                    ← Previous
                </button>

                {currentStep < questions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={!isAnswered}
                        className={`px-6 py-2.5 rounded-xl font-bold transition flex items-center space-x-2 ${
                            isAnswered
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                        }`}
                    >
                        <span>Next Question</span>
                        <span>→</span>
                    </button>
                ) : (
                    <button
                        onClick={handleSubmitQuiz}
                        disabled={!isAnswered || isSubmitting}
                        className={`px-8 py-2.5 rounded-xl font-black transition ${
                            isAnswered && !isSubmitting
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                        }`}
                    >
                        {isSubmitting ? 'Evaluating...' : 'Submit Assessment'}
                    </button>
                )}
            </footer>
            {/* Floating Support Chatbot */}
            <FloatingChatbot />
        </div>
    );
}
