import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import AITutor from '../components/AITutor';

export default function ChapterView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [chapter, setChapter] = useState(null);
    const [isCompleting, setIsCompleting] = useState(false);

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                const response = await api.get(`/chapters/${id}`);
                setChapter(response.data);
            } catch (error) {
                console.error("Error fetching chapter:", error);
                navigate('/dashboard'); // Kick back if chapter doesn't exist
            }
        };
        fetchChapter();
    }, [id, navigate]);

    const handleComplete = async () => {
        setIsCompleting(true);
        try {
            await api.post(`/chapters/${id}/complete`);
            // Redirect back to dashboard to see the progress bar update!
            navigate('/dashboard');
        } catch (error) {
            console.error("Error marking complete:", error);
            setIsCompleting(false);
        }
    };

    if (!chapter) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation */}
            <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                <button onClick={() => navigate('/dashboard')} className="text-blue-600 font-bold flex items-center">
                    ← Back to Dashboard
                </button>
                <h1 className="text-xl font-bold text-slate-800">{chapter.title}</h1>
            </nav>

            {/* Main Content Area - Split Layout */}
            <main className="flex-grow max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Video and Content (Takes up 2/3 of screen) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Player */}
                    <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-lg bg-black">
                        <iframe 
                            src={chapter.video_url} 
                            title={chapter.title}
                            className="w-full h-[450px]"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>

                    {/* Chapter Details */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">{chapter.title}</h2>
                        <p className="text-slate-600 text-lg mb-8">{chapter.description}</p>
                        
                        <div className="flex space-x-4">
                            <a 
                                href={chapter.pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition"
                            >
                                📄 View PDF Assignment
                            </a>
                            <button 
                                onClick={handleComplete}
                                disabled={isCompleting}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition shadow-md shadow-green-200"
                            >
                                {isCompleting ? 'Saving...' : '✅ Mark as Completed'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: AI Agent (Takes up 1/3 of screen) */}
                <div className="lg:col-span-1">
                    <AITutor chapterTitle={chapter.title} />
                </div>
            </main>
        </div>
    );
}
