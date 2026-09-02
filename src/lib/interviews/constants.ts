import type {
  InterviewDifficulty,
  InterviewEmploymentType,
  InterviewExperienceLevel,
  InterviewSort,
} from "@/types/interview";

export const INTERVIEW_PAGE_SIZE = 20;
export const INTERVIEW_MAX_PAGE = 500;

export const INTERVIEW_SORT_LABELS: Record<InterviewSort, string> = {
  latest: "最新发布",
  most_questions: "问题最多",
  difficulty: "难度",
};

export const INTERVIEW_DIFFICULTY_LABELS: Record<InterviewDifficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
  unknown: "未评级",
};

export const EXPERIENCE_LEVEL_LABELS: Record<InterviewExperienceLevel, string> = {
  intern: "实习生",
  new_grad: "应届生",
  experienced: "有经验",
  unknown: "未注明经验",
};

export const EMPLOYMENT_TYPE_LABELS: Record<InterviewEmploymentType, string> = {
  internship: "实习",
  full_time: "全职",
  contract: "合同制",
  unknown: "未注明雇佣类型",
};

export const SEASON_LABELS: Record<string, string> = {
  spring: "春季",
  summer: "夏季",
  autumn: "秋季",
  fall: "秋季",
  winter: "冬季",
};

export const ROUND_TYPE_LABELS: Record<string, string> = {
  recruiter: "招聘面",
  technical: "技术面",
  coding: "Coding",
  research: "研究面",
  manager: "Hiring manager 面",
  behavioral: "行为面",
  mixed: "综合面",
  unknown: "面试轮次",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  user_submission: "社区投稿",
  public_source: "公开来源",
  editorial: "RoboPrep 编辑内容",
  community: "社区面经",
  candidate_report: "候选人面经",
  development_seed: "开发示例",
};
