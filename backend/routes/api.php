<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Requires Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // This route lets React check who is currently logged in
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Student Dashboard & Chapter Routes
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'getStudentDashboard']);
    Route::get('/chapters/{id}', [\App\Http\Controllers\DashboardController::class, 'getChapter']);
    Route::post('/chapters/{id}/complete', [\App\Http\Controllers\DashboardController::class, 'markChapterComplete']);
    Route::post('/ai/ask', [\App\Http\Controllers\AITutorController::class, 'askQuestion']);

    // Student Quiz Routes
    Route::get('/quizzes/{id}', [\App\Http\Controllers\QuizController::class, 'getQuiz']);
    Route::post('/quizzes/{id}/submit', [\App\Http\Controllers\QuizController::class, 'submitQuiz']);

    // Student Profile Routes
    Route::put('/profile', [\App\Http\Controllers\ProfileController::class, 'updateProfile']);
    Route::put('/profile/password', [\App\Http\Controllers\ProfileController::class, 'updatePassword']);
    Route::post('/profile/avatar', [\App\Http\Controllers\ProfileController::class, 'uploadAvatar']);

    // Protected Admin Routes
    Route::middleware('admin')->group(function () {
        Route::get('/admin/courses', [\App\Http\Controllers\AdminController::class, 'indexCourses']);
        Route::post('/admin/courses', [\App\Http\Controllers\AdminController::class, 'storeCourse']);
        Route::put('/admin/courses/{id}', [\App\Http\Controllers\AdminController::class, 'updateCourse']);
        Route::delete('/admin/courses/{id}', [\App\Http\Controllers\AdminController::class, 'destroyCourse']);

        Route::get('/admin/chapters', [\App\Http\Controllers\AdminController::class, 'indexChapters']);
        Route::post('/admin/chapters', [\App\Http\Controllers\AdminController::class, 'storeChapter']);
        Route::put('/admin/chapters/{id}', [\App\Http\Controllers\AdminController::class, 'updateChapter']);
        Route::delete('/admin/chapters/{id}', [\App\Http\Controllers\AdminController::class, 'destroyChapter']);

        Route::get('/admin/quiz-questions', [\App\Http\Controllers\AdminController::class, 'indexQuizQuestions']);
        Route::post('/admin/quiz-questions', [\App\Http\Controllers\AdminController::class, 'storeQuizQuestion']);
        Route::put('/admin/quiz-questions/{id}', [\App\Http\Controllers\AdminController::class, 'updateQuizQuestion']);
        Route::delete('/admin/quiz-questions/{id}', [\App\Http\Controllers\AdminController::class, 'destroyQuizQuestion']);

        // Admin Student CRUD Routes
        Route::get('/admin/students', [\App\Http\Controllers\AdminController::class, 'indexStudents']);
        Route::post('/admin/students', [\App\Http\Controllers\AdminController::class, 'storeStudent']);
        Route::put('/admin/students/{id}', [\App\Http\Controllers\AdminController::class, 'updateStudent']);
        Route::delete('/admin/students/{id}', [\App\Http\Controllers\AdminController::class, 'destroyStudent']);
        Route::post('/admin/students/{id}/toggle-status', [\App\Http\Controllers\AdminController::class, 'toggleStudentStatus']);

        Route::get('/admin/reports', [\App\Http\Controllers\AdminController::class, 'getReports']);
    });
});
