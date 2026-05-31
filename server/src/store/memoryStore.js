import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { isDatabaseConnected } from '../config/db.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

const users = [];
const tasks = [];

const statusOrder = ['todo', 'in-progress', 'done'];

function now() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toPlain(record) {
  if (!record) {
    return null;
  }

  return typeof record.toObject === 'function' ? record.toObject() : record;
}

function normalizeUser(record) {
  const plain = toPlain(record);

  if (!plain) {
    return null;
  }

  const { _id, __v, passwordHash, ...safeUser } = plain;

  return {
    ...safeUser,
    id: safeUser.id || _id?.toString()
  };
}

function normalizeTask(record) {
  const plain = toPlain(record);

  if (!plain) {
    return null;
  }

  const { _id, __v, ...safeTask } = plain;

  return {
    ...safeTask,
    id: safeTask.id || _id?.toString(),
    userId: safeTask.userId?.toString?.() || safeTask.userId
  };
}

export function sanitizeUser(user) {
  return normalizeUser(user);
}

export async function seedDemoData() {
  if (isDatabaseConnected()) {
    const existingUser = await User.findOne({ email: 'demo@scholarx.dev' });

    if (existingUser) {
      return;
    }

    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@scholarx.dev',
      passwordHash: bcrypt.hashSync('Password123!', 10)
    });

    await Task.insertMany([
      {
        userId: demoUser._id,
        title: 'Finalize sprint board',
        description: 'Review open items, reprioritize blockers, and prepare the next release.',
        status: 'in-progress',
        priority: 'high',
        assignee: 'Amina',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
      },
      {
        userId: demoUser._id,
        title: 'Design onboarding flow',
        description: 'Map the empty state, task creation, and first-run guidance.',
        status: 'todo',
        priority: 'medium',
        assignee: 'Jordan',
        dueDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10)
      },
      {
        userId: demoUser._id,
        title: 'Ship analytics panel',
        description: 'Validate the completion rate calculation and weekly throughput cards.',
        status: 'done',
        priority: 'low',
        assignee: 'Leah',
        dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      }
    ]);

    return;
  }

  if (users.some((user) => user.email === 'demo@scholarx.dev')) {
    return;
  }

  const demoUser = {
    id: 'demo-user',
    name: 'Demo User',
    email: 'demo@scholarx.dev',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    createdAt: now()
  };

  users.push(demoUser);

  tasks.push(
    {
      id: createId(),
      userId: demoUser.id,
      title: 'Finalize sprint board',
      description: 'Review open items, reprioritize blockers, and prepare the next release.',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Amina',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: createId(),
      userId: demoUser.id,
      title: 'Design onboarding flow',
      description: 'Map the empty state, task creation, and first-run guidance.',
      status: 'todo',
      priority: 'medium',
      assignee: 'Jordan',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: createId(),
      userId: demoUser.id,
      title: 'Ship analytics panel',
      description: 'Validate the completion rate calculation and weekly throughput cards.',
      status: 'done',
      priority: 'low',
      assignee: 'Leah',
      dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      createdAt: now(),
      updatedAt: now()
    }
  );
}

export async function listUsers() {
  if (isDatabaseConnected()) {
    const records = await User.find();
    return records.map(normalizeUser);
  }

  return clone(users.map(normalizeUser));
}

export async function findUserByEmail(email) {
  if (isDatabaseConnected()) {
    return User.findOne({ email: normalizeEmail(email) });
  }

  return users.find((user) => user.email === normalizeEmail(email)) || null;
}

export async function findUserById(userId) {
  if (isDatabaseConnected()) {
    return User.findById(userId);
  }

  return users.find((user) => user.id === userId) || null;
}

export async function createUser({ name, email, password }) {
  if (isDatabaseConnected()) {
    const record = await User.create({
      name: name.trim(),
      email: normalizeEmail(email),
      passwordHash: bcrypt.hashSync(password, 10)
    });

    return normalizeUser(record);
  }

  const user = {
    id: createId(),
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: now()
  };

  users.push(user);
  return sanitizeUser(user);
}

export function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.passwordHash);
}

function matchesFilters(task, filters = {}) {
  const search = filters.search?.trim().toLowerCase();

  if (filters.status && task.status !== filters.status) {
    return false;
  }

  if (filters.priority && task.priority !== filters.priority) {
    return false;
  }

  if (search) {
    const haystack = [task.title, task.description, task.assignee].join(' ').toLowerCase();
    if (!haystack.includes(search)) {
      return false;
    }
  }

  return true;
}

export async function listTasksForUser(userId, filters = {}) {
  if (isDatabaseConnected()) {
    const query = { userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    const records = await Task.find(query).sort({ updatedAt: -1 });
    return records.map(normalizeTask).filter((task) => matchesFilters(task, filters));
  }

  return tasks
    .filter((task) => task.userId === userId)
    .filter((task) => matchesFilters(task, filters))
    .sort((left, right) => {
      const leftStatus = statusOrder.indexOf(left.status);
      const rightStatus = statusOrder.indexOf(right.status);
      if (leftStatus !== rightStatus) {
        return leftStatus - rightStatus;
      }

      return new Date(right.updatedAt) - new Date(left.updatedAt);
    })
    .map(clone);
}

export async function createTask(userId, payload) {
  if (isDatabaseConnected()) {
    const record = await Task.create({
      userId,
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      status: payload.status || 'todo',
      priority: payload.priority || 'medium',
      assignee: payload.assignee?.trim() || 'Unassigned',
      dueDate: payload.dueDate || ''
    });

    return normalizeTask(record);
  }

  const task = {
    id: createId(),
    userId,
    title: payload.title.trim(),
    description: payload.description?.trim() || '',
    status: payload.status || 'todo',
    priority: payload.priority || 'medium',
    assignee: payload.assignee?.trim() || 'Unassigned',
    dueDate: payload.dueDate || '',
    createdAt: now(),
    updatedAt: now()
  };

  tasks.push(task);
  return clone(task);
}

export async function updateTask(userId, taskId, payload) {
  if (isDatabaseConnected()) {
    const record = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      {
        ...(payload.title ? { title: payload.title.trim() } : {}),
        ...(payload.description !== undefined ? { description: payload.description?.trim() || '' } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.priority ? { priority: payload.priority } : {}),
        ...(payload.assignee ? { assignee: payload.assignee.trim() } : {}),
        ...(payload.dueDate !== undefined ? { dueDate: payload.dueDate } : {}),
        updatedAt: new Date()
      },
      { new: true }
    );

    return normalizeTask(record);
  }

  const task = tasks.find((entry) => entry.id === taskId && entry.userId === userId);

  if (!task) {
    return null;
  }

  task.title = payload.title?.trim() ?? task.title;
  task.description = payload.description?.trim() ?? task.description;
  task.status = payload.status ?? task.status;
  task.priority = payload.priority ?? task.priority;
  task.assignee = payload.assignee?.trim() || task.assignee;
  task.dueDate = payload.dueDate ?? task.dueDate;
  task.updatedAt = now();

  return clone(task);
}

export async function deleteTask(userId, taskId) {
  if (isDatabaseConnected()) {
    const result = await Task.deleteOne({ _id: taskId, userId });
    return result.deletedCount > 0;
  }

  const index = tasks.findIndex((entry) => entry.id === taskId && entry.userId === userId);

  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  return true;
}

export async function getTaskSummary(userId) {
  if (isDatabaseConnected()) {
    const userTasks = await Task.find({ userId });
    const total = userTasks.length;
    const completed = userTasks.filter((task) => task.status === 'done').length;
    const inProgress = userTasks.filter((task) => task.status === 'in-progress').length;
    const overdue = userTasks.filter((task) => task.dueDate && task.status !== 'done' && task.dueDate < now().slice(0, 10)).length;
    const highPriority = userTasks.filter((task) => task.priority === 'high').length;

    return {
      total,
      completed,
      inProgress,
      overdue,
      highPriority,
      completionRate: total ? Math.round((completed / total) * 100) : 0
    };
  }

  const userTasks = tasks.filter((task) => task.userId === userId);
  const total = userTasks.length;
  const completed = userTasks.filter((task) => task.status === 'done').length;
  const inProgress = userTasks.filter((task) => task.status === 'in-progress').length;
  const overdue = userTasks.filter((task) => task.dueDate && task.status !== 'done' && task.dueDate < now().slice(0, 10)).length;
  const highPriority = userTasks.filter((task) => task.priority === 'high').length;

  return {
    total,
    completed,
    inProgress,
    overdue,
    highPriority,
    completionRate: total ? Math.round((completed / total) * 100) : 0
  };
}
