"use client";

import { useEffect, useState } from "react";
import { getCourses, getUserApplications } from "@/lib/api";
import { MyApplicationsExperience } from "@/components/MyApplicationsExperience";
import type { Course, CourseApplication } from "@/lib/types";

export default function ApplicationsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  useEffect(() => {
    // Load user applications FIRST (high priority)
    getUserApplications()
      .then(a => { setApplications(a); })
      .finally(() => setApplicationsLoading(false));

    // Load courses independently (low priority, no blocking)
    getCourses()
      .then(c => { setCourses(c); });
  }, []);

  if (applicationsLoading) return <div className="page-loader"><div className="spinner" /></div>;
  
  return <MyApplicationsExperience courses={courses} applications={applications} />;
}
