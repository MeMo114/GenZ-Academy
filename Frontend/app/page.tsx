"use client";

import { useEffect, useState } from "react";
import { getCourses, getCourseRounds, getLeaderboard } from "@/lib/api";
import { LandingExperience } from "@/components/LandingExperience";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import type { Course, CourseRound, LeaderboardEntry } from "@/lib/types";

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [rounds, setRounds] = useState<CourseRound[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      const destination = user.role === "academy_admin" || user.role === "admin" 
        ? "/admin" 
        : user.role === "engineer"
        ? "/engineer"
        : user.role === "cta"
        ? "/cta"
        : "/dashboard";
      router.replace(destination);
      return;
    }

    Promise.all([getCourses(), getCourseRounds(), getLeaderboard()])
      .then(([courseData, roundData, leaderboardData]) => {
        setCourses(courseData);
        setRounds(roundData);
        setLeaderboard(leaderboardData);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (loading || authLoading || user) {
    return (
      <div className="page-shell">
        <div className="page-loader">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <LandingExperience
      courses={courses}
      rounds={rounds}
      leaderboard={leaderboard}
    />
  );
}
