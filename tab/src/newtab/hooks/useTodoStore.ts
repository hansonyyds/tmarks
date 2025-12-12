/**
 * 待办事项状态管理
 */

import { create } from 'zustand';
import type { TodoItem } from '../types';

const STORAGE_KEY = 'newtab_todos';

interface TodoState {
  todos: TodoItem[];
  loadTodos: () => Promise<void>;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  clearCompleted: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],

  loadTodos: async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const todos = result[STORAGE_KEY] as TodoItem[] | undefined;
      if (todos) {
        set({ todos });
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  },

  addTodo: (text) => {
    const { todos } = get();
    const newTodo: TodoItem = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    const newTodos = [newTodo, ...todos];
    set({ todos: newTodos });
    chrome.storage.local.set({ [STORAGE_KEY]: newTodos });
  },

  toggleTodo: (id) => {
    const { todos } = get();
    const newTodos = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    set({ todos: newTodos });
    chrome.storage.local.set({ [STORAGE_KEY]: newTodos });
  },

  removeTodo: (id) => {
    const { todos } = get();
    const newTodos = todos.filter((t) => t.id !== id);
    set({ todos: newTodos });
    chrome.storage.local.set({ [STORAGE_KEY]: newTodos });
  },

  clearCompleted: () => {
    const { todos } = get();
    const newTodos = todos.filter((t) => !t.completed);
    set({ todos: newTodos });
    chrome.storage.local.set({ [STORAGE_KEY]: newTodos });
  },
}));

// 初始化加载
useTodoStore.getState().loadTodos();
