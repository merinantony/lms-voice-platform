import { useState, useEffect, useRef } from 'react';
import api from '../api';

export default function FloatingChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [inputText, setInputText] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { sender: 'ai', text: "Hi! 👋 I am your Quantum AI Tutor. If you are stuck anywhere in the learning portal, feel free to ask me anything here!" }
    ]);
    const [showTip, setShowTip] = useState(true);
    
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom whenever history changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isThinking]);

    // Set up speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
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
        }
    }, []);

    // Show floating help tip for 8 seconds, then hide
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTip(false);
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported or permission denied in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSendQuestion = async (text) => {
        const query = text || inputText;
        if (!query.trim()) return;
        
        const newHistory = [...chatHistory, { sender: 'student', text: query }];
        setChatHistory(newHistory);
        setInputText('');
        setIsThinking(true);

        try {
            const response = await api.post('/ai/ask', { 
                message: query,
                chapter_title: 'Global Helper'
            });
            
            const aiReply = response.data.reply;
            setChatHistory([...newHistory, { sender: 'ai', text: aiReply }]);
            
            // Text to speech
            speakText(aiReply);
        } catch (error) {
            console.error("AI Error:", error);
            setChatHistory([...newHistory, { sender: 'ai', text: "Sorry, I am facing connectivity issues. Please try again!" }]);
        } finally {
            setIsThinking(false);
        }
    };

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0; 
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSendQuestion();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Floating Chat Button Tip Bubble */}
            {showTip && !isOpen && (
                <div className="absolute bottom-16 right-0 bg-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-2xl shadow-xl w-40 text-center animate-bounce border border-indigo-500 select-none">
                    Stuck? Chat with us! 💬
                    <div className="absolute -bottom-1 right-6 w-3.5 h-3.5 bg-indigo-600 rotate-45 border-r border-b border-indigo-500"></div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => {
                        setIsOpen(true);
                        setShowTip(false);
                    }}
                    className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-110 transition duration-300 relative group animate-pulse-slow"
                >
                    <span className="text-2.5xl">🤖</span>
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                </button>
            )}

            {/* Interactive Chat Panel */}
            {isOpen && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-80 sm:w-96 h-[500px] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative">
                    {/* Header */}
                    <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between select-none">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                                🤖
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white">AI Study Buddy</h4>
                                <span className="text-[10px] text-emerald-400 flex items-center font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                                    Ask me anything!
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                if (isListening) recognitionRef.current?.stop();
                                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                            }}
                            className="text-slate-400 hover:text-slate-200 transition text-sm p-1.5 rounded-lg hover:bg-slate-900"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-grow p-4 overflow-y-auto space-y-3.5 bg-slate-950/20">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                    msg.sender === 'student' 
                                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-900/10' 
                                        : 'bg-slate-800 border border-slate-750 text-slate-200 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-750 text-slate-400 p-3 rounded-2xl rounded-bl-none text-xs flex items-center space-x-2 animate-pulse">
                                    <span>🤖 thinking</span>
                                    <span className="flex space-x-1">
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input controls */}
                    <div className="p-3 bg-slate-950 border-t border-slate-850 flex items-center space-x-2">
                        <button
                            onClick={toggleListening}
                            className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 border ${
                                isListening 
                                    ? 'bg-rose-600 border-rose-500 text-white animate-pulse' 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                            title={isListening ? "Stop listening" : "Speak to tutor"}
                        >
                            🎙️
                        </button>
                        <input
                            type="text"
                            placeholder="Type a question here..."
                            className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={() => handleSendQuestion()}
                            disabled={!inputText.trim() && !isListening}
                            className={`p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md shadow-indigo-950/20 text-xs shrink-0 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed`}
                            title="Send Message"
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
