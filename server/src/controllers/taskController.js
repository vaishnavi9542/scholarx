import {
  createTask,
  deleteTask,
  getTaskSummary,
  listTasksForUser,
  updateTask
} from '../store/memoryStore.js';

export function getTasks(request, response) {
  const filters = {
    search: request.query.search,
    status: request.query.status,
    priority: request.query.priority
  };

  Promise.all([
    listTasksForUser(request.user.id, filters),
    getTaskSummary(request.user.id)
  ])
    .then(([tasks, summary]) => response.json({ tasks, summary }))
    .catch((error) => response.status(500).json({ message: error.message }));
}

export async function addTask(request, response) {
  const { title } = request.body;

  if (!title || !title.trim()) {
    return response.status(400).json({ message: 'Task title is required' });
  }

  const [task, summary] = await Promise.all([
    createTask(request.user.id, request.body),
    getTaskSummary(request.user.id)
  ]);

  return response.status(201).json({ task, summary });
}

export async function editTask(request, response) {
  const task = await updateTask(request.user.id, request.params.id, request.body);

  if (!task) {
    return response.status(404).json({ message: 'Task not found' });
  }

  const summary = await getTaskSummary(request.user.id);
  return response.json({ task, summary });
}

export async function removeTask(request, response) {
  const deleted = await deleteTask(request.user.id, request.params.id);

  if (!deleted) {
    return response.status(404).json({ message: 'Task not found' });
  }

  return response.status(204).send();
}
