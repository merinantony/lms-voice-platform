<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quiz;
use App\Models\QuizAttempt;

class QuizController extends Controller
{
    /**
     * Get quiz detail (excluding correct answers for security).
     */
    public function getQuiz(Request $request, $id)
    {
        $quiz = Quiz::with(['questions' => function ($query) {
            $query->select('id', 'quiz_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d')
                  ->inRandomOrder();
        }])->findOrFail($id);

        return response()->json($quiz);
    }

    /**
     * Submit a quiz for auto-evaluation.
     */
    public function submitQuiz(Request $request, $id)
    {
        $user = $request->user();
        $quiz = Quiz::with('questions')->findOrFail($id);

        $request->validate([
            'answers' => 'required|array',
        ]);

        $userAnswers = $request->input('answers'); // Format: [question_id => "A"]
        $questions = $quiz->questions;

        $score = 0;
        $total = $questions->count();
        $details = [];

        foreach ($questions as $question) {
            $userAns = $userAnswers[$question->id] ?? null;
            $isCorrect = false;

            if ($userAns && strtoupper($userAns) === strtoupper($question->correct_option)) {
                $score++;
                $isCorrect = true;
            }

            $details[] = [
                'question_id' => $question->id,
                'user_answer' => $userAns,
                'correct_option' => $question->correct_option,
                'is_correct' => $isCorrect
            ];
        }

        $percentage = $total > 0 ? round(($score / $total) * 100, 2) : 0;

        // Save student attempt
        $attempt = QuizAttempt::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'score' => $score,
            'total_questions' => $total,
            'percentage' => $percentage
        ]);

        return response()->json([
            'message' => 'Quiz evaluated successfully!',
            'score' => $score,
            'total_questions' => $total,
            'percentage' => $percentage,
            'attempt' => $attempt,
            'details' => $details
        ]);
    }
}
