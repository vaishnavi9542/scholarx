import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    assignee: { type: String, default: 'Unassigned' },
    dueDate: { type: String, default: '' }
  },
  { timestamps: true }
);

const taskCollectionName = process.env.TASK_COLLECTION_NAME || 'tasks';

export default mongoose.models.Task || mongoose.model('Task', taskSchema, taskCollectionName);
