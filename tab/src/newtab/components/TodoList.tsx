/**
 * 待办事项组件
 */

import { useState } from 'react';
import { Plus, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useTodoStore } from '../hooks/useTodoStore';

export function TodoList() {
  const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore();
  const [newTodo, setNewTodo] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo(newTodo.trim());
    setNewTodo('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);
  const displayTodos = showCompleted ? todos : activeTodos;

  return (
    <div className="w-80 glass rounded-xl p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span className="text-sm font-medium">待办事项</span>
          {activeTodos.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
              {activeTodos.length}
            </span>
          )}
        </button>
        {completedTodos.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            {showCompleted ? '隐藏已完成' : `${completedTodos.length} 已完成`}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {/* 输入框 */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="添加待办..."
              className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10 focus:border-white/30 placeholder-white/40"
            />
            <button
              onClick={handleAdd}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Plus className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* 待办列表 */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {displayTodos.length === 0 ? (
              <div className="text-center text-white/40 text-sm py-4">
                暂无待办事项
              </div>
            ) : (
              displayTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 group transition-colors ${
                    todo.completed ? 'opacity-50' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-green-500/50 border-green-500/50'
                        : 'border-white/30 hover:border-white/50'
                    }`}
                  >
                    {todo.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span
                    className={`flex-1 text-sm text-white/80 ${
                      todo.completed ? 'line-through' : ''
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => removeTodo(todo.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
                  >
                    <X className="w-3 h-3 text-white/50" />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
