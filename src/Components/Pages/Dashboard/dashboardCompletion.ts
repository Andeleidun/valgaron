import type {
  ModeActivationRequirementId,
  ModeType,
  ProfileType,
} from '../../../types';
import { getModeActivationRequirementStatuses } from '../../../Utlilities/modeActivationRequirements';

/**
 * Dashboard task identifiers used for completion guidance.
 */
export type DashboardTaskId =
  | 'addPhoto'
  | 'addName'
  | 'addAge'
  | 'addLocation'
  | 'addSeeking'
  | 'addSummary'
  | 'addPronouns'
  | 'addHobbies'
  | 'addTagline'
  | 'addPrimaryAffiliation'
  | 'addHighlights';

type WeightedTask = {
  id: DashboardTaskId;
  weight: number;
  isComplete: boolean;
};

const requirementTaskMetadata: Record<
  ModeActivationRequirementId,
  Pick<WeightedTask, 'id' | 'weight'>
> = {
  photo: { id: 'addPhoto', weight: 100 },
  name: { id: 'addName', weight: 90 },
  age: { id: 'addAge', weight: 80 },
  location: { id: 'addLocation', weight: 85 },
  pronouns: { id: 'addPronouns', weight: 70 },
  seeking: { id: 'addSeeking', weight: 85 },
  socialSummary: { id: 'addSummary', weight: 65 },
  hobbies: { id: 'addHobbies', weight: 60 },
  tagline: { id: 'addTagline', weight: 70 },
  primaryAffiliation: { id: 'addPrimaryAffiliation', weight: 75 },
  highlights: { id: 'addHighlights', weight: 55 },
};

/**
 * Completion output for dashboard summary and next-action hints.
 */
export type DashboardCompletionResult = {
  percentage: number;
  missingTaskIds: DashboardTaskId[];
};

/**
 * Resolve activation-aligned completion and dashboard-prioritized missing tasks.
 */
export const calculateDashboardCompletion = ({
  modeId,
  profile,
}: {
  modeId: ModeType['id'];
  profile?: ProfileType;
}): DashboardCompletionResult => {
  const tasks = getWeightedTasks(modeId, profile);
  if (tasks.length === 0) {
    return { percentage: 0, missingTaskIds: [] };
  }

  const completedTaskCount = tasks.reduce(
    (sum, task) => sum + (task.isComplete ? 1 : 0),
    0
  );
  const missingTaskIds = tasks
    .filter((task) => !task.isComplete)
    .sort((taskA, taskB) => taskB.weight - taskA.weight)
    .slice(0, 3)
    .map((task) => task.id);

  return {
    percentage: Math.round((completedTaskCount / tasks.length) * 100),
    missingTaskIds,
  };
};

/**
 * Build dashboard task priorities from the shared activation requirements.
 */
const getWeightedTasks = (
  modeId: ModeType['id'],
  profile?: ProfileType
): WeightedTask[] =>
  getModeActivationRequirementStatuses({ modeId, profile }).map(
    (requirement) => ({
      id: requirementTaskMetadata[requirement.id].id,
      weight: requirementTaskMetadata[requirement.id].weight,
      isComplete: requirement.isComplete,
    })
  );
