"use client";

import { useState, useCallback } from "react";
import {
  ClipboardList,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  ChevronRight,
  Stethoscope,
  CheckSquare2,
  CircleDot,
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

function isAnswered(answer: string | string[] | undefined): boolean {
  if (!answer) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  return answer.trim() !== "";
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function SurveyPage() {
  const [doctorName, setDoctorName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const answeredCount =
    (doctorName.trim() ? 1 : 0) +
    questions.filter((q) => q.required && isAnswered(answers[q.id])).length;
  const totalRequired = 1 + questions.filter((q) => q.required).length;
  const progressPct = Math.round((answeredCount / totalRequired) * 100);

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

  const isFormValid =
    doctorName.trim() !== "" &&
    questions.every((q) => !q.required || isAnswered(answers[q.id]));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isFormValid) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 900);
  }

  /* ── Thank-You ─────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up rounded-2xl bg-card p-10 text-center shadow-[var(--shadow-lg)]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-light">
            <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={2} />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Thank You!</h1>
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
              setTouched(false);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Submit Another Response
          </Button>
        </div>
      </div>
    );
  }

  /* ── Survey Form ──────────────────────────────────────────────── */
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
              {questions.length} Questions
            </Badge>
          </div>

          {/* Progress */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>{answeredCount} of {totalRequired} answered</span>
              <span className="font-semibold text-primary">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2 bg-primary/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-teal-400" />
          </div>
        </div>

        <div className="px-6 pb-10 pt-8 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>

            {/* ── Doctor Name ── */}
            <div className="rounded-xl border border-border bg-muted/40 p-5">
              <div className="mb-1 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <Label htmlFor="doctor-name" className="text-sm font-semibold text-foreground">
                  Doctor Name <span className="text-destructive">*</span>
                </Label>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Enter your full name as it appears in your registration
              </p>
              <Input
                id="doctor-name"
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Full Name"
                className={cn(
                  "h-11 border-border bg-card text-base transition-shadow focus-visible:ring-primary/30",
                  touched && !doctorName.trim() && "border-destructive focus-visible:ring-destructive/20"
                )}
              />
              {touched && !doctorName.trim() && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" /> Doctor name is required.
                </p>
              )}
            </div>

            <Separator className="bg-border" />

            {/* ── Questions ── */}
            <div className="space-y-5">
              {questions.map((q, idx) => {
                const answer = answers[q.id];
                const unanswered = touched && q.required && !isAnswered(answer);
                const isMultiple = q.type === "multiple";

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "group rounded-xl border p-5 transition-all duration-200",
                      unanswered
                        ? "border-destructive/40 bg-destructive/5 shadow-sm"
                        : isAnswered(answer)
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
                    )}
                  >
                    {/* Question header */}
                    <div className="mb-4 flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-relaxed text-foreground">
                          {q.text}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          {isMultiple ? (
                            <Badge variant="outline" className="gap-1 border-primary/30 py-0 text-[10px] text-primary">
                              <CheckSquare2 className="h-3 w-3" /> Select all that apply
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-muted-foreground/30 py-0 text-[10px] text-muted-foreground">
                              <CircleDot className="h-3 w-3" /> Choose one
                            </Badge>
                          )}
                          {isAnswered(answer) && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
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
                            : Array.isArray(answer) && answer.includes(opt.value);

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
                              <span className="font-bold text-primary">{opt.value}.</span>{" "}
                              {opt.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>

                    {unanswered && (
                      <p className="mt-3 flex items-center gap-1 pl-9 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        Please select {isMultiple ? "at least one option" : "an option"}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator className="bg-border" />

            {/* Validation message */}
            {touched && !isFormValid && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                <p className="text-sm text-destructive">
                  Please answer all required questions before submitting.
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full gap-2 bg-primary text-white shadow-md hover:bg-primary-dark hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit Survey
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <ClipboardList className="mr-1 inline h-3 w-3" />
              All responses are confidential and used for medical research only.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
