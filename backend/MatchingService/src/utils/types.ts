export enum DifficultyLevel {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

// Add list of allowed question categories
export enum Category {
  ARRAYS = "ARRAYS",
  STRINGS = "STRINGS",
  LINKED_LISTS = "LINKED LISTS",
  TREES = "TREES",
  DYNAMIC_PROGRAMMING = "DYNAMIC PROGRAMMING",
}

export interface MatchRequest {
  difficultyLevel: DifficultyLevel;
  category?: Category;
}

export interface UserMatch {
  difficultyLevel: DifficultyLevel;
  category?: Category | null;
}

export interface QueuedUser extends MatchRequest {
  userId: string;
}
