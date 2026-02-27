"use client";

import { useState, useCallback, useRef } from "react";
import {
  ClipboardList,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  CheckSquare2,
  CircleDot,
  Send,
  Edit3,
} from "lucide-react";
import questionsData from "@/data/questions.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────────────── */
interface Option {
  value: string;
  label: string;
}
interface Question {
  id: string;
  text: string;
  type: "single" | "multiple";
  required: boolean;
  options: Option[];
}

const questions: Question[] = questionsData as Question[];

/** Total steps: 0 = doctor name, 1..N = questions, N+1 = review */
const TOTAL_STEPS = 1 + questions.length + 1;

function isAnswered(answer: string | string[] | undefined): boolean {
  if (!answer) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  return answer.trim() !== "";
}

function getOptionLabel(q: Question, val: string): string {
  const opt = q.options.find((o) => o.value === val);
  return opt ? `${val}. ${opt.label}` : val;
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function SurveyPage() {
  const [doctorName, setDoctorName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [stepTouched, setStepTouched] = useState(false);
  const submissionIdRef = useRef<string>(crypto.randomUUID());

  const answeredCount =
    (doctorName.trim() ? 1 : 0) +
    questions.filter((q) => q.required && isAnswered(answers[q.id])).length;
  const totalRequired = 1 + questions.filter((q) => q.required).length;
  const progressPct = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  const isReviewStep = step === questions.length + 1;
  const isNameStep = step === 0;
  const currentQuestion =
    !isNameStep && !isReviewStep ? questions[step - 1] : null;

  const handleSingle = useCallback((qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }, []);

  const handleMultiple = useCallback((qId: string, value: string) => {
    setAnswers((prev) => {
      const existing = (prev[qId] as string[]) || [];
      const updated = existing.includes(value)
        ? existing.filter((v) => v !== value)
        : [...existing, value];
      return { ...prev, [qId]: updated };
    });
  }, []);

  /** Check if current step is valid */
  function isCurrentStepValid(): boolean {
    if (isNameStep) return doctorName.trim() !== "";
    if (isReviewStep) return true;
    if (currentQuestion && currentQuestion.required) {
      return isAnswered(answers[currentQuestion.id]);
    }
    return true;
  }

  /** Submit the current step's answer to the backend */
  async function submitStepAnswer(
    currentAnswers: Record<string, string | string[]>,
  ): Promise<boolean> {
    const record = {
      id: submissionIdRef.current,
      doctorName,
      answers: currentAnswers,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Submission failed");
      }
      return true;
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit. Please try again.");
      return false;
    }
  }

  async function handleNext() {
    setStepTouched(true);
    if (!isCurrentStepValid()) return;
    setStepTouched(false);

    // Submit current step data to backend
    if (isNameStep) {
      // Doctor name step – create the submission record
      setSubmitting(true);
      const ok = await submitStepAnswer({});
      setSubmitting(false);
      if (!ok) return;
    } else if (currentQuestion) {
      // Question step – submit this question's answer
      const qId = currentQuestion.id;
      const ans = answers[qId];
      if (ans !== undefined) {
        setSubmitting(true);
        const ok = await submitStepAnswer({ [qId]: ans });
        setSubmitting(false);
        if (!ok) return;
      }
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStepTouched(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(s: number) {
    setStepTouched(false);
    setStep(s);
  }

  async function handleFinish() {
    setSubmitted(true);
  }

  /* ── Thank-You ─────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up rounded-2xl bg-card p-10 text-center shadow-[var(--shadow-lg)]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
            <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={2} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Thank You!
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your survey response has been recorded successfully. We appreciate
            your valuable clinical insights.
          </p>
          <Button
            variant="outline"
            className="mt-8 gap-2 border-primary/30 text-primary hover:bg-primary-light hover:text-primary-dark"
            onClick={() => {
              setDoctorName("");
              setAnswers({});
              setSubmitted(false);
              setStepTouched(false);
              setStep(0);
              submissionIdRef.current = crypto.randomUUID();
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Submit Another Response
          </Button>
        </div>
      </div>
    );
  }

  /* ── Wizard Form ──────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl animate-fade-in-up rounded-2xl bg-card shadow-[var(--shadow-lg)]">
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 rounded-t-2xl border-b border-border bg-card/95 px-6 py-5 backdrop-blur-sm sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
                Semaglutide Polling Survey
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                MASH Patient Management &amp; Prescription Patterns
              </p>
            </div>
            <Badge
              variant="outline"
              className="ml-auto hidden shrink-0 border-primary/30 text-primary sm:inline-flex"
            >
              {isReviewStep ? "Review" : `${step + 1} / ${TOTAL_STEPS}`}
            </Badge>
          </div>

          {/* Progress */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>
                Step {step + 1} of {TOTAL_STEPS}
              </span>
              <span className="font-semibold text-primary">{progressPct}%</span>
            </div>
            <Progress
              value={progressPct}
              className="h-2 bg-primary/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-teal-400"
            />
          </div>
        </div>

        <div className="px-6 pb-10 pt-8 sm:px-10">
          {/* ── Step 0: Doctor Name ─────────────────────────────── */}
          {isNameStep && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-muted/40 p-5">
                <div className="mb-1 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <Label
                    htmlFor="doctor-name"
                    className="text-sm font-semibold text-foreground"
                  >
                    Doctor Name <span className="text-destructive">*</span>
                  </Label>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Enter your full name as it appears in your registration
                </p>
                <Input
                  id="doctor-name"
                  type="text"
                  autoFocus
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                  placeholder="Dr. Full Name"
                  className={cn(
                    "h-11 border-border bg-card text-base transition-shadow focus-visible:ring-primary/30",
                    stepTouched &&
                      !doctorName.trim() &&
                      "border-destructive focus-visible:ring-destructive/20",
                  )}
                />
                {stepTouched && !doctorName.trim() && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> Doctor name is required.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Steps 1–N: Questions ───────────────────────────── */}
          {currentQuestion && (
            <div className="space-y-6">
              {(() => {
                const q = currentQuestion;
                const answer = answers[q.id];
                const unanswered =
                  stepTouched && q.required && !isAnswered(answer);
                const isMultiple = q.type === "multiple";

                return (
                  <div
                    className={cn(
                      "rounded-xl border p-5 transition-all duration-200",
                      unanswered
                        ? "border-destructive/40 bg-destructive/5 shadow-sm"
                        : isAnswered(answer)
                          ? "border-primary/30 bg-primary/5 shadow-sm"
                          : "border-border bg-card",
                    )}
                  >
                    {/* Question header */}
                    <div className="mb-4 flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
                        {step}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-relaxed text-foreground">
                          {q.text}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          {isMultiple ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-primary/30 py-0 text-[10px] text-primary"
                            >
                              <CheckSquare2 className="h-3 w-3" /> Select all
                              that apply
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 border-muted-foreground/30 py-0 text-[10px] text-muted-foreground"
                            >
                              <CircleDot className="h-3 w-3" /> Choose one
                            </Badge>
                          )}
                          {q.required && (
                            <span className="text-[10px] text-destructive font-medium">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="radio-group pl-9">
                      {q.options.map((opt) => {
                        const inputId = `${q.id}-${opt.value}`;
                        const isChecked =
                          q.type === "single"
                            ? answer === opt.value
                            : Array.isArray(answer) &&
                              answer.includes(opt.value);

                        return (
                          <div className="radio-option" key={opt.value}>
                            <input
                              type={isMultiple ? "checkbox" : "radio"}
                              id={inputId}
                              name={q.id}
                              value={opt.value}
                              checked={isChecked}
                              onChange={() =>
                                isMultiple
                                  ? handleMultiple(q.id, opt.value)
                                  : handleSingle(q.id, opt.value)
                              }
                            />
                            <label htmlFor={inputId}>
                              <span className="font-bold text-primary">
                                {opt.value}.
                              </span>{" "}
                              {opt.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    {unanswered && (
                      <p className="mt-3 flex items-center gap-1 pl-9 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        Please select{" "}
                        {isMultiple ? "at least one option" : "an option"}.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Review Step ────────────────────────────────────── */}
          {isReviewStep && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-lg font-bold text-foreground">
                  Review Your Answers
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Your answers have been saved. Review below and click any
                  answer to edit.
                </p>
              </div>

              {/* Doctor Name */}
              <button
                type="button"
                onClick={() => goToStep(0)}
                className="w-full rounded-xl border border-border bg-muted/40 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Doctor Name
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {doctorName}
                    </p>
                  </div>
                  <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </button>

              <Separator className="bg-border" />

              {/* Question answers */}
              <div className="space-y-2">
                {questions.map((q, idx) => {
                  const answer = answers[q.id];
                  const display =
                    !answer || (Array.isArray(answer) && answer.length === 0)
                      ? "Not answered"
                      : Array.isArray(answer)
                        ? answer.map((v) => getOptionLabel(q, v)).join(" · ")
                        : getOptionLabel(q, answer);
                  const hasAnswer = isAnswered(answer);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goToStep(idx + 1)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition-colors",
                        hasAnswer
                          ? "border-border bg-muted/40 hover:border-primary/30 hover:bg-primary/5"
                          : "border-destructive/30 bg-destructive/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                              {idx + 1}
                            </span>
                            {q.text.length > 60
                              ? q.text.slice(0, 60) + "…"
                              : q.text}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-sm font-medium",
                              hasAnswer
                                ? "text-foreground"
                                : "text-destructive",
                            )}
                          >
                            {display}
                          </p>
                        </div>
                        <Edit3 className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Missing answers warning */}
              {answeredCount < totalRequired && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">
                    {totalRequired - answeredCount} required field(s) still need
                    an answer.
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator className="bg-border my-8" />

          {/* ── Navigation Buttons ──────────────────────────────── */}
          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={submitting}
                className="gap-1.5 border-border"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {isReviewStep ? (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={answeredCount < totalRequired}
                size="lg"
                className="gap-2 bg-primary text-white shadow-md hover:bg-primary-dark hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finish Survey
              </Button>
            ) : isNameStep ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="gap-1.5 bg-primary text-white hover:bg-primary-dark"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="gap-1.5 bg-primary text-white hover:bg-primary-dark"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <ClipboardList className="mr-1 inline h-3 w-3" />
            All responses are confidential and used for medical research only.
          </p>
        </div>
      </div>
    </div>
  );
}
