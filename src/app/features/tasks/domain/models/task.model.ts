// Atributos que definen una tarea.
export interface Task {
  id: number;
  title: string;
  completed: boolean;
  categoryId: number | null;
  createdAt: string;
}

// Atributos para crear una nueva tarea.
export interface NewTask {
  title: string;
  categoryId: number | null;
}
