
import { Question, InitialFilters } from '../../../types/models';

// Re-export models so existing imports in components don't break
export * from '../../../types/models';
export * from './store';

export const filterKeys = [
  'subject', 'topic', 'subTopic', 
  'difficulty', 'questionType', 
  'examName', 'examYear', 'examDateShift', 
  'tags'
] as const;

export function getQuestionValue(question: Question, key: keyof InitialFilters): string | string[] | undefined {
  switch (key) {
    case 'subject': return question.classification.subject;
    case 'topic': return question.classification.topic;
    case 'subTopic': return question.classification.subTopic;
    case 'difficulty': return question.properties.difficulty;
    case 'questionType': return question.properties.questionType;
    case 'examName': return question.sourceInfo.examName;
    case 'examYear': return String(question.sourceInfo.examYear);
    case 'examDateShift': return question.sourceInfo.examDateShift;
    case 'tags': return question.tags;
    default: return undefined;
  }
}

export interface SettingsContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isHapticEnabled: boolean;
  toggleHaptics: () => void;
  areBgAnimationsEnabled: boolean;
  toggleBgAnimations: () => void;
}
