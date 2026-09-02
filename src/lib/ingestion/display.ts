const EVENT_LABELS: Record<string, string> = {
  submission_created: "创建投稿",
  parse_started: "开始解析",
  parse_succeeded: "解析成功",
  parse_failed: "解析失败",
  parse_retry: "重试解析",
  review_opened: "进入审核",
  draft_edited: "编辑草稿",
  draft_approved: "批准草稿",
  submission_rejected: "拒绝投稿",
  review_blocked: "封禁审核",
  publish_started: "开始发布",
  question_accepted: "接受问题匹配",
  question_new_canonical: "创建标准问题",
  question_rejected: "拒绝问题",
  duplicate_flagged: "标记为重复",
};

const MESSAGE_LABELS: Record<string, string> = {
  blocked: "已封禁",
  "parse job queued": "解析任务已排队",
  "manual retry": "手动重试",
  "reset to review": "重置为待审核",
  "approved by reviewer": "审核员已批准",
  "publish requested": "已请求发布",
  "draft persisted": "草稿已保存",
  "metadata edited by reviewer": "审核员已编辑元数据",
};

const ERROR_CODE_LABELS: Record<string, string> = {
  rate_limited: "请求过于频繁",
  timeout: "请求超时",
  invalid_json: "JSON 无效",
  empty_response: "返回为空",
  provider_outage: "服务提供方不可用",
  schema_mismatch: "结构校验失败",
  size_limit: "超出长度限制",
  unknown: "未知错误",
};

const MODERATION_FLAG_LABELS: Record<string, string> = {
  email: "邮箱",
  phone: "电话",
  personal_name: "姓名",
  account_id: "账号",
  spam: "垃圾内容",
  too_short: "内容过短",
  url: "链接",
};

export function displayIngestionEventType(value: string): string {
  return EVENT_LABELS[value] ?? "未知事件";
}

export function displayIngestionMessage(value: string | null | undefined): string {
  if (!value) return "—";
  return MESSAGE_LABELS[value] ?? "未知消息";
}

export function displayIngestionErrorCode(value: string | null | undefined): string {
  if (!value) return "—";
  return ERROR_CODE_LABELS[value] ?? "未知错误";
}

export function displayModerationFlagType(value: string): string {
  return MODERATION_FLAG_LABELS[value] ?? "其他标记";
}
