"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getApplicationQuestions, submitPretest, getUserApplications } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import type { ApplicationQuestion, CourseApplication } from "@/lib/types";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, Trophy } from "@phosphor-icons/react";
import Link from "next/link";

export default function PretestPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const courseId = searchParams.get("courseId");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [application, setApplication] = useState<CourseApplication | null>(null);

  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [questionsData, applicationsData] = await Promise.all([
          getApplicationQuestions(courseId),
          getUserApplications()
        ]);
        
        setQuestions(questionsData);
        
        if (applicationId) {
          const app = applicationsData.find(a => a.id === applicationId);
          setApplication(app || null);
        }
      } catch (error) {
        console.error("Failed to load pretest data:", error);
        toast("Failed to load pretest", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, courseId, applicationId, toast]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!applicationId) return;
    
    setSubmitting(true);
    try {
      const response = await submitPretest(applicationId, { answers });
      setResult(response);
      setShowResults(true);
      toast("Pretest submitted!", "success");
    } catch (error: any) {
      toast(error.message || "Failed to submit pretest", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center bg-canvas-soft px-6 font-body">
        <div className="bg-white rounded-[2rem] p-12 max-w-lg w-full text-center shadow-xl border border-black/5">
          <XCircle size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-zinc-500 mb-8">You need to be logged in to take the pretest.</p>
          <Link href="/auth" className="bg-ink text-canvas px-8 py-4 rounded-full font-bold shadow-md hover:bg-zinc-800 transition-colors inline-block w-full">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center bg-canvas-soft">
        <div className="w-8 h-8 border-4 border-black/10 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showResults && result) {
    const isPassed = result.status === "WaitingForPayment" || result.passed;
    return (
      <div className="min-h-screen bg-canvas-soft px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[3rem] p-12 border border-black/5 shadow-xl text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${isPassed ? "bg-green-100" : "bg-red-100"}`}>
              {isPassed ? <Trophy size={48} className="text-green-600" /> : <XCircle size={48} className="text-red-600" />}
            </div>
            <h2 className="text-3xl font-display font-black text-zinc-900 mb-2">
              {isPassed ? "Congratulations!" : "You Didn't Pass This Time"}
            </h2>
            <p className="text-zinc-500 font-medium mb-8">
              {isPassed 
                ? "You passed the pretest! Now you can complete your payment." 
                : "Don't worry, you can try again. Keep practicing!"}
            </p>
            
            {result.score !== undefined && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-50 rounded-2xl p-4">
                  <div className="text-3xl font-black text-zinc-900">{result.score}%</div>
                  <div className="text-xs font-bold text-zinc-500 uppercase">Your Score</div>
                </div>
                {result.passingScore !== undefined && (
                  <div className="bg-zinc-50 rounded-2xl p-4">
                    <div className="text-3xl font-black text-zinc-900">{result.passingScore}%</div>
                    <div className="text-xs font-bold text-zinc-500 uppercase">Passing Score</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              {isPassed ? (
                <Link 
                  href={`/payment?applicationId=${applicationId}&courseId=${courseId}`}
                  className="bg-[#ff1a1a] text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-wider shadow-md hover:bg-[#cc0000] hover:-translate-y-0.5 transition-all"
                >
                  Complete Payment
                </Link>
              ) : (
                <button
                  onClick={() => { setShowResults(false); setAnswers({}); setCurrentQuestionIndex(0); }}
                  className="bg-zinc-900 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-wider shadow-md hover:bg-zinc-800 transition-all"
                >
                  Try Again
                </button>
              )}
              <Link
                href="/applications"
                className="bg-zinc-100 text-zinc-900 px-10 py-4 rounded-full font-black text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all"
              >
                Back to Applications
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-canvas-soft px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[3rem] p-12 border border-black/5 shadow-xl text-center">
            <Clock size={64} className="text-zinc-300 mx-auto mb-6" />
            <h2 className="text-2xl font-display font-black text-zinc-900 mb-4">No Pretest Available</h2>
            <p className="text-zinc-500 font-medium mb-8">
              There is no pretest for this course at the moment.
            </p>
            <Link
              href="/applications"
              className="bg-zinc-900 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-wider hover:bg-zinc-800 transition-all"
            >
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const options = currentQuestion.optionsJson ? JSON.parse(currentQuestion.optionsJson) : [];

  return (
    <div className="min-h-screen bg-canvas-soft px-6 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/applications" className="flex items-center gap-2 text-zinc-500 font-bold hover:text-zinc-900 transition-colors">
            <ArrowLeft size={20} weight="bold" /> Back to Applications
          </Link>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-black/5">
            <Clock size={16} weight="bold" className="text-zinc-400" />
            <span className="text-sm font-bold text-zinc-900">Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ff1a1a] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-[3rem] p-10 border border-black/5 shadow-sm mb-6">
          <h2 className="text-2xl font-display font-black text-zinc-900 mb-6">
            {currentQuestion.questionText}
          </h2>
          
          {currentQuestion.helpText && (
            <p className="text-sm text-zinc-500 mb-6 bg-zinc-50 p-4 rounded-xl">
              {currentQuestion.helpText}
            </p>
          )}

          <div className="space-y-3">
            {options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`w-full p-5 rounded-2xl text-left font-bold text-lg transition-all border-2 ${
                  answers[currentQuestion.id] === option
                    ? "bg-[#ff1a1a] text-white border-[#ff1a1a]"
                    : "bg-zinc-50 text-zinc-700 border-transparent hover:border-zinc-200"
                }`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full mr-4 bg-white/20 text-sm">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1 py-4 bg-white text-zinc-900 font-black rounded-2xl border border-black/5 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} weight="bold" /> Previous
          </button>
          
          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !answers[currentQuestion.id]}
              className="flex-1 py-4 bg-[#ff1a1a] text-white font-black rounded-2xl hover:bg-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? "Submitting..." : "Submit Pretest"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="flex-1 py-4 bg-zinc-900 text-white font-black rounded-2xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              Next <ArrowRight size={20} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
