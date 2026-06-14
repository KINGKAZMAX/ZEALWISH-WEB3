import type { ProjectsState } from "../../src/types";
import {
  createProjectFromWorkItems,
  listWorkItems,
  loadProjectsState,
  saveProjectsState,
} from "./unified-memory";

export async function aggregateProjects(input: {
  userId: string;
  now: number;
  dataRoot?: string;
}): Promise<ProjectsState> {
  const [currentState, workItems] = await Promise.all([
    loadProjectsState(input.userId, input.dataRoot),
    listWorkItems(input.userId, input.dataRoot),
  ]);
  const project = createProjectFromWorkItems(input.userId, workItems, input.now);

  if (!project) {
    return currentState;
  }

  const nextProjects = [
    project,
    ...currentState.projects.filter((item) => item.id !== project.id),
  ].slice(0, 10);
  const nextState: ProjectsState = {
    version: 1,
    userId: input.userId,
    generatedAt: input.now,
    projects: nextProjects,
  };

  await saveProjectsState(nextState, input.dataRoot);
  return nextState;
}
