import type { CodingComparisonMode, CodingSubmissionStatus } from "@/types/database";

export interface JudgeAdapter {
  submit(request: JudgeRequest): Promise<JudgeSubmission>;
  getResult(token: string, request: JudgeRequest): Promise<JudgeResult>;
}

export interface JudgeRequest {
  sourceCode: string;
  language: "python";
  stdin: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  comparisonMode: CodingComparisonMode;
  tolerance: number;
}

export interface JudgeSubmission {
  token: string;
  status: CodingSubmissionStatus;
}

export interface JudgeResult {
  status: CodingSubmissionStatus;
  stdout: string | null;
  stderr: string | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  message?: string;
}

export interface JudgeCaseInput {
  id: string;
  name: string | null;
  inputData: string;
  expectedOutput: string;
  weight: number;
}

export interface JudgeCaseResult extends JudgeResult {
  testCaseId: string;
  name: string | null;
}
