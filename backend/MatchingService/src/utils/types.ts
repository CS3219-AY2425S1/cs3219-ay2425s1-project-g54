export enum DifficultyLevel {
  EASY = "Easy",
  MEDIUM = "Medium",
  HARD = "Hard",
}

// Add list of allowed question categories
export enum Category {
  ALGORITHMS = "Algorithms",
  ARRAYS = "Arrays",
  BIT_MANIPULATION = "Bit Manipulation",
  BRAINTEASER = "Brainteaser",
  DATA_STRUCTURES = "Data Structures",
  DATABASES = "Databases",
  RECURSION = "Recursion",
  STRINGS = "Strings",
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
