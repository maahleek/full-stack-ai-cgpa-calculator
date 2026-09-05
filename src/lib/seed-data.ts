import type { NewSemester, NewCourse } from "@/db/schema";

export type SeedCourse = Omit<NewCourse, "semesterId">;

export type SeedSemester = {
  meta: Omit<NewSemester, "userId">;
  courses: SeedCourse[];
};

// Demo transcript for a Nigerian Computer Science student on the 5.0 (NUC) scale.
// Grades line up with the 5.0 bands: A 70+, B 60-69, C 50-59, D 45-49, E 40-44, F <40.
export const DEMO_SEMESTERS: SeedSemester[] = [
  {
    meta: { name: "100 Level First Semester", year: 2022, term: "Semester", order: 1, isCurrent: false },
    courses: [
      { code: "CSC101", title: "Introduction to Computer Science", credits: "3.0", grade: "A", score: "78", difficulty: "medium" },
      { code: "MTH101", title: "Elementary Mathematics I", credits: "3.0", grade: "B", score: "65", difficulty: "hard" },
      { code: "PHY101", title: "General Physics I", credits: "3.0", grade: "B", score: "62", difficulty: "hard" },
      { code: "GST101", title: "Use of English", credits: "2.0", grade: "A", score: "74", difficulty: "easy" },
      { code: "CHM101", title: "General Chemistry I", credits: "2.0", grade: "C", score: "55", difficulty: "medium" },
    ],
  },
  {
    meta: { name: "100 Level Second Semester", year: 2023, term: "Semester", order: 2, isCurrent: false },
    courses: [
      { code: "CSC102", title: "Introduction to Problem Solving", credits: "3.0", grade: "A", score: "82", difficulty: "medium" },
      { code: "MTH102", title: "Elementary Mathematics II", credits: "3.0", grade: "B", score: "61", difficulty: "hard" },
      { code: "PHY102", title: "General Physics II", credits: "3.0", grade: "C", score: "58", difficulty: "hard" },
      { code: "GST102", title: "Nigerian Peoples and Culture", credits: "2.0", grade: "A", score: "76", difficulty: "easy" },
      { code: "STA101", title: "Introduction to Statistics", credits: "2.0", grade: "B", score: "63", difficulty: "medium" },
    ],
  },
  {
    meta: { name: "200 Level First Semester", year: 2023, term: "Semester", order: 3, isCurrent: false },
    courses: [
      { code: "CSC201", title: "Computer Programming I", credits: "3.0", grade: "A", score: "85", difficulty: "hard", notes: "Java and C fundamentals." },
      { code: "CSC211", title: "Digital Logic Design", credits: "3.0", grade: "B", score: "67", difficulty: "hard" },
      { code: "MTH201", title: "Mathematical Methods", credits: "3.0", grade: "B", score: "60", difficulty: "hard" },
      { code: "GST201", title: "Philosophy and Logic", credits: "2.0", grade: "A", score: "79", difficulty: "easy" },
      { code: "ECO101", title: "Principles of Economics", credits: "2.0", grade: "B", score: "64", difficulty: "easy" },
    ],
  },
  {
    meta: { name: "200 Level Second Semester", year: 2024, term: "Semester", order: 4, isCurrent: false },
    courses: [
      { code: "CSC202", title: "Computer Programming II", credits: "3.0", grade: "A", score: "88", difficulty: "hard", notes: "Data structures project in C++." },
      { code: "CSC212", title: "Computer Architecture", credits: "3.0", grade: "B", score: "66", difficulty: "hard" },
      { code: "CSC222", title: "Systems Analysis and Design", credits: "3.0", grade: "A", score: "80", difficulty: "medium" },
      { code: "MTH202", title: "Linear Algebra", credits: "3.0", grade: "C", score: "56", difficulty: "hard" },
      { code: "ENT211", title: "Entrepreneurship Studies", credits: "2.0", grade: "A", score: "77", difficulty: "easy" },
    ],
  },
  {
    meta: { name: "300 Level First Semester", year: 2024, term: "Semester", order: 5, isCurrent: true },
    courses: [
      { code: "CSC301", title: "Data Structures and Algorithms", credits: "3.0", grade: "A", score: "84", difficulty: "hard", notes: "Midterm done, final project in progress." },
      { code: "CSC311", title: "Operating Systems", credits: "3.0", grade: "B", score: "68", difficulty: "hard" },
      { code: "CSC321", title: "Database Management Systems", credits: "3.0", grade: null, score: null, difficulty: "medium", notes: "Group project on a mini SQL engine." },
      { code: "CSC331", title: "Computer Networks", credits: "3.0", grade: null, score: null, difficulty: "hard" },
      { code: "GST301", title: "Entrepreneurship and Innovation", credits: "2.0", grade: null, score: null, difficulty: "easy" },
    ],
  },
];

export const DEMO_PROFILE = {
  university: "University of Lagos",
  program: "B.Sc. Computer Science",
  targetCgpa: "4.50",
  name: "Ngozi Adeyemi",
};
