export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskInput = Pick<Task, 'title'> & Partial<Pick<Task, 'done'>>;
