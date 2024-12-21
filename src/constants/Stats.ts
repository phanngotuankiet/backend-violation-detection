export interface RoleStats {
  role: string;
  _count: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  _count: number;
}

export interface UserStats {
  total: number;
  roleDistribution: RoleStats[];
  monthlyGrowth: MonthlyStats[];
}

export interface MonthlyForumStats {
  month: number;
  year: number;
  questions: number;
  answers: number;
  comments: number;
}

export interface ForumStats {
  total: {
    questions: number;
    answers: number;
    comments: number;
  };
  monthly: MonthlyForumStats[];
}

export interface TopContributor {
  id: number;
  name: string;
  email: string;
  questions: number;
  answers: number;
  comments: number;
  total: number;
}
export interface TopContributorsResponse {
  topQuestioners: Array<{
    id: number;
    name: string;
    email: string;
    _count: { questions: number };
  }>;
  topAnswerers: Array<{
    id: number;
    name: string;
    email: string;
    _count: { answers: number };
  }>;
  topCommenters: Array<{
    id: number;
    name: string;
    email: string;
    _count: { comments: number };
  }>;
  topOverall: TopContributor[];
}

export interface SensitiveStats {
  statusDistribution: {
    pending: number;
    reviewed: number;
    flagged: number;
  };
  topSearchers: {
    id: number;
    name: string;
    email: string;
    totalSearches: number;
  }[];
  topFlagged: {
    id: number;
    name: string;
    email: string;
    flaggedCount: number;
  }[];
}
