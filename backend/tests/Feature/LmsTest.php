<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\Chapter;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class LmsTest extends TestCase
{
    use RefreshDatabase;

    protected $student;
    protected $admin;
    protected $course;
    protected $chapter1;
    protected $quiz;
    protected $question;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create a student
        $this->student = User::create([
            'name' => 'Merin',
            'email' => 'merin@test.com',
            'password' => bcrypt('password123'),
            'grade' => 'Grade 10',
            'role' => 'student',
        ]);

        // 2. Create an admin
        $this->admin = User::create([
            'name' => 'Admin Teacher',
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        // 3. Create a course and chapters
        $this->course = Course::create([
            'title' => 'IBM Q Foundation',
            'description' => 'A complete introduction to Quantum Computing concepts.'
        ]);

        $this->chapter1 = Chapter::create([
            'course_id' => $this->course->id,
            'title' => 'Chapter 1: Intro to Qubits',
            'description' => 'Learn the basics of superposition.',
            'video_url' => 'https://www.youtube.com/embed/QuROim1m8sE',
            'pdf_url' => 'https://example.com/assignment.pdf'
        ]);

        // 4. Create a quiz and a question
        $this->quiz = Quiz::create([
            'course_id' => $this->course->id,
            'title' => 'IBM Q Assessment',
            'description' => 'Quiz description'
        ]);

        $this->question = QuizQuestion::create([
            'quiz_id' => $this->quiz->id,
            'question_text' => 'What is the unit of quantum information?',
            'option_a' => 'Classical Bit',
            'option_b' => 'Qubit',
            'option_c' => 'Byte',
            'option_d' => 'Node',
            'correct_option' => 'B'
        ]);
    }

    public function test_student_login()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'merin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_student_dashboard_endpoints()
    {
        $this->actingAs($this->student);

        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('student.name', 'Merin')
            ->assertJsonPath('progress_percentage', 0)
            ->assertJsonStructure(['student', 'course', 'completed_chapters', 'progress_percentage', 'upcoming_assessment', 'leaderboard']);
    }

    public function test_marking_chapter_complete_updates_progress()
    {
        $this->actingAs($this->student);

        // Initially 0% progress
        $response = $this->getJson('/api/dashboard');
        $response->assertJsonPath('progress_percentage', 0);

        // Mark chapter 1 completed
        $response = $this->postJson("/api/chapters/{$this->chapter1->id}/complete");
        $response->assertStatus(200);

        // Progress should be 100% (since 1/1 chapters completed)
        $response = $this->getJson('/api/dashboard');
        $response->assertJsonPath('progress_percentage', 100);
        $this->assertContains($this->chapter1->id, $response->json('completed_chapters'));
    }

    public function test_quiz_fetching_does_not_leak_correct_option()
    {
        $this->actingAs($this->student);

        $response = $this->getJson("/api/quizzes/{$this->quiz->id}");

        $response->assertStatus(200);
        $questionData = $response->json('questions.0');

        $this->assertArrayHasKey('question_text', $questionData);
        $this->assertArrayHasKey('option_a', $questionData);
        $this->assertArrayHasKey('option_b', $questionData);
        // Correct option should be hidden
        $this->assertArrayNotHasKey('correct_option', $questionData);
    }

    public function test_quiz_evaluation_and_submission()
    {
        $this->actingAs($this->student);

        // Submit correct answer
        $response = $this->postJson("/api/quizzes/{$this->quiz->id}/submit", [
            'answers' => [
                $this->question->id => 'B'
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('score', 1)
            ->assertJsonPath('percentage', 100);

        // Submit incorrect answer
        $response = $this->postJson("/api/quizzes/{$this->quiz->id}/submit", [
            'answers' => [
                $this->question->id => 'A'
            ]
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('score', 0)
            ->assertJsonPath('percentage', 0);
    }

    public function test_regular_students_blocked_from_admin_endpoints()
    {
        $this->actingAs($this->student);

        $response = $this->getJson('/api/admin/reports');
        $response->assertStatus(403);
    }

    public function test_admin_can_access_endpoints()
    {
        $this->actingAs($this->admin);

        $response = $this->getJson('/api/admin/reports');
        $response->assertStatus(200)
            ->assertJsonStructure(['student_progress', 'quiz_attempts', 'quizzes']);
    }

    public function test_disabled_user_cannot_login()
    {
        // Disable the student
        $this->student->update(['status' => 'disabled']);

        $response = $this->postJson('/api/login', [
            'email' => 'merin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_student_can_update_profile_and_password()
    {
        $this->actingAs($this->student);

        // Test Profile Info Update
        $response = $this->putJson('/api/profile', [
            'phone' => '1234567890',
            'school_name' => 'Quantum Academy'
        ]);

        $response->assertStatus(200);
        $this->student->refresh();
        $this->assertEquals('1234567890', $this->student->phone);
        $this->assertEquals('Quantum Academy', $this->student->school_name);

        // Test Password Update
        $response = $this->putJson('/api/profile/password', [
            'current_password' => 'password123',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123'
        ]);

        $response->assertStatus(200);
    }

    public function test_student_can_upload_avatar()
    {
        Storage::fake('public');
        $this->actingAs($this->student);

        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->postJson('/api/profile/avatar', [
            'avatar' => $file
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['avatar_url']);

        $this->student->refresh();
        $this->assertNotNull($this->student->avatar_url);

        // Verify the file was stored
        $storedName = basename($this->student->avatar_url);
        Storage::disk('public')->assertExists('avatars/' . $storedName);
    }

    public function test_admin_can_manage_students()
    {
        $this->actingAs($this->admin);

        // 1. Create student
        $response = $this->postJson('/api/admin/students', [
            'name' => 'Jane Doe',
            'email' => 'jane@test.com',
            'phone' => '9876543210',
            'grade' => 'Grade 8',
            'password' => 'changeme123'
        ]);

        $response->assertStatus(201);
        $studentId = $response->json('id');
        $this->assertDatabaseHas('users', ['email' => 'jane@test.com', 'role' => 'student']);

        // 2. List students
        $response = $this->getJson('/api/admin/students');
        $response->assertStatus(200);
        $this->assertCount(2, $response->json()); // Merin and Jane

        // 3. Edit student
        $response = $this->putJson("/api/admin/students/{$studentId}", [
            'name' => 'Jane Smith',
            'email' => 'jane@test.com',
            'phone' => '1112223333',
            'grade' => 'Grade 9'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['name' => 'Jane Smith', 'grade' => 'Grade 9']);

        // 4. Toggle status
        $response = $this->postJson("/api/admin/students/{$studentId}/toggle-status");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'disabled');

        $this->assertDatabaseHas('users', ['email' => 'jane@test.com', 'status' => 'disabled']);

        // 5. Delete student
        $response = $this->deleteJson("/api/admin/students/{$studentId}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['email' => 'jane@test.com']);
    }
}
