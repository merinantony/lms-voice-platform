# QuantumLMS - Voice-Enabled Student Learning Platform

An interactive, gamified Learning Management System (LMS) designed for Grades 6–10 students, focusing on quantum physics education with AI tutoring, achievements, and administration panels.

---

## 📸 Screenshots

Here is the visual walkthrough of the platform. *(To add your own screenshots, create a folder named `screenshots/` at the root of this project, name your files as listed below, and push them to GitHub)*

### 1. Student Dashboard & Custom Profiles
*A space-themed student learning center featuring progress tracks, badges, and user customization options.*
![Student Dashboard](./screenshots/dashboard.png)

### 2. Interactive Chapter View
*Split-screen view with embedded lecture video player, PDF downloads, and real-time AI Tutor voice support.*
![Chapter View](./screenshots/chapter_view.png)

### 3. Gamified Assessments
*A clean assessment view with randomized questions, accuracy results, and instant celebration confetti.*
![Quiz Assessments](./screenshots/quiz_view.png)

### 4. Admin Management Console
*CRUD dashboards for managing courses, chapters, questions, student profiles, status toggles, and logs.*
![Admin Panel](./screenshots/admin_panel.png)

---

## ✨ Features

### 🎓 Student Portal
* **Futuristic Space Theme**: Responsive, neon dark-mode interface built to keep middle-school students engaged.
* **Celebration Confetti**: Dynamic particle bursts upon chapter completion and scoring passing marks on quizzes.
* **Golden Certificate**: Automatic certificate generation with customized printing styles when progress hits 100%.

### 🏆 Gamified Badges
* **Quantum Cadet** (🎖️) - Completing Chapter 1
* **Gate Weaver** (🔮) - Completing Chapter 2
* **Composer Maestro** (🎹) - Completing Chapter 3
* **Quantum Scholar** (👑) - Scoring $\ge$ 80% on assessment quiz

### 🤖 Floating AI Support Buddy
* **Speech-to-Text & Text-to-Speech**: Speak directly to the tutor with real-time feedback audio read aloud.
* **Type Queries**: Classic text inputs for a quieter study experience.
* **Global Accessibility**: Available on the dashboard and assessment screens.

### ⚙️ Admin Controls
* **Student CRUD**: Create new accounts, edit credentials, or delete students.
* **Security & Toggles**: Block disabled students from accessing the portal.
* **Lesson Managers**: Full control over chapters, YouTube links, and quiz questions.

---

## 🛠️ Technology Stack

* **Backend**: Laravel (PHP), SQLite, Sanctum Token Auth
* **Frontend**: React (Vite), Tailwind CSS v4, GSAP (animations), canvas-confetti

---

## 🚀 Installation & Running

### Prerequisites
* PHP >= 8.2 & Composer
* Node.js >= 18 & npm

### 1. Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
# Configure database to sqlite in .env
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### 2. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 How to add your own Screenshots to GitHub
1. Create a folder named **`screenshots`** in the root directory (`lms-voice-platform/screenshots`).
2. Take screenshots of your running app and save them in that folder as:
   - `dashboard.png`
   - `chapter_view.png`
   - `quiz_view.png`
   - `admin_panel.png`
3. Run these commands in your terminal to upload them:
   ```bash
   git add .
   git commit -m "Add project screenshots"
   git push origin main
   ```
