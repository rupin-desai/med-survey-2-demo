"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import questionsData from "@/data/questions.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Lock,
  LogIn,
  ArrowLeft,
  Search,
  Trash2,
  Users,
  ClipboardList,
  Stethoscope,
  AlertCircle,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  BarChart3,
  TableIcon,
  Hash,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QuestionAnalyticsCard from "./analytics-card";
import * as XLSX from "xlsx";

/* ── Types ──────────────────────────────────────────────────────── */
interface QuestionDef {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: { value: string; label: string }[];
}
const questions: QuestionDef[] = questionsData as QuestionDef[];

interface Submission {
  id: string;
  doctorName: string;
  answers: Record<string, string | string[]>;
  submittedAt: string;
}

// Abbreviated column headers
const COL_HEADERS: Record<string, string> = {
  q1: "MASH pts/mo",
  q2: "Obesity %",
  q3: "Sema indication",
  q4: "Screening priority",
  q5: "FIB-4 reliability",
  q6: "Lean MASH",
  q7: "Best dose",
  q8: "Post weight-loss",
  q9: "Muscle loss concern",
  q10: "Nutritional suppl.",
  q11: "Efficacy rating",
  q12: "Adverse effects",
  q13: "Tolerability",
};

function formatAnswer(
  qId: string,
  answer: string | string[] | undefined,
): string {
  if (!answer || (Array.isArray(answer) && answer.length === 0)) return "—";
  const q = questions.find((q) => q.id === qId);
  if (!q) return Array.isArray(answer) ? answer.join(", ") : answer;
  if (Array.isArray(answer)) {
    return answer
      .map((v) => {
        const opt = q.options.find((o) => o.value === v);
        return opt ? `${v}. ${opt.label}` : v;
      })
      .join(" · ");
  }
  const opt = q.options.find((o) => o.value === answer);
  return opt ? `${answer}. ${opt.label}` : answer;
}

/* ── Analytics helper ────────────────────────────────────────────── */
function computeAnalytics(subs: Submission[]) {
  return questions.map((q) => {
    const counts: Record<string, number> = {};
    q.options.forEach((o) => {
      counts[o.value] = 0;
    });

    let totalAnswered = 0;
    subs.forEach((s) => {
      const ans = s.answers[q.id];
      if (!ans) return;
      totalAnswered++;
      if (Array.isArray(ans)) {
        ans.forEach((v) => {
          counts[v] = (counts[v] ?? 0) + 1;
        });
      } else {
        counts[ans] = (counts[ans] ?? 0) + 1;
      }
    });

    const totalForPercent = totalAnswered;

    const optionStats = q.options.map((o) => ({
      value: o.value,
      label: o.label,
      count: counts[o.value] ?? 0,
      percent:
        totalForPercent > 0
          ? Math.round(((counts[o.value] ?? 0) / totalForPercent) * 100)
          : 0,
    }));

    const topOption = optionStats.reduce(
      (best, cur) => (cur.count > best.count ? cur : best),
      optionStats[0],
    );

    return {
      question: q,
      totalAnswered,
      optionStats,
      topOption,
    };
  });
}

const ADMIN_USER = "Lupin@admin";
const ADMIN_PASS = "semaglutide";

/* ── Admin Page ──────────────────────────────────────────────────── */
export default function AdminPage() {
  /* auth — restore from sessionStorage so refresh keeps you logged in */
  const [authed, setAuthed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("admin_authed") === "1";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  /* data */
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  /* ui */
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"doctorName" | "submittedAt">(
    "submittedAt",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState("responses");

  /* Load from database after auth */
  useEffect(() => {
    if (!authed) return;
    async function fetchSubmissions() {
      try {
        const res = await fetch("/api/submissions");
        const data = await res.json();
        startTransition(() => {
          setSubmissions(Array.isArray(data) ? data : []);
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to load submissions:", err);
        startTransition(() => {
          setSubmissions([]);
          setLoading(false);
        });
      }
    }
    fetchSubmissions();
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem("admin_authed", "1");
      setAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password.");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        if (expandedRow === id) setExpandedRow(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function handleClearAll() {
    if (!confirm("Delete ALL submissions? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
      const result = await res.json();
      if (result.success) {
        setSubmissions([]);
        setExpandedRow(null);
      }
    } catch (err) {
      console.error("Clear all error:", err);
    }
  }

  function handleExportDataXlsx() {
    const header = [
      "#",
      "Doctor Name",
      "Submitted At",
      ...questions.map((q) => COL_HEADERS[q.id] ?? q.id),
    ];
    const rows = filteredSorted.map((s, i) => [
      i + 1,
      s.doctorName,
      new Date(s.submittedAt).toLocaleString(),
      ...questions.map((q) => formatAnswer(q.id, s.answers[q.id])),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

    /* Auto-size columns */
    ws["!cols"] = header.map((h, ci) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => String(r[ci] ?? "").length),
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(
      wb,
      `sema_survey_data_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  }

  function handleExportAnalyticsXlsx() {
    const wb = XLSX.utils.book_new();

    /* ── Sheet 1: Summary ─────────────────────────────── */
    const summaryRows: (string | number)[][] = [
      ["Semaglutide MASH Survey — Analytics Summary"],
      [],
      ["Total Responses", submissions.length],
      ["Total Questions", questions.length],
      [
        "Completion %",
        submissions.length > 0
          ? `${Math.round(
              (analytics.filter((a) => a.totalAnswered === submissions.length)
                .length /
                questions.length) *
                100,
            )}%`
          : "0%",
      ],
      [`Generated`, new Date().toLocaleString()],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 22 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    /* ── Sheet 2: Per-Question Breakdown ──────────────── */
    const detailHeader = [
      "Q#",
      "Question",
      "Type",
      "Total Answered",
      "Option",
      "Option Label",
      "Count",
      "Percentage",
      "Most Popular",
    ];
    const detailRows: (string | number)[][] = [];
    analytics.forEach((a, qi) => {
      a.optionStats.forEach((o) => {
        detailRows.push([
          `Q${qi + 1}`,
          a.question.text,
          a.question.type === "multiple" ? "Multiple Choice" : "Single Choice",
          a.totalAnswered,
          o.value,
          o.label,
          o.count,
          `${o.percent}%`,
          o.value === a.topOption.value && o.count > 0 ? "★" : "",
        ]);
      });
    });
    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
    wsDetail["!cols"] = [
      { wch: 5 },
      { wch: 60 },
      { wch: 16 },
      { wch: 15 },
      { wch: 7 },
      { wch: 45 },
      { wch: 7 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetail, "Question Breakdown");

    /* ── Sheet 3: Top Answers ─────────────────────────── */
    const topHeader = [
      "Q#",
      "Question",
      "Most Popular Option",
      "Option Label",
      "Count",
      "Percentage",
    ];
    const topRows = analytics.map((a, qi) => [
      `Q${qi + 1}`,
      a.question.text,
      a.topOption.value,
      a.topOption.label,
      a.topOption.count,
      `${a.topOption.percent}%`,
    ]);
    const wsTop = XLSX.utils.aoa_to_sheet([topHeader, ...topRows]);
    wsTop["!cols"] = [
      { wch: 5 },
      { wch: 60 },
      { wch: 18 },
      { wch: 45 },
      { wch: 7 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTop, "Top Answers");

    XLSX.writeFile(
      wb,
      `sema_survey_analytics_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  }

  function toggleSort(key: "doctorName" | "submittedAt") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filteredSorted = (() => {
    const term = search.toLowerCase();
    const filtered = submissions.filter(
      (s) =>
        s.doctorName.toLowerCase().includes(term) ||
        new Date(s.submittedAt).toLocaleDateString().includes(term),
    );
    return [...filtered].sort((a, b) => {
      const va = sortKey === "doctorName" ? a.doctorName : a.submittedAt;
      const vb = sortKey === "doctorName" ? b.doctorName : b.submittedAt;
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  })();

  const analytics = computeAnalytics(submissions);

  /* ── Login Screen ─────────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-sky-50 p-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          <Card className="shadow-[var(--shadow-lg)] border-border">
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Admin Login</CardTitle>
              <CardDescription>
                Sign in to view survey responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-user">Username</Label>
                  <Input
                    id="admin-user"
                    type="text"
                    value={username}
                    autoComplete="username"
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-pass">Password</Label>
                  <Input
                    id="admin-pass"
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 bg-primary text-white hover:bg-primary-dark"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>

                <div className="pt-1 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Survey
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ── Dashboard ────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Stethoscope className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Semaglutide MASH Survey
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDataXlsx}
              disabled={filteredSorted.length === 0}
              className="hidden gap-1.5 border-border sm:inline-flex"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Data .xlsx
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAnalyticsXlsx}
              disabled={submissions.length === 0}
              className="hidden gap-1.5 border-border sm:inline-flex"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics .xlsx
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={submissions.length === 0}
              className="hidden gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 sm:inline-flex"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </Button>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Back to Survey</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="border-border py-4 shadow-sm">
            <CardContent className="flex items-center gap-4 px-5 py-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total Responses
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {submissions.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border py-4 shadow-sm">
            <CardContent className="flex items-center gap-4 px-5 py-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-success-light">
                <ClipboardList className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Showing
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredSorted.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 border-border py-4 shadow-sm sm:col-span-1">
            <CardContent className="flex items-center gap-4 px-5 py-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100">
                <ClipboardList className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Questions
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {questions.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile action buttons */}
        <div className="flex flex-wrap gap-2 sm:hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportDataXlsx}
            disabled={filteredSorted.length === 0}
            className="flex-1 gap-1.5 border-border"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Data .xlsx
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAnalyticsXlsx}
            disabled={submissions.length === 0}
            className="flex-1 gap-1.5 border-border"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Analytics .xlsx
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            disabled={submissions.length === 0}
            className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear All
          </Button>
        </div>

        {/* ── Tabs: Responses / Analytics ──────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="responses" className="gap-1.5">
              <TableIcon className="h-3.5 w-3.5" />
              Responses
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════ RESPONSES TAB ═══════════════ */}
          <TabsContent value="responses">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Submissions</CardTitle>
                    <CardDescription>
                      Click any row to expand full answers
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Input
                      type="text"
                      placeholder="Search by doctor or date…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 border-border pl-9 text-sm"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-6">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : filteredSorted.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <ClipboardList className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      No submissions yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {search
                        ? "No results match your search."
                        : "Responses will appear here once doctors submit the survey."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-10 pl-4 text-center text-xs">
                            #
                          </TableHead>
                          <TableHead className="min-w-[160px] pl-4">
                            <button
                              onClick={() => toggleSort("doctorName")}
                              className="inline-flex items-center gap-1 text-xs font-semibold hover:text-primary"
                            >
                              Doctor Name{" "}
                              <SortIcon
                                active={sortKey === "doctorName"}
                                dir={sortDir}
                              />
                            </button>
                          </TableHead>
                          <TableHead className="min-w-[130px]">
                            <button
                              onClick={() => toggleSort("submittedAt")}
                              className="inline-flex items-center gap-1 text-xs font-semibold hover:text-primary"
                            >
                              Submitted At{" "}
                              <SortIcon
                                active={sortKey === "submittedAt"}
                                dir={sortDir}
                              />
                            </button>
                          </TableHead>
                          {questions.map((q) => (
                            <TableHead
                              key={q.id}
                              className="min-w-[120px] max-w-[160px] text-xs"
                            >
                              {COL_HEADERS[q.id] ?? q.id}
                            </TableHead>
                          ))}
                          <TableHead className="w-20 text-center text-xs">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredSorted.map((s, i) => (
                          <>
                            <TableRow
                              key={s.id}
                              className={cn(
                                "cursor-pointer transition-colors",
                                expandedRow === s.id &&
                                  "bg-primary/5 hover:bg-primary/5",
                              )}
                              onClick={() =>
                                setExpandedRow(
                                  expandedRow === s.id ? null : s.id,
                                )
                              }
                            >
                              <TableCell className="pl-4 text-center text-xs text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell className="pl-4 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {s.doctorName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate max-w-[120px]">
                                    {s.doctorName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                <div>
                                  {new Date(s.submittedAt).toLocaleDateString()}
                                </div>
                                <div className="text-[10px]">
                                  {new Date(s.submittedAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </div>
                              </TableCell>
                              {questions.map((q) => {
                                const ans = s.answers[q.id];
                                const val = Array.isArray(ans)
                                  ? ans
                                  : ans
                                    ? [ans]
                                    : [];
                                return (
                                  <TableCell
                                    key={q.id}
                                    className="max-w-[160px]"
                                  >
                                    {val.length === 0 ? (
                                      <span className="text-xs text-muted-foreground">
                                        —
                                      </span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1">
                                        {val.map((v) => (
                                          <Badge
                                            key={v}
                                            variant="outline"
                                            className="border-primary/25 bg-primary/5 px-1.5 py-0 text-[10px] font-semibold text-primary"
                                          >
                                            {v}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedRow(
                                        expandedRow === s.id ? null : s.id,
                                      );
                                    }}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                    title="View details"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(s.id);
                                    }}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {expandedRow === s.id && (
                              <TableRow
                                key={`${s.id}-expanded`}
                                className="hover:bg-transparent"
                              >
                                <TableCell
                                  colSpan={4 + questions.length}
                                  className="bg-primary/5 p-0"
                                >
                                  <div className="px-6 py-5">
                                    <div className="mb-3 flex items-center gap-2">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                                        {s.doctorName.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-foreground">
                                          {s.doctorName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Submitted{" "}
                                          {new Date(
                                            s.submittedAt,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <Separator className="mb-4 bg-border" />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      {questions.map((q, qi) => {
                                        const ans = s.answers[q.id];
                                        return (
                                          <div
                                            key={q.id}
                                            className="rounded-lg border border-border bg-white p-3"
                                          >
                                            <p className="mb-1.5 flex items-start gap-2 text-xs font-semibold text-foreground">
                                              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                                                {qi + 1}
                                              </span>
                                              {q.text}
                                            </p>
                                            <p className="pl-6 text-xs text-muted-foreground">
                                              {formatAnswer(q.id, ans)}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
          <TabsContent value="analytics">
            {submissions.length === 0 ? (
              <Card className="border-border shadow-sm">
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <BarChart3 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      No data to analyze
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Analytics will appear once survey responses are submitted.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-5">
                {/* Summary bar */}
                <Card className="border-border shadow-sm">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Responses
                          </p>
                          <p className="text-lg font-bold text-foreground leading-tight">
                            {submissions.length}
                          </p>
                        </div>
                      </div>
                      <Separator
                        orientation="vertical"
                        className="hidden h-8 sm:block"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                          <Hash className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Questions
                          </p>
                          <p className="text-lg font-bold text-foreground leading-tight">
                            {questions.length}
                          </p>
                        </div>
                      </div>
                      <Separator
                        orientation="vertical"
                        className="hidden h-8 sm:block"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                          <TrendingUp className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Completion
                          </p>
                          <p className="text-lg font-bold text-foreground leading-tight">
                            {submissions.length > 0
                              ? Math.round(
                                  (analytics.filter(
                                    (a) =>
                                      a.totalAnswered === submissions.length,
                                  ).length /
                                    questions.length) *
                                    100,
                                )
                              : 0}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportAnalyticsXlsx}
                      className="gap-1.5 border-border"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Export Analytics
                    </Button>
                  </CardContent>
                </Card>

                {/* Question-by-question analytics cards */}
                {analytics.map((a, qi) => (
                  <QuestionAnalyticsCard
                    key={a.question.id}
                    index={qi}
                    data={a}
                    totalSubmissions={submissions.length}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ── Sort Icon helper ─────────────────────────────────────────── */
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="h-3 w-3 text-primary" />
  );
}
