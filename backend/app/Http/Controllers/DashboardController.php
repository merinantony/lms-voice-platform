<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStudentDashboard(Request $request)
    {
        $user = $request->user();

        // 1. Fetch the first course (IBM Q Foundation) along with its chapters
        $course = Course::with('chapters')->first();
        if (!$course) {
            return response()->json([
                'student' => [
                    'name' => $user->name,
                    'grade' => $user->grade,
                ],
                'course' => null,
                'completed_chapters' => [],
                'progress_percentage' => 0,
                'upcoming_assessment' => null,
                'leaderboard' => []
            ]);
        }

        // 2. Find which chapters this specific student has completed using the pivot table
        $completedChapterIds = DB::table('chapter_user')
            ->where('user_id', $user->id)
            ->whereIn('chapter_id', $course->chapters->pluck('id'))
            ->pluck('chapter_id')
            ->toArray();

        // 3. Calculate Progress Percentage
        $totalChapters = $course->chapters->count();
        $completedCount = count($completedChapterIds);
        $progressPercentage = $totalChapters > 0 ? round(($completedCount / $totalChapters) * 100) : 0;

        // 4. Fetch the quiz for this course
        $quiz = Quiz::where('course_id', $course->id)->first();
        $upcomingAssessment = null;
        if ($quiz) {
            $highestAttempt = QuizAttempt::where('user_id', $user->id)
                ->where('quiz_id', $quiz->id)
                ->orderByDesc('percentage')
                ->first();

            $upcomingAssessment = [
                'quiz_id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'question_count' => $quiz->questions()->count(),
                'highest_score' => $highestAttempt ? $highestAttempt->percentage : null,
                'completed' => !is_null($highestAttempt)
            ];
        }

        // 5. Fetch leaderboard (top 5 student scores, excluding admins)
        $leaderboard = QuizAttempt::whereHas('user', function ($query) {
                $query->where('role', 'student');
            })
            ->with('user')
            ->select('user_id', DB::raw('MAX(percentage) as max_percentage'))
            ->groupBy('user_id')
            ->orderByDesc('max_percentage')
            ->take(5)
            ->get()
            ->map(function ($attempt, $index) {
                return [
                    'rank' => $index + 1,
                    'name' => $attempt->user->name ?? 'Unknown Student',
                    'grade' => $attempt->user->grade ?? 'N/A',
                    'score' => $attempt->max_percentage
                ];
            });

        // 6. Return everything to React
        return response()->json([
            'student' => [
                'name' => $user->name,
                'grade' => $user->grade,
                'phone' => $user->phone,
                'school_name' => $user->school_name,
                'avatar_url' => $user->avatar_url,
            ],
            'course' => $course,
            'completed_chapters' => $completedChapterIds,
            'progress_percentage' => $progressPercentage,
            'upcoming_assessment' => $upcomingAssessment,
            'leaderboard' => $leaderboard
        ]);
    }

    // Fetch a single chapter
    public function getChapter($id)
    {
        $chapter = \App\Models\Chapter::findOrFail($id);
        return response()->json($chapter);
    }

    // Mark a chapter as completed
    public function markChapterComplete(Request $request, $id)
    {
        $user = $request->user();
        
        // Insert into the pivot table if they haven't completed it yet
        \Illuminate\Support\Facades\DB::table('chapter_user')->updateOrInsert(
            ['user_id' => $user->id, 'chapter_id' => $id],
            ['completed_at' => now()]
        );

        return response()->json(['message' => 'Chapter completed successfully!']);
    }
}
