import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('courses');
    const [loading, setLoading] = useState(true);

    // Data lists
    const [courses, setCourses] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentProgress, setStudentProgress] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);

    // Modal forms states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('course'); // course, chapter, question, student
    const [editId, setEditId] = useState(null); // null if creating, ID if editing
    const [showNotifications, setShowNotifications] = useState(false);
    const [readNotifications, setReadNotifications] = useState([]);

    // Form inputs
    const [courseForm, setCourseForm] = useState({ title: '', description: '' });
    const [chapterForm, setChapterForm] = useState({ course_id: '', title: '', description: '', video_url: '', pdf_url: '' });
    const [questionForm, setQuestionForm] = useState({ quiz_id: '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' });
    const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', grade: 'Grade 6', password: '' });

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Load courses
            const coursesRes = await api.get('/admin/courses');
            setCourses(coursesRes.data);

            // Load chapters
            const chaptersRes = await api.get('/admin/chapters');
            setChapters(chaptersRes.data);

            // Load questions
            const questionsRes = await api.get('/admin/quiz-questions');
            setQuizQuestions(questionsRes.data);

            // Load students
            const studentsRes = await api.get('/admin/students');
            setStudents(studentsRes.data);

            // Load reports
            const reportsRes = await api.get('/admin/reports');
            setStudentProgress(reportsRes.data.student_progress);
            setQuizAttempts(reportsRes.data.quiz_attempts);
            setQuizzes(reportsRes.data.quizzes || []);

            setLoading(false);
        } catch (error) {
            console.error("Error loading admin data:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                alert("Unauthorized access. Admin privileges required.");
                navigate('/dashboard');
            }
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('student_data'));
        if (!user || user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchAllData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('student_data');
        navigate('/');
    };

    // Open create modals
    const openCreateModal = (type) => {
        setModalType(type);
        setEditId(null);
        if (type === 'course') {
            setCourseForm({ title: '', description: '' });
        } else if (type === 'chapter') {
            setChapterForm({ course_id: courses[0]?.id || '', title: '', description: '', video_url: '', pdf_url: '' });
        } else if (type === 'question') {
            setQuestionForm({ quiz_id: quizzes[0]?.id || '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' });
        } else if (type === 'student') {
            setStudentForm({ name: '', email: '', phone: '', grade: 'Grade 6', password: '' });
        }
        setShowModal(true);
    };

    // Open edit modals
    const openEditModal = (type, item) => {
        setModalType(type);
        setEditId(item.id);
        if (type === 'course') {
            setCourseForm({ title: item.title, description: item.description || '' });
        } else if (type === 'chapter') {
            setChapterForm({ course_id: item.course_id, title: item.title, description: item.description, video_url: item.video_url, pdf_url: item.pdf_url || '' });
        } else if (type === 'question') {
            setQuestionForm({ quiz_id: item.quiz_id, question_text: item.question_text, option_a: item.option_a, option_b: item.option_b, option_c: item.option_c, option_d: item.option_d, correct_option: item.correct_option });
        } else if (type === 'student') {
            setStudentForm({ name: item.name, email: item.email, phone: item.phone || '', grade: item.grade, password: '' });
        }
        setShowModal(true);
    };

    // Delete actions
    const handleDelete = async (type, id) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        try {
            await api.delete(`/admin/${type}s/${id}`);
            fetchAllData();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete item. Please try again.");
        }
    };

    // Toggle Status action
    const handleToggleStatus = async (id) => {
        try {
            await api.post(`/admin/students/${id}/toggle-status`);
            fetchAllData();
        } catch (error) {
            console.error("Toggle status failed:", error);
            alert("Failed to toggle student account status.");
        }
    };

    // Submit handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'course') {
                if (editId) {
                    await api.put(`/admin/courses/${editId}`, courseForm);
                } else {
                    await api.post('/admin/courses', courseForm);
                }
            } else if (modalType === 'chapter') {
                if (editId) {
                    await api.put(`/admin/chapters/${editId}`, chapterForm);
                } else {
                    await api.post('/admin/chapters', chapterForm);
                }
            } else if (modalType === 'question') {
                if (editId) {
                    await api.put(`/admin/quiz-questions/${editId}`, questionForm);
                } else {
                    await api.post('/admin/quiz-questions', questionForm);
                }
            } else if (modalType === 'student') {
                if (editId) {
                    const payload = { ...studentForm };
                    if (!payload.password) delete payload.password;
                    await api.put(`/admin/students/${editId}`, payload);
                } else {
                    await api.post('/admin/students', studentForm);
                }
            }
            setShowModal(false);
            fetchAllData();
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Error processing request. Please check input values (like unique email checks).");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mr-3"></div>
                <p>Loading Admin Dashboard...</p>
            </div>
        );
    }

    // Compute admin notifications dynamically
    const notifications = [];

    // 1. New student signups (created in last 3 days)
    students.forEach(st => {
        const isNew = st.created_at && (Date.now() - new Date(st.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;
        if (isNew) {
            notifications.push({
                id: `student_${st.id}`,
                title: 'New Student Signup!',
                message: `${st.name} registered for grade "${st.grade}".`,
                time: st.created_at,
                icon: '👤'
            });
        }
    });

    // 2. Recent quiz attempt submissions (created in last 3 days)
    quizAttempts.forEach(attempt => {
        const isNew = attempt.created_at && (Date.now() - new Date(attempt.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;
        if (isNew) {
            notifications.push({
                id: `attempt_${attempt.id}`,
                title: 'Quiz Submission!',
                message: `${attempt.user?.name || 'A student'} scored ${attempt.percentage}% on ${attempt.quiz?.title || 'the assessment'}.`,
                time: attempt.created_at,
                icon: '📝'
            });
        }
    });

    // 3. New chapters added (created in last 3 days)
    chapters.forEach(ch => {
        const isNew = ch.created_at && (Date.now() - new Date(ch.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000;
        if (isNew) {
            notifications.push({
                id: `chapter_${ch.id}`,
                title: 'New Chapter Published!',
                message: `"${ch.title}" has been successfully added.`,
                time: ch.created_at,
                icon: '📚'
            });
        }
    });

    // Sort by created time
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const unreadNotifications = notifications.filter(n => !readNotifications.includes(n.id));

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
            {/* Top Navigation */}
            <nav className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center space-x-2">
                    <span className="text-2xl">⚙️</span>
                    <h1 className="text-xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">VoiceLMS Admin Panel</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 text-sm font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition"
                    >
                        Student Portal
                    </button>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2 bg-slate-950 hover:bg-slate-855 border border-slate-800 rounded-xl text-slate-350 hover:text-white transition relative"
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
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Recent Activity</h4>
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
                                        <p className="text-slate-500 text-center text-xs py-6">No new activity.</p>
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
                                                            <span className="text-[9px] text-slate-500 block mt-1">
                                                                {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
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
                        className="px-4 py-2 text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition"
                    >
                        Log Out
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 mt-10">
                {/* Tabs selection */}
                <div className="flex border-b border-slate-800 mb-8 space-x-4">
                    {['courses', 'chapters', 'questions', 'students', 'reports'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-4 font-black uppercase text-xs tracking-wider transition ${
                                activeTab === tab 
                                    ? 'border-b-2 border-indigo-500 text-indigo-400' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- TAB CONTENT: COURSES --- */}
                {activeTab === 'courses' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black">Course Management</h2>
                            <button 
                                onClick={() => openCreateModal('course')}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition shadow-md text-sm"
                            >
                                ＋ Add Course
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((c) => (
                                <div key={c.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{c.title}</h3>
                                        <p className="text-slate-400 text-sm mb-4 line-clamp-3">{c.description || 'No description provided.'}</p>
                                        <span className="inline-block text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-semibold mb-6">
                                            {c.chapters_count || 0} Chapters
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => openEditModal('course', c)}
                                            className="flex-1 py-2 text-xs bg-slate-800 hover:bg-slate-750 font-bold rounded-lg transition"
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete('course', c.id)}
                                            className="flex-1 py-2 text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg transition font-bold"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: CHAPTERS --- */}
                {activeTab === 'chapters' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black">Chapter Management</h2>
                            <button 
                                onClick={() => openCreateModal('chapter')}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition shadow-md text-sm"
                            >
                                ＋ Add Chapter
                            </button>
                        </div>
                        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Course</th>
                                        <th className="p-4">Video Link</th>
                                        <th className="p-4">PDF Assignment</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chapters.map((ch) => {
                                        const c = courses.find(item => item.id === ch.course_id);
                                        return (
                                            <tr key={ch.id} className="border-b border-slate-800/60 hover:bg-slate-850/40">
                                                <td className="p-4 font-bold text-white">{ch.title}</td>
                                                <td className="p-4 text-slate-300">{c ? c.title : `ID: ${ch.course_id}`}</td>
                                                <td className="p-4 text-xs text-indigo-400 truncate max-w-[200px]">{ch.video_url}</td>
                                                <td className="p-4 text-slate-400 truncate max-w-[150px]">{ch.pdf_url || 'None'}</td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => openEditModal('chapter', ch)}
                                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete('chapter', ch.id)}
                                                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-400 hover:text-white font-bold rounded-lg text-xs transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: QUIZ QUESTIONS --- */}
                {activeTab === 'questions' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black">Quiz Question Management</h2>
                            <button 
                                onClick={() => openCreateModal('question')}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition shadow-md text-sm"
                            >
                                ＋ Add Question
                            </button>
                        </div>
                        <div className="space-y-4">
                            {quizQuestions.map((q, idx) => (
                                <div key={q.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-md font-bold text-white leading-relaxed">
                                            {idx + 1}. {q.question_text}
                                        </h4>
                                        <div className="flex space-x-2 shrink-0">
                                            <button 
                                                onClick={() => openEditModal('question', q)}
                                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs transition"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete('question', q.id)}
                                                className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-xs transition font-bold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300 mb-4 bg-slate-950/40 p-4 rounded-xl">
                                        <p className={q.correct_option === 'A' ? 'text-emerald-400 font-black' : ''}>A) {q.option_a}</p>
                                        <p className={q.correct_option === 'B' ? 'text-emerald-400 font-black' : ''}>B) {q.option_b}</p>
                                        <p className={q.correct_option === 'C' ? 'text-emerald-400 font-black' : ''}>C) {q.option_c}</p>
                                        <p className={q.correct_option === 'D' ? 'text-emerald-400 font-black' : ''}>D) {q.option_d}</p>
                                    </div>
                                    <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Correct Choice: {q.correct_option}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: STUDENTS --- */}
                {activeTab === 'students' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black">Student Account Management</h2>
                            <button 
                                onClick={() => openCreateModal('student')}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition shadow-md text-sm"
                            >
                                ＋ Add Student
                            </button>
                        </div>
                        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                        <th className="p-4">Student Info</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Phone Number</th>
                                        <th className="p-4">Grade/Class</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((studentItem) => {
                                        const avUrl = studentItem.avatar_url 
                                            ? (studentItem.avatar_url.startsWith('http') ? studentItem.avatar_url : `http://127.0.0.1:8000${studentItem.avatar_url}`)
                                            : null;
                                        return (
                                            <tr key={studentItem.id} className="border-b border-slate-800/60 hover:bg-slate-850/40">
                                                <td className="p-4 font-bold text-white flex items-center space-x-3">
                                                    {avUrl ? (
                                                        <img src={avUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-350 border border-slate-750">
                                                            {studentItem.name?.charAt(0).toUpperCase() || 'S'}
                                                        </div>
                                                    )}
                                                    <span>{studentItem.name}</span>
                                                </td>
                                                <td className="p-4 text-slate-300">{studentItem.email}</td>
                                                <td className="p-4 text-slate-400">{studentItem.phone || '—'}</td>
                                                <td className="p-4 text-slate-400">{studentItem.grade}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                        studentItem.status === 'active'
                                                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                                            : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                                                    }`}>
                                                        {studentItem.status === 'active' ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button 
                                                        onClick={() => handleToggleStatus(studentItem.id)}
                                                        className={`px-3 py-1.5 font-bold rounded-lg text-xs transition border ${
                                                            studentItem.status === 'active'
                                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black hover:border-amber-500'
                                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-500'
                                                        }`}
                                                    >
                                                        {studentItem.status === 'active' ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditModal('student', studentItem)}
                                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-lg text-xs transition border border-slate-700"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete('student', studentItem.id)}
                                                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-450 hover:text-white font-bold rounded-lg text-xs transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-500 font-bold">
                                                No students registered yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB CONTENT: REPORTS --- */}
                {activeTab === 'reports' && (
                    <div className="space-y-10">
                        {/* Student Course Progress */}
                        <div>
                            <h3 className="text-xl font-black mb-4">Student Course Progress</h3>
                            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Grade/Class</th>
                                            <th className="p-4">Course Enrolled</th>
                                            <th className="p-4">Learning Progress (%)</th>
                                            <th className="p-4">Highest Quiz Score (%)</th>
                                            <th className="p-4">Quiz Attempts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentProgress.map((p, idx) => (
                                            <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-850/40">
                                                <td className="p-4 font-bold text-white">{p.student_name}</td>
                                                <td className="p-4 text-slate-350">{p.student_email}</td>
                                                <td className="p-4 text-slate-400">{p.student_grade || 'N/A'}</td>
                                                <td className="p-4 text-slate-300 font-medium">{p.course_title}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="font-extrabold text-indigo-300">{p.progress_percentage}%</span>
                                                        <div className="w-20 bg-slate-850 h-2 rounded-full overflow-hidden">
                                                            <div className="bg-indigo-500 h-2" style={{ width: `${p.progress_percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={`p-4 font-bold ${p.quiz_score !== null ? (p.quiz_score >= 60 ? 'text-emerald-400' : 'text-amber-500') : 'text-slate-500'}`}>
                                                    {p.quiz_score !== null ? `${p.quiz_score}%` : 'Not Attempted'}
                                                </td>
                                                <td className="p-4 text-slate-450">{p.quiz_attempts_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Quiz Scores Log */}
                        <div>
                            <h3 className="text-xl font-black mb-4">Recent Quiz Attempt Submissions</h3>
                            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                            <th className="p-4">Student</th>
                                            <th className="p-4">Quiz Title</th>
                                            <th className="p-4">Score</th>
                                            <th className="p-4">Percentage</th>
                                            <th className="p-4">Submitted At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quizAttempts.map((attempt) => (
                                            <tr key={attempt.id} className="border-b border-slate-800/60 hover:bg-slate-850/40">
                                                <td className="p-4 font-bold text-white">{attempt.user?.name}</td>
                                                <td className="p-4 text-slate-300">{attempt.quiz?.title || 'Course Quiz'}</td>
                                                <td className="p-4 text-slate-405">{attempt.score} / {attempt.total_questions}</td>
                                                <td className={`p-4 font-extrabold ${attempt.percentage >= 60 ? 'text-emerald-400' : 'text-amber-500'}`}>
                                                    {attempt.percentage}%
                                                </td>
                                                <td className="p-4 text-xs text-slate-450">
                                                    {new Date(attempt.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {quizAttempts.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-slate-500 font-semibold">
                                                    No quiz attempts submitted yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL FORM OVERLAY --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 relative">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xl transition"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-black mb-6 border-b border-slate-800 pb-3">
                            {editId ? 'Edit' : 'Create'} {modalType === 'course' ? 'Course' : modalType === 'chapter' ? 'Chapter' : 'Quiz Question'}
                        </h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Course Form */}
                            {modalType === 'course' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Title</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={courseForm.title}
                                            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                        <textarea 
                                            rows="4"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={courseForm.description}
                                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </>
                            )}

                            {/* Chapter Form */}
                            {modalType === 'chapter' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Course Selection</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={chapterForm.course_id}
                                            onChange={(e) => setChapterForm({ ...chapterForm, course_id: e.target.value })}
                                            required
                                        >
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Chapter Title</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={chapterForm.title}
                                            onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description</label>
                                        <textarea 
                                            rows="3"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={chapterForm.description}
                                            onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                                            required
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">YouTube Embed URL</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm placeholder-slate-650"
                                            value={chapterForm.video_url}
                                            onChange={(e) => setChapterForm({ ...chapterForm, video_url: e.target.value })}
                                            placeholder="https://www.youtube.com/embed/QuROim1m8sE"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">PDF Assignment Link</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={chapterForm.pdf_url}
                                            onChange={(e) => setChapterForm({ ...chapterForm, pdf_url: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Quiz Question Form */}
                            {modalType === 'question' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Quiz Target</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={questionForm.quiz_id}
                                            onChange={(e) => setQuestionForm({ ...questionForm, quiz_id: e.target.value })}
                                            required
                                        >
                                            {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Question Text</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={questionForm.question_text}
                                            onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Option A</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                                value={questionForm.option_a}
                                                onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Option B</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                                value={questionForm.option_b}
                                                onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Option C</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                                value={questionForm.option_c}
                                                onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Option D</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                                value={questionForm.option_d}
                                                onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Correct Option</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm font-bold text-indigo-400"
                                            value={questionForm.correct_option}
                                            onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value })}
                                            required
                                        >
                                            <option value="A">Option A</option>
                                            <option value="B">Option B</option>
                                            <option value="C">Option C</option>
                                            <option value="D">Option D</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Student Form */}
                            {modalType === 'student' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={studentForm.name}
                                            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={studentForm.email}
                                            onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                                value={studentForm.phone}
                                                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Grade / Class</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm font-bold text-indigo-400"
                                                value={studentForm.grade}
                                                onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                                                required
                                            >
                                                <option value="Grade 6">Grade 6</option>
                                                <option value="Grade 7">Grade 7</option>
                                                <option value="Grade 8">Grade 8</option>
                                                <option value="Grade 9">Grade 9</option>
                                                <option value="Grade 10">Grade 10</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                            {editId ? 'Password (leave empty to keep unchanged)' : 'Initial Password'}
                                        </label>
                                        <input 
                                            type="password" 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 text-white text-sm"
                                            value={studentForm.password}
                                            onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                                            required={!editId}
                                            placeholder={editId ? "••••••••" : "Initial dummy password"}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="mt-8 flex space-x-3">
                                <button 
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-white rounded-xl transition"
                                >
                                    Save Changes
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold rounded-xl transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
