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

        $studentMessage = strtolower(trim($request->message));
        $studentName = $request->user()->name;

        // SIMULATED AI DELAY
        sleep(1); 

        // Spelling-tolerant match helper
        $hasMatch = function($msg, $terms) {
            foreach ($terms as $t) {
                if (str_contains($msg, $t)) {
                    return true;
                }
            }
            return false;
        };

        if (($hasMatch($studentMessage, ['quantum', 'quantam', 'quntum']) && $hasMatch($studentMessage, ['comput', 'defin'])) || $studentMessage === 'quantum') {
            $aiReply = "Quantum computing is a new kind of computing that uses the strange rules of quantum physics to solve complex problems much faster than regular computers! While regular computers use bits (0s and 1s), quantum computers use Qubits, which can be both 0 and 1 at the same time.";
        } elseif ($hasMatch($studentMessage, ['qubit', 'qbit', 'cubit', 'quibit'])) {
            $aiReply = "A qubit, or quantum bit, is the basic unit of quantum information. Unlike normal bits that can only be 0 or 1, a qubit can be in a state of 'superposition', meaning it can represent a 0, a 1, or any mix of both at the same time!";
        } elseif ($hasMatch($studentMessage, ['superposition', 'super position', 'superposision', 'super-position'])) {
            $aiReply = "Superposition is like a spinning coin! When the coin is lying flat on the table, it is either heads (1) or tails (0). But while it is spinning in the air, it is a blur of both heads and tails at once! That spinning blur is what we call superposition. Measuring the qubit stops the spin and forces it to choose 0 or 1.";
        } elseif ($hasMatch($studentMessage, ['entangle', 'entanglement', 'intangle', 'intanglement'])) {
            $aiReply = "Quantum entanglement is when two qubits become deeply connected, like magical twin walkie-talkies. No matter how far apart they are—even on opposite sides of the universe—changing the state of one qubit instantly affects the state of the other!";
        } elseif ($hasMatch($studentMessage, ['hadamard', 'hadamerd', 'haddamard', 'h gate', 'h-gate'])) {
            $aiReply = "The Hadamard gate, or H gate, is the 'superposition creator'! When you put a qubit through a Hadamard gate, it acts like giving a flat coin a big spin, turning it from a static 0 or 1 into a dynamic 50/50 mix of both.";
        } elseif ($hasMatch($studentMessage, ['cnot', 'c-not', 'controlled-not', 'controlled not'])) {
            $aiReply = "The CNOT (Controlled-NOT) gate is used to entangle qubits! It has a control qubit and a target qubit. If the control qubit is 1, it flips the target qubit. If the control qubit is in superposition, it locks the two qubits into an entangled link!";
        } elseif ($hasMatch($studentMessage, ['composer', 'ibm composer', 'wire'])) {
            $aiReply = "The IBM Quantum Composer is a graphical, drag-and-drop tool that lets you build quantum circuits on a musical-like score! You can place logic gates onto horizontal qubit wires and run them on real quantum computers.";
        } elseif ($hasMatch($studentMessage, ['bloch sphere', 'visualize qubit', 'bloch'])) {
            $aiReply = "The Bloch Sphere is a visual sphere used to represent the state of a single qubit. The top pole represents 0, the bottom pole represents 1, and the equator represents superposition states. It helps scientists visualize qubit operations!";
        } elseif ($hasMatch($studentMessage, ['hello', 'hi', 'hey'])) {
            $aiReply = "Hi there, {$studentName}! 👋 I am your AI Study Tutor. Ask me about qubits, superposition, entanglement, logic gates, or the IBM Composer to get started!";
        } else {
            // Contextual Fallback response
            $aiReply = "Interesting question, {$studentName}! As your AI tutor, I am specialized in the IBM Q Foundation. Try asking me: 'What is a qubit?', 'What is superposition?', 'How does entanglement work?', or 'What does a Hadamard gate do?'";
        }

        return response()->json([
            'reply' => $aiReply
        ]);
    }
}
