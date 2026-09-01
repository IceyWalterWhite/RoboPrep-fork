import type {
  InterviewDifficulty,
  InterviewEmploymentType,
  InterviewExperienceLevel,
  InterviewSort,
} from "@/types/interview";

export const INTERVIEW_PAGE_SIZE = 20;
export const INTERVIEW_MAX_PAGE = 500;

export const INTERVIEW_SORT_LABELS: Record<InterviewSort, string> = {
  latest: "Latest",
  most_questions: "Most questions",
  difficulty: "Difficulty",
};

export const INTERVIEW_DIFFICULTY_LABELS: Record<InterviewDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  unknown: "Not rated",
};

export const EXPERIENCE_LEVEL_LABELS: Record<InterviewExperienceLevel, string> = {
  intern: "Intern",
  new_grad: "New grad",
  experienced: "Experienced",
  unknown: "Experience not specified",
};

export const EMPLOYMENT_TYPE_LABELS: Record<InterviewEmploymentType, string> = {
  internship: "Internship",
  full_time: "Full time",
  contract: "Contract",
  unknown: "Employment not specified",
};

export const SEASON_LABELS: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  fall: "Autumn",
  winter: "Winter",
};

export const ROUND_TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  technical: "Technical",
  coding: "Coding",
  research: "Research",
  manager: "Hiring manager",
  behavioral: "Behavioral",
  mixed: "Mixed",
  unknown: "Interview round",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  user_submission: "Community submission",
  public_source: "Public source",
  editorial: "RoboPrep editorial",
  community: "Community report",
  candidate_report: "Candidate report",
  development_seed: "Development example",
};
