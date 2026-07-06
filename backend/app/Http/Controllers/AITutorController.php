<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AITutorController extends Controller
{
    public function askQuestion(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'chapter_title' => 'nullable|string'
        ]);

        $studentMessage = $request->message;
        $studentName = $request->user()->name;

        // SIMULATED AI DELAY
        sleep(1); 

        // MOCK AI RESPONSE (We will replace this with a real LLM API call later)
        $aiReply = "Hello {$studentName}! I heard you say: '{$studentMessage}'. I am your AI tutor. I am working perfectly, and ready to teach you about quantum computing!";

        return response()->json([
            'reply' => $aiReply
        ]);
    }
}
