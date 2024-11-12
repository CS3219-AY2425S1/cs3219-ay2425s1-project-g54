export interface Question {
  qid: Number;
  title: string;
  description: string;
  complexity: string;
  categories: string[];
  attempted: string;
};

export const complexities = ["Easy", "Medium", "Hard"];

export const categories = ["Algorithms", "Arrays", "Bit Manipulation", "Brainteaser", "Data Structures", "Databases", "Recursion", "Strings"];

const validateQid = (qid: string | Number) => Number.isInteger(+qid) && +qid > 0;
const validateTitle = (title: string) => !!title.trim();
const validateDescription = (description: string) => !!description.trim();
const validateComplexity = (complexity: string) => complexities.includes(complexity);
const validateCategories = (categories: string | string[]) => Array.isArray(categories) && categories.sort().length > 0;

export function validateQuestion(question: Question) {
  return {
    qid: !validateQid(question.qid)
      ? "Please enter a valid question number."
      : "",
    title: !validateTitle(question.title)
      ? "Please enter a title for the question."
      : "",
    description: !validateDescription(question.description)
      ? "Please enter a description for the question."
      : "",
    complexity: !validateComplexity(question.complexity)
      ? "Please select a complexity."
      : "",
    categories: !validateCategories(question.categories)
      ? "Please categorise the question (separate with commas)."
      : "",
  };
}
