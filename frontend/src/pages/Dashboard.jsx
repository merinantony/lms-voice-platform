import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import api from '../api';
import Certificate from '../components/Certificate';
import ProfileModal from '../components/ProfileModal';
import FloatingChatbot from '../components/FloatingChatbot';

export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCertificate, setShowCertificate] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [readNotifications, setReadNotifications] = useState([]);
    const [currentStudent, setCurrentStudent] = useState(null);
    const navigate = useNavigate();
    
    // Refs for GSAP animations
    const headerRef = useRef(null);
    const progressRef = useRef(null);
    const cardsRef = useRef([]);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/dashboard');
                setDashboardData(response.data);
                setCurrentStudent(response.data.student);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard:", error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    navigate('/');
                }
            }
        };

        fetchDashboard();
    }, [navigate]);

    // Confetti effect at 100% progress completion
    useEffect(() => {
        if (!loading && dashboardData && dashboardData.progress_percentage === 100) {
            const duration = 2.5 * 1000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 }
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 }
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [loading, dashboardData]);

    // Trigger GSAP animations once data is loaded
    useEffect(() => {
        if (!loading && dashboardData) {
            // Animate Header
            gsap.fromTo(headerRef.current, 
                { opacity: 0, y: -20 }, 
                { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
            );

            // Animate Progress Bar width
            gsap.fromTo(progressRef.current, 
                { width: "0%" }, 
                { width: `${dashboardData.progress_percentage}%`, duration: 1.5, ease: "power4.out", delay: 0.3 }
            );

            // Stagger Animate Chapter Cards
            gsap.fromTo(cardsRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "back.out(1.5)", delay: 0.4 }
            );

            // Animate Sidebar elements
            gsap.fromTo(sidebarRef.current,
                { opacity: 0, x: 30 },
                { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", delay: 0.5 }
            );
        }
    }, [loading, dashboardData]);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('student_data');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const { student, course, completed_chapters, progress_percentage, upcoming_assessment, leaderboard } = dashboardData;

    // Achievements dynamic badges
    const chaptersList = course?.chapters || [];
    
    // Compute newly added uncompleted chapters (created in last 3 days)
    const newChapters = chaptersList.filter(ch => {
        const isNew = ch.created_at && (Date.now() - new Date(ch.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;
        const isCompleted = completed_chapters.includes(ch.id);
        return isNew && !isCompleted;
    });

    // Compute student notifications
    const notifications = [];
    if (course && course.chapters) {
        course.chapters.forEach(ch => {
            const isNew = ch.created_at && (Date.now() - new Date(ch.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;
            if (isNew) {
                notifications.push({
                    id: `chapter_${ch.id}`,
                    title: 'New Chapter Available!',
                    message: `"${ch.title}" has been added to the course.`,
                    time: ch.created_at,
                    icon: '✨'
                });
            }
        });
    }
    if (progress_percentage === 100) {
        notifications.push({
            id: 'course_completed',
            title: 'Course Completed!',
            message: 'Congratulations! You can now claim your official gold-sealed certificate.',
            time: new Date().toISOString(),
            icon: '🏆'
        });
    }
    const unreadNotifications = notifications.filter(n => !readNotifications.includes(n.id));
    const unlockedBadges = [
        {
            id: 'cadet',
            title: 'Quantum Cadet',
            emoji: '🎖️',
            desc: 'Completed Chapter 1',
            unlocked: chaptersList[0] && completed_chapters.includes(chaptersList[0].id),
            color: 'from-amber-400 to-orange-500'
        },
        {
            id: 'weaver',
            title: 'Gate Weaver',
            emoji: '🔮',
            desc: 'Completed Chapter 2',
            unlocked: chaptersList[1] && completed_chapters.includes(chaptersList[1].id),
            color: 'from-purple-405 to-indigo-500'
        },
        {
            id: 'composer',
            title: 'Composer Maestro',
            emoji: '🎹',
            desc: 'Completed Chapter 3',
            unlocked: chaptersList[2] && completed_chapters.includes(chaptersList[2].id),
            color: 'from-sky-400 to-blue-500'
        },
        {
            id: 'einstein',
            title: 'Quantum Scholar',
            emoji: '👑',
            desc: 'Assessment Score >= 80%',
            unlocked: upcoming_assessment && upcoming_assessment.highest_score >= 80,
            color: 'from-pink-500 to-rose-500'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
            {/* Top Navigation */}
            <nav className="bg-slate-905/80 backdrop-blur-lg border-b border-slate-850 sticky top-0 z-40 px-8 py-4.5 flex justify-between items-center shadow-lg">
                <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <svg className="w-6 h-6 text-white animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                            <path d="M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
                        </svg>
                    </div>
                    <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">VoiceLMS</span>
                </div>
                <div className="flex items-center space-x-6">
                    {/* User Profile Summary */}
                    <div 
                        onClick={() => setShowProfileModal(true)}
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-85 transition bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-800"
                    >
                        {currentStudent?.avatar_url ? (
                            <img 
                                src={currentStudent.avatar_url.startsWith('http') ? currentStudent.avatar_url : `http://127.0.0.1:8000${currentStudent.avatar_url}`} 
                                alt="Avatar" 
                                className="w-8 h-8 object-cover rounded-full border border-indigo-500/50" 
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs border border-indigo-400">
                                {currentStudent?.name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                        )}
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-extrabold text-slate-200">{currentStudent?.name}</p>
                            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">{currentStudent?.grade}</p>
                        </div>
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-350 hover:text-white transition relative"
                        >
                            <span className="text-lg">🔔</span>
                            {unreadNotifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                                    {unreadNotifications.length}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-left">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Latest News</h4>
                                    {unreadNotifications.length > 0 && (
                                        <button 
                                            onClick={() => setReadNotifications(notifications.map(n => n.id))}
                                            className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                                    {notifications.length === 0 ? (
                                        <p className="text-slate-500 text-center text-xs py-6">No new notifications.</p>
                                    ) : (
                                        notifications.map((n) => {
                                            const isUnread = !readNotifications.includes(n.id);
                                            return (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => {
                                                        if (isUnread) setReadNotifications([...readNotifications, n.id]);
                                                    }}
                                                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                                                        isUnread 
                                                            ? 'bg-slate-950/60 border-indigo-500/20 hover:border-indigo-500/35' 
                                                            : 'bg-slate-950/10 border-slate-900/40 opacity-60'
                                                    }`}
                                                >
                                                    <div className="flex items-start space-x-2">
                                                        <span className="text-sm">{n.icon}</span>
                                                        <div className="flex-grow">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-extrabold text-slate-200">{n.title}</span>
                                                                {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                                                            </div>
                                                            <p className="text-slate-400 mt-0.5 leading-relaxed text-[10px]">{n.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleLogout} 
                        className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-rose-400 bg-slate-800 hover:bg-slate-800/80 border border-slate-700 hover:border-rose-900/30 rounded-lg transition duration-200"
                    >
                        Log Out
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Welcome & Banner Card */}
                <div ref={headerRef} className="mb-10 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
                    <div className="flex-1 space-y-4 relative z-10 text-center md:text-left">
                        <span className="inline-block px-3.5 py-1 bg-indigo-500/20 border border-indigo-500/35 text-indigo-300 text-xs font-black uppercase tracking-wider rounded-full">
                            Grade 6–10 Student Portal
                        </span>
                        
                        {currentStudent?.school_name && (
                            <p className="text-xs text-indigo-400 font-extrabold tracking-wide uppercase flex items-center justify-center md:justify-start space-x-1.5">
                                <span>🏫</span>
                                <span>Studying at {currentStudent.school_name}</span>
                            </p>
                        )}

                        <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent">
                            Welcome, {currentStudent?.name}!
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
                            Embark on an interactive learning adventure into the quantum realm! Watch videos, complete challenges, and earn your official completion badge.
                        </p>
                        <div className="flex justify-center md:justify-start items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-slate-400 font-bold tracking-wide uppercase">Your learning assistant is online</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center md:justify-start">
                            <button
                                onClick={() => setShowProfileModal(true)}
                                className="px-4.5 py-2.5 bg-indigo-600/25 hover:bg-indigo-600/45 text-indigo-300 font-black rounded-xl border border-indigo-500/20 text-xs transition flex items-center space-x-1.5 shadow-md shadow-indigo-950/20 hover:scale-[1.02]"
                            >
                                <span>⚙️</span>
                                <span>Edit Profile Settings</span>
                            </button>
                        </div>
                    </div>
                    <div className="w-40 h-40 md:w-52 md:h-52 shrink-0 relative z-10 select-none animate-bounce-slow">
                        <img 
                            src="/quantum_tutor.png" 
                            alt="Quantum Robot Tutor" 
                            className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(99,102,241,0.4)]" 
                        />
                    </div>

                    <style>{`
                        @keyframes bounce-slow {
                            0%, 100% {
                                transform: translateY(0);
                            }
                            50% {
                                transform: translateY(-10px);
                            }
                        }
                        .animate-bounce-slow {
                            animation: bounce-slow 4s ease-in-out infinite;
                        }
                        @keyframes spin-slow {
                            from {
                                transform: rotate(0deg);
                            }
                            to {
                                transform: rotate(360deg);
                            }
                        }
                        .animate-spin-slow {
                            animation: spin-slow 12s linear infinite;
                        }
                    `}</style>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Learning Path */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Course Overview Card */}
                        {course ? (
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-10">
                                    <div>
                                        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full">
                                            Active Course
                                        </span>
                                        <h3 className="text-2xl font-black text-white mt-2">{course.title}</h3>
                                        <p className="text-slate-400 text-sm mt-1">{course.description}</p>
                                    </div>
                                    <div className="text-center sm:text-right shrink-0">
                                        <span className="text-xs text-slate-500 block">Learning Progress</span>
                                        <span className="text-4xl font-black tracking-tight text-indigo-400">
                                            {progress_percentage}%
                                        </span>
                                    </div>
                                </div>

                                {/* The Progress Bar */}
                                <div className="w-full bg-slate-800/80 rounded-full h-4 overflow-hidden border border-slate-700/50 mb-4 relative z-10">
                                    <div 
                                        ref={progressRef}
                                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-4 rounded-full" 
                                        style={{ width: '0%' }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 font-medium">
                                    <span>{completed_chapters.length} of {course.chapters?.length || 0} chapters complete</span>
                                    {progress_percentage === 100 && (
                                        <span className="text-amber-400 font-bold">🎉 Course Completed!</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                                <p className="text-slate-400">No courses available at the moment.</p>
                            </div>
                        )}

                        {/* Learning Modules / Chapters Grid */}
                        <div>
                            {newChapters.length > 0 && (
                                <div className="mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center space-x-3 shadow-md shadow-indigo-950/10 animate-pulse-slow">
                                    <span className="text-xl">🔔</span>
                                    <div className="flex-grow text-xs leading-relaxed">
                                        <span className="font-extrabold text-indigo-300">New Lesson Alert! </span>
                                        <span className="text-slate-300">
                                            "{newChapters.map(ch => ch.title).join(', ')}" has been added. Open the lessons below to learn!
                                        </span>
                                    </div>
                                </div>
                            )}

                            <h3 className="text-2xl font-black text-white mb-6 flex items-center space-x-2">
                                <span>📚</span>
                                <span>Your Learning Modules</span>
                            </h3>
                            {course && course.chapters && course.chapters.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {course.chapters.map((chapter, index) => {
                                        const isCompleted = completed_chapters.includes(chapter.id);
                                        const isNew = chapter.created_at && (Date.now() - new Date(chapter.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;
                                        return (
                                            <div 
                                                key={chapter.id} 
                                                ref={(el) => (cardsRef.current[index] = el)}
                                                className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/60 rounded-2xl p-6 shadow-lg transition duration-300 relative overflow-hidden flex flex-col group"
                                            >
                                                {isCompleted ? (
                                                    <div className="absolute top-0 right-0 bg-emerald-500/10 border-l border-b border-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-bl-xl">
                                                        ✓ Completed
                                                    </div>
                                                ) : isNew ? (
                                                    <div className="absolute top-0 right-0 bg-rose-500/20 border-l border-b border-rose-500/30 text-rose-400 text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-bl-xl animate-pulse">
                                                        🔥 NEW LESSON
                                                    </div>
                                                ) : (
                                                    <div className="absolute top-0 right-0 bg-indigo-500/10 border-l border-b border-indigo-500/20 text-indigo-400 text-[10px] font-black px-3 py-1 uppercase tracking-wider rounded-bl-xl">
                                                        Chapter {index + 1}
                                                    </div>
                                                )}
                                                <div className="mt-4 flex-grow">
                                                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition duration-200">{chapter.title}</h4>
                                                    <p className="text-slate-400 text-sm mt-2 line-clamp-3 leading-relaxed">{chapter.description}</p>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => navigate(`/chapter/${chapter.id}`)}
                                                    className={`w-full py-2.5 mt-6 rounded-xl font-bold transition duration-200 flex items-center justify-center space-x-2 ${
                                                        isCompleted 
                                                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60' 
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md hover:shadow-indigo-900/20'
                                                    }`}
                                                >
                                                    <span>{isCompleted ? 'Review Chapter' : 'Start Learning'}</span>
                                                    <span>→</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-slate-400">No chapters in this course.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sidebar (Upcoming Assessments, Leaderboard, Rewards) */}
                    <div ref={sidebarRef} className="space-y-8">
                        {/* Certificate Claim Card */}
                        {progress_percentage === 100 && (
                            <div className="bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-500 rounded-3xl p-6 shadow-xl relative overflow-hidden animate-pulse">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"></div>
                                <h4 className="text-xl font-black text-white">🏆 Course Certificate</h4>
                                <p className="text-amber-100 text-sm mt-1">Excellent work! You have successfully completed the course.</p>
                                <button 
                                    onClick={() => setShowCertificate(true)}
                                    className="w-full mt-4 bg-white hover:bg-slate-100 text-amber-900 font-extrabold py-2.5 rounded-xl transition duration-200 shadow-md hover:scale-[1.02]"
                                >
                                    Claim Certificate
                                </button>
                            </div>
                        )}

                        {/* Assessment / Quiz Card */}
                        {upcoming_assessment && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
                                <h4 className="text-lg font-black text-white flex items-center space-x-2">
                                    <span>📝</span>
                                    <span>Upcoming Assessment</span>
                                </h4>
                                
                                <div className="mt-4 bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
                                    <h5 className="font-bold text-slate-200">{upcoming_assessment.title}</h5>
                                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{upcoming_assessment.description}</p>
                                    <span className="inline-block mt-3 text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-medium">
                                        {upcoming_assessment.question_count} Questions
                                    </span>
                                </div>

                                {upcoming_assessment.completed ? (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between text-sm bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-indigo-300">
                                            <span className="font-bold">Highest Score</span>
                                            <span className="font-black text-lg">{upcoming_assessment.highest_score}%</span>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/quiz/${upcoming_assessment.quiz_id}`)}
                                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition duration-200"
                                        >
                                            Retake Assessment
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => navigate(`/quiz/${upcoming_assessment.quiz_id}`)}
                                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold py-2.5 rounded-xl transition duration-200 shadow-md shadow-purple-900/20"
                                    >
                                        Take Assessment Quiz
                                    </button>
                                )}
                            </div>
                        )}

                         {/* Achievements Badge Card */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <h4 className="text-lg font-black text-white flex items-center space-x-2 mb-4">
                                <span>🎖️</span>
                                <span>Unlocked Achievements</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {unlockedBadges.map((badge) => (
                                    <div 
                                        key={badge.id}
                                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition duration-300 relative group ${
                                            badge.unlocked
                                                ? 'bg-slate-950/60 border-indigo-500/10 hover:border-indigo-500/30 hover:-translate-y-0.5'
                                                : 'bg-slate-950/20 border-slate-900 opacity-40 select-none'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md ${
                                            badge.unlocked 
                                                ? `bg-gradient-to-br ${badge.color} text-white` 
                                                : 'bg-slate-800 text-slate-500'
                                        }`}>
                                            {badge.unlocked ? badge.emoji : '🔒'}
                                        </div>
                                        <p className="text-xs font-bold mt-2 text-slate-200">{badge.title}</p>
                                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{badge.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard Card */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <h4 className="text-lg font-black text-white flex items-center space-x-2 mb-4">
                                <span>🏆</span>
                                <span>Student Leaderboard</span>
                            </h4>
                            
                            {leaderboard && leaderboard.length > 0 ? (
                                <div className="space-y-3">
                                    {leaderboard.map((studentRank, idx) => {
                                        const isTop3 = studentRank.rank <= 3;
                                        const medal = studentRank.rank === 1 ? '🥇' : studentRank.rank === 2 ? '🥈' : studentRank.rank === 3 ? '🥉' : '🎖️';
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`flex items-center justify-between p-3 rounded-2xl border transition duration-200 ${
                                                    studentRank.name === student.name
                                                        ? 'bg-indigo-500/10 border-indigo-500/40 shadow-indigo-900/10'
                                                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/60'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xl shrink-0">{medal}</span>
                                                    <div>
                                                        <p className="text-sm font-extrabold text-slate-200">
                                                            {studentRank.name} {studentRank.name === student.name && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md ml-1 font-bold">You</span>}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{studentRank.grade}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-indigo-300">{studentRank.score}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-500 text-sm">
                                    No leaderboard entries yet. Take the assessment to rank!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Certificate Modal */}
            {showCertificate && (
                <Certificate 
                    studentName={student.name}
                    studentGrade={student.grade}
                    courseTitle={course ? course.title : "IBM Q Foundation"}
                    onClose={() => setShowCertificate(false)}
                />
            )}

            {/* Profile Settings Modal */}
            {showProfileModal && (
                <ProfileModal 
                    user={currentStudent}
                    onClose={() => setShowProfileModal(false)}
                    onProfileUpdate={(updatedUser) => {
                        setCurrentStudent(updatedUser);
                    }}
                />
            )}

            {/* Floating Support Chatbot */}
            <FloatingChatbot />
        </div>
    );
}
