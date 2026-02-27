/**
 * Run this in the browser console (or via Node with minor tweaks)
 * to seed localStorage with 25 dummy survey submissions.
 *
 * Copy-paste everything below into the browser console at localhost:3000
 */

const dummySubmissions = [
    {
        id: "d001",
        doctorName: "Dr. Rajesh Sharma",
        submittedAt: "2026-02-20T09:15:00.000Z",
        answers: { q1: "C", q2: "D", q3: ["A", "B"], q4: ["A", "B", "C"], q5: "B", q6: "B", q7: "C", q8: "B", q9: "C", q10: "D", q11: "A", q12: ["A", "E"], q13: "B" },
    },
    {
        id: "d002",
        doctorName: "Dr. Priya Mehta",
        submittedAt: "2026-02-20T10:32:00.000Z",
        answers: { q1: "B", q2: "C", q3: ["B", "C"], q4: ["A", "B", "E"], q5: "A", q6: "B", q7: "B", q8: "A", q9: "B", q10: "E", q11: "A", q12: ["B", "D"], q13: "A" },
    },
    {
        id: "d003",
        doctorName: "Dr. Amit Patel",
        submittedAt: "2026-02-20T11:45:00.000Z",
        answers: { q1: "D", q2: "E", q3: ["A"], q4: ["A", "C", "G"], q5: "B", q6: "A", q7: "C", q8: "C", q9: "D", q10: "C", q11: "B", q12: ["A", "C"], q13: "B" },
    },
    {
        id: "d004",
        doctorName: "Dr. Sunita Gupta",
        submittedAt: "2026-02-21T08:20:00.000Z",
        answers: { q1: "B", q2: "D", q3: ["A", "B"], q4: ["B", "D", "E"], q5: "C", q6: "B", q7: "C", q8: "B", q9: "C", q10: "D", q11: "A", q12: ["E"], q13: "A" },
    },
    {
        id: "d005",
        doctorName: "Dr. Vikram Singh",
        submittedAt: "2026-02-21T09:10:00.000Z",
        answers: { q1: "E", q2: "E", q3: ["C"], q4: ["A", "B", "C", "E", "G"], q5: "A", q6: "B", q7: "B", q8: "A", q9: "B", q10: "E", q11: "A", q12: ["A", "B", "E"], q13: "A" },
    },
    {
        id: "d006",
        doctorName: "Dr. Neha Joshi",
        submittedAt: "2026-02-21T14:05:00.000Z",
        answers: { q1: "A", q2: "B", q3: ["A", "C"], q4: ["A", "F"], q5: "C", q6: "A", q7: "A", q8: "D", q9: "A", q10: "B", q11: "B", q12: ["D"], q13: "C" },
    },
    {
        id: "d007",
        doctorName: "Dr. Sanjay Reddy",
        submittedAt: "2026-02-22T07:30:00.000Z",
        answers: { q1: "C", q2: "D", q3: ["B"], q4: ["A", "B", "C", "D"], q5: "B", q6: "B", q7: "C", q8: "B", q9: "C", q10: "D", q11: "A", q12: ["A", "C", "E"], q13: "B" },
    },
    {
        id: "d008",
        doctorName: "Dr. Kavita Iyer",
        submittedAt: "2026-02-22T10:55:00.000Z",
        answers: { q1: "B", q2: "C", q3: ["A", "B"], q4: ["B", "E", "G"], q5: "B", q6: "B", q7: "C", q8: "A", q9: "B", q10: "C", q11: "A", q12: ["B", "E"], q13: "A" },
    },
    {
        id: "d009",
        doctorName: "Dr. Manish Verma",
        submittedAt: "2026-02-22T15:20:00.000Z",
        answers: { q1: "D", q2: "D", q3: ["A", "C"], q4: ["A", "B", "C"], q5: "A", q6: "B", q7: "B", q8: "B", q9: "D", q10: "E", q11: "B", q12: ["A", "D"], q13: "B" },
    },
    {
        id: "d010",
        doctorName: "Dr. Ananya Desai",
        submittedAt: "2026-02-23T08:00:00.000Z",
        answers: { q1: "C", q2: "C", q3: ["B", "C"], q4: ["A", "C", "E", "F"], q5: "B", q6: "A", q7: "C", q8: "C", q9: "C", q10: "C", q11: "B", q12: ["C", "E"], q13: "B" },
    },
    {
        id: "d011",
        doctorName: "Dr. Rohan Kapoor",
        submittedAt: "2026-02-23T09:45:00.000Z",
        answers: { q1: "B", q2: "D", q3: ["A"], q4: ["A", "B"], q5: "B", q6: "B", q7: "C", q8: "B", q9: "B", q10: "D", q11: "A", q12: ["A", "B"], q13: "A" },
    },
    {
        id: "d012",
        doctorName: "Dr. Pooja Nair",
        submittedAt: "2026-02-23T11:30:00.000Z",
        answers: { q1: "A", q2: "B", q3: ["A", "B", "C"], q4: ["A", "B", "D", "G"], q5: "C", q6: "B", q7: "A", q8: "A", q9: "C", q10: "D", q11: "A", q12: ["E"], q13: "B" },
    },
    {
        id: "d013",
        doctorName: "Dr. Arun Kumar",
        submittedAt: "2026-02-24T07:15:00.000Z",
        answers: { q1: "C", q2: "E", q3: ["A", "B"], q4: ["A", "B", "C", "E"], q5: "A", q6: "B", q7: "B", q8: "B", q9: "D", q10: "E", q11: "A", q12: ["A", "B", "D"], q13: "A" },
    },
    {
        id: "d014",
        doctorName: "Dr. Meera Chatterjee",
        submittedAt: "2026-02-24T10:00:00.000Z",
        answers: { q1: "B", q2: "C", q3: ["C"], q4: ["C", "E"], q5: "B", q6: "A", q7: "C", q8: "D", q9: "A", q10: "B", q11: "B", q12: ["C", "D"], q13: "C" },
    },
    {
        id: "d015",
        doctorName: "Dr. Suresh Rao",
        submittedAt: "2026-02-24T13:45:00.000Z",
        answers: { q1: "D", q2: "D", q3: ["A", "B"], q4: ["A", "B", "C", "D", "G"], q5: "B", q6: "B", q7: "C", q8: "B", q9: "C", q10: "D", q11: "A", q12: ["A", "E"], q13: "B" },
    },
    {
        id: "d016",
        doctorName: "Dr. Lakshmi Bhat",
        submittedAt: "2026-02-25T08:30:00.000Z",
        answers: { q1: "C", q2: "D", q3: ["B", "C"], q4: ["A", "B", "F"], q5: "B", q6: "B", q7: "C", q8: "A", q9: "B", q10: "C", q11: "A", q12: ["B", "E"], q13: "A" },
    },
    {
        id: "d017",
        doctorName: "Dr. Deepak Saxena",
        submittedAt: "2026-02-25T11:20:00.000Z",
        answers: { q1: "E", q2: "E", q3: ["A"], q4: ["A", "B", "C", "E", "G"], q5: "A", q6: "B", q7: "B", q8: "B", q9: "D", q10: "E", q11: "A", q12: ["A", "C", "D"], q13: "B" },
    },
    {
        id: "d018",
        doctorName: "Dr. Nandini Pillai",
        submittedAt: "2026-02-25T14:10:00.000Z",
        answers: { q1: "B", q2: "C", q3: ["A", "B"], q4: ["A", "D", "E"], q5: "C", q6: "A", q7: "C", q8: "C", q9: "C", q10: "C", q11: "B", q12: ["D", "E"], q13: "B" },
    },
    {
        id: "d019",
        doctorName: "Dr. Ashok Trivedi",
        submittedAt: "2026-02-26T07:50:00.000Z",
        answers: { q1: "C", q2: "D", q3: ["A", "C"], q4: ["A", "B", "C"], q5: "B", q6: "B", q7: "C", q8: "B", q9: "B", q10: "D", q11: "A", q12: ["A", "B"], q13: "A" },
    },
    {
        id: "d020",
        doctorName: "Dr. Ritu Malhotra",
        submittedAt: "2026-02-26T09:35:00.000Z",
        answers: { q1: "A", q2: "B", q3: ["B"], q4: ["B", "C", "F"], q5: "C", q6: "A", q7: "A", q8: "D", q9: "A", q10: "A", q11: "C", q12: ["C"], q13: "C" },
    },
    {
        id: "d021",
        doctorName: "Dr. Hemant Jain",
        submittedAt: "2026-02-26T12:15:00.000Z",
        answers: { q1: "D", q2: "D", q3: ["A", "B"], q4: ["A", "B", "E", "G"], q5: "B", q6: "B", q7: "C", q8: "B", q9: "C", q10: "D", q11: "A", q12: ["A", "E"], q13: "B" },
    },
    {
        id: "d022",
        doctorName: "Dr. Swati Kulkarni",
        submittedAt: "2026-02-26T15:00:00.000Z",
        answers: { q1: "C", q2: "C", q3: ["A", "B", "C"], q4: ["A", "C", "D"], q5: "B", q6: "B", q7: "C", q8: "A", q9: "B", q10: "C", q11: "A", q12: ["B", "D", "E"], q13: "A" },
    },
    {
        id: "d023",
        doctorName: "Dr. Gaurav Mishra",
        submittedAt: "2026-02-27T08:05:00.000Z",
        answers: { q1: "B", q2: "D", q3: ["A"], q4: ["A", "B"], q5: "A", q6: "B", q7: "B", q8: "B", q9: "C", q10: "E", q11: "A", q12: ["A"], q13: "A" },
    },
    {
        id: "d024",
        doctorName: "Dr. Tanvi Shetty",
        submittedAt: "2026-02-27T09:40:00.000Z",
        answers: { q1: "C", q2: "E", q3: ["B", "C"], q4: ["A", "B", "C", "E", "F"], q5: "B", q6: "B", q7: "C", q8: "B", q9: "D", q10: "D", q11: "A", q12: ["A", "C", "E"], q13: "B" },
    },
    {
        id: "d025",
        doctorName: "Dr. Nikhil Agarwal",
        submittedAt: "2026-02-27T11:25:00.000Z",
        answers: { q1: "D", q2: "D", q3: ["A", "B"], q4: ["A", "B", "C", "G"], q5: "B", q6: "B", q7: "C", q8: "A", q9: "C", q10: "D", q11: "A", q12: ["B", "E"], q13: "B" },
    },
];

localStorage.setItem("sema_survey_submissions", JSON.stringify(dummySubmissions));
console.log(`✅ Seeded ${dummySubmissions.length} dummy submissions into localStorage.`);
console.log("Refresh the admin page to see the data.");
