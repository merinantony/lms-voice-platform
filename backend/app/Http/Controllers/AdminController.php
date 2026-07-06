<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    // --- Course CRUD ---
    public function indexCourses()
    {
        return response()->json(Course::withCount('chapters')->get());
    }

    public function storeCourse(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course = Course::create($validated);

        // Auto-create a quiz for the course if it doesn't have one
        Quiz::firstOrCreate([
            'course_id' => $course->id,
        ], [
            'title' => $course->title . ' Quiz',
            'description' => 'Assessment quiz for ' . $course->title,
        ]);

        return response()->json($course->load('quiz'), 201);
    }

    public function updateCourse(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $course->update($validated);
        return response()->json($course);
    }

    public function destroyCourse($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();
        return response()->json(['message' => 'Course deleted successfully']);
    }

    // --- Chapter CRUD ---
    public function indexChapters()
    {
        return response()->json(Chapter::all());
    }

    public function storeChapter(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'video_url' => 'required|string',
            'pdf_url' => 'nullable|string',
        ]);

        $chapter = Chapter::create($validated);
        return response()->json($chapter, 201);
    }

    public function updateChapter(Request $request, $id)
    {
        $chapter = Chapter::findOrFail($id);
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'video_url' => 'required|string',
            'pdf_url' => 'nullable|string',
        ]);

        $chapter->update($validated);
        return response()->json($chapter);
    }

    public function destroyChapter($id)
    {
        $chapter = Chapter::findOrFail($id);
        $chapter->delete();
        return response()->json(['message' => 'Chapter deleted successfully']);
    }

    // --- Quiz Questions CRUD ---
    public function indexQuizQuestions()
    {
        return response()->json(QuizQuestion::with('quiz')->get());
    }

    public function storeQuizQuestion(Request $request)
    {
        $validated = $request->validate([
            'quiz_id' => 'required|exists:quizzes,id',
            'question_text' => 'required|string',
            'option_a' => 'required|string',
            'option_b' => 'required|string',
            'option_c' => 'required|string',
            'option_d' => 'required|string',
            'correct_option' => 'required|in:A,B,C,D,a,b,c,d',
        ]);

        // Force correct option to uppercase
        $validated['correct_option'] = strtoupper($validated['correct_option']);

        $question = QuizQuestion::create($validated);
        return response()->json($question, 201);
    }

    public function updateQuizQuestion(Request $request, $id)
    {
        $question = QuizQuestion::findOrFail($id);
        $validated = $request->validate([
            'quiz_id' => 'required|exists:quizzes,id',
            'question_text' => 'required|string',
            'option_a' => 'required|string',
            'option_b' => 'required|string',
            'option_c' => 'required|string',
            'option_d' => 'required|string',
            'correct_option' => 'required|in:A,B,C,D,a,b,c,d',
        ]);

        // Force correct option to uppercase
        $validated['correct_option'] = strtoupper($validated['correct_option']);

        $question->update($validated);
        return response()->json($question);
    }

    public function destroyQuizQuestion($id)
    {
        $question = QuizQuestion::findOrFail($id);
        $question->delete();
        return response()->json(['message' => 'Question deleted successfully']);
    }

    // --- Student Progress & Quiz Scores Reports ---
    public function getReports()
    {
        $students = User::where('role', 'student')->get();
        $courses = Course::with('chapters')->get();

        $progressData = [];
        foreach ($students as $student) {
            foreach ($courses as $course) {
                $completedChapterCount = DB::table('chapter_user')
                    ->where('user_id', $student->id)
                    ->whereIn('chapter_id', $course->chapters->pluck('id'))
                    ->count();

                $totalChapters = $course->chapters->count();
                $progress = $totalChapters > 0 ? round(($completedChapterCount / $totalChapters) * 100) : 0;

                // Find highest quiz score for this student in this course quiz
                $quizAttempt = null;
                $quiz = Quiz::where('course_id', $course->id)->first();
                if ($quiz) {
                    $quizAttempt = QuizAttempt::where('user_id', $student->id)
                        ->where('quiz_id', $quiz->id)
                        ->orderByDesc('percentage')
                        ->first();
                }

                $progressData[] = [
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'student_email' => $student->email,
                    'student_grade' => $student->grade,
                    'course_title' => $course->title,
                    'progress_percentage' => $progress,
                    'quiz_score' => $quizAttempt ? $quizAttempt->percentage : null,
                    'quiz_attempts_count' => $quiz ? QuizAttempt::where('user_id', $student->id)->where('quiz_id', $quiz->id)->count() : 0,
                ];
            }
        }

        // Fetch recent quiz attempts
        $quizAttempts = QuizAttempt::with(['user', 'quiz.course'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'student_progress' => $progressData,
            'quiz_attempts' => $quizAttempts,
            'quizzes' => Quiz::with('course')->get()
        ]);
    }

    // --- Student CRUD & Status Management ---
    public function indexStudents()
    {
        return response()->json(User::where('role', 'student')->orderBy('created_at', 'desc')->get());
    }

    public function storeStudent(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'grade' => 'required|string|max:50',
            'password' => 'required|string|min:6',
        ]);

        $student = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'grade' => $validated['grade'],
            'password' => bcrypt($validated['password']),
            'role' => 'student',
            'status' => 'active'
        ]);

        return response()->json($student, 201);
    }

    public function updateStudent(Request $request, $id)
    {
        $student = User::where('role', 'student')->findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'grade' => 'required|string|max:50',
            'password' => 'nullable|string|min:6',
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'grade' => $validated['grade'],
        ];

        if (!empty($validated['password'])) {
            $data['password'] = bcrypt($validated['password']);
        }

        $student->update($data);
        return response()->json($student);
    }

    public function destroyStudent($id)
    {
        $student = User::where('role', 'student')->findOrFail($id);
        $student->delete();
        return response()->json(['message' => 'Student account deleted successfully']);
    }

    public function toggleStudentStatus($id)
    {
        $student = User::where('role', 'student')->findOrFail($id);
        $student->status = $student->status === 'active' ? 'disabled' : 'active';
        $student->save();

        return response()->json([
            'message' => 'Student status updated successfully',
            'status' => $student->status,
            'student' => $student
        ]);
    }
}
