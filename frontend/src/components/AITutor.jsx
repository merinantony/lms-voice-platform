import { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function AITutor({ chapterTitle }) {
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    
    const recognitionRef = useRef(null);

    // Initialize the browser's speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleSendQuestion(text);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech recognition not supported in this browser.");
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSendQuestion = async (text) => {
        if (!text.trim()) return;
        
        // Add student message to chat UI
        const newHistory = [...chatHistory, { sender: 'student', text }];
        setChatHistory(newHistory);
        setTranscript('');
        setIsThinking(true);

        try {
            const response = await api.post('/ai/ask', { 
                message: text,
                chapter_title: chapterTitle 
            });
            
            const aiReply = response.data.reply;
            
            // Add AI response to chat UI
            setChatHistory([...newHistory, { sender: 'ai', text: aiReply }]);
            
            // Speak the response out loud!
            speakText(aiReply);

        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setIsThinking(false);
        }
    };

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Optional: You can change the voice/pitch here
            utterance.rate = 1.0; 
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl h-[600px] flex flex-col shadow-xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isThinking ? 'bg-yellow-400 animate-ping' : 'bg-green-400'}`}></div>
                <h3 className="text-white font-bold">AI Voice Tutor</h3>
            </div>

            {/* Chat History */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {chatHistory.length === 0 ? (
                    <p className="text-slate-500 text-center text-sm mt-10">
                        Click the microphone and ask a question!
                    </p>
                ) : (
                    chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.sender === 'student' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 text-slate-400 p-3 rounded-lg rounded-bl-none text-sm animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            {/* Control Bar */}
            <div className="p-4 bg-slate-800 flex justify-center border-t border-slate-700">
                <button 
                    onClick={toggleListening}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg hover:scale-105 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                >
                    {isListening ? '🛑' : '🎙️'}
                </button>
            </div>
        </div>
    );
}
