<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Course;
use App\Models\Chapter;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Recreate your test student
        User::create([
            'name' => 'Merin',
            'email' => 'merin@test.com',
            'password' => Hash::make('password123'),
            'grade' => 'Grade 10',
            'role' => 'student',
        ]);

        // 2. Create an admin user
        User::create([
            'name' => 'Admin Teacher',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // 3. Create the LMS Course
        $course = Course::create([
            'title' => 'IBM Q Foundation',
            'description' => 'A complete introduction to Quantum Computing concepts and the IBM Q framework.'
        ]);

        // 4. Create 3 Chapters for the Course
        Chapter::create([
            'course_id' => $course->id,
            'title' => 'Chapter 1: Intro to Qubits',
            'description' => 'Learn the basics of superposition and quantum states.',
            'video_url' => 'https://www.youtube.com/embed/QuROim1m8sE', // Sample YouTube embed
            'pdf_url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        ]);

        Chapter::create([
            'course_id' => $course->id,
            'title' => 'Chapter 2: Quantum Logic Gates',
            'description' => 'Understanding how gates manipulate qubits.',
            'video_url' => 'https://www.youtube.com/embed/F_Riqjdh2oM',
            'pdf_url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        ]);

        Chapter::create([
            'course_id' => $course->id,
            'title' => 'Chapter 3: The IBM Composer',
            'description' => 'Hands-on interactive learning with the IBM Quantum Composer.',
            'video_url' => 'https://www.youtube.com/embed/V9hE1yF20oM',
            'pdf_url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        ]);

        // 5. Create a Quiz for the Course
        $quiz = \App\Models\Quiz::create([
            'course_id' => $course->id,
            'title' => 'IBM Q Foundation Assessment',
            'description' => 'Test your understanding of quantum concepts, qubits, and quantum logic gates!'
        ]);

        // 6. Create 10 Quiz Questions
        $questions = [
            [
                'question_text' => 'What is the fundamental unit of quantum information?',
                'option_a' => 'Classical Bit',
                'option_b' => 'Qubit',
                'option_c' => 'Byte',
                'option_d' => 'Node',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'Which quantum phenomenon allows qubits to exist in multiple states simultaneously?',
                'option_a' => 'Entanglement',
                'option_b' => 'Superposition',
                'option_c' => 'Teleportation',
                'option_d' => 'Decoherence',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'What happens when you measure a qubit in superposition?',
                'option_a' => 'It remains in superposition',
                'option_b' => 'It collapses to a classical state (0 or 1)',
                'option_c' => 'It disappears from the circuit',
                'option_d' => 'It transitions to a higher energy level',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'Which quantum logic gate is used to place a qubit into superposition?',
                'option_a' => 'Pauli-X gate',
                'option_b' => 'Hadamard (H) gate',
                'option_c' => 'CNOT gate',
                'option_d' => 'Phase (Z) gate',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'Quantum entanglement is a phenomenon where:',
                'option_a' => 'Qubits repel each other physically',
                'option_b' => 'Qubits become linked so that the state of one instantly correlates with the other',
                'option_c' => 'Qubits run classical algorithms faster',
                'option_d' => 'Qubits turn into silicon chips',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'Which quantum gate is equivalent to the classical NOT gate?',
                'option_a' => 'Hadamard (H) gate',
                'option_b' => 'Pauli-X gate',
                'option_c' => 'CNOT gate',
                'option_d' => 'Pauli-Y gate',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'What does CNOT stand for in quantum circuit designs?',
                'option_a' => 'Classical Not gate',
                'option_b' => 'Controlled-NOT gate',
                'option_c' => 'Complex Not gate',
                'option_d' => 'Circular Not gate',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'In the IBM Quantum Composer, how are quantum circuits represented?',
                'option_a' => 'As pure command-line code in C++',
                'option_b' => 'On a musical-like score/staff with drag-and-drop gates',
                'option_c' => 'As a static 3D coordinate model',
                'option_d' => 'As a logical flowchart with nodes',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'What geometrical representation is used to visualize the state of a single qubit?',
                'option_a' => 'Cartesian plane',
                'option_b' => 'Bloch Sphere',
                'option_c' => 'Minkowski space',
                'option_d' => 'Fourier circle',
                'correct_option' => 'B'
            ],
            [
                'question_text' => 'Which company developed the Qiskit framework for programming quantum computers?',
                'option_a' => 'Google',
                'option_b' => 'IBM',
                'option_c' => 'Microsoft',
                'option_d' => 'Intel',
                'correct_option' => 'B'
            ]
        ];

        foreach ($questions as $q) {
            $q['quiz_id'] = $quiz->id;
            \App\Models\QuizQuestion::create($q);
        }
    }
}
