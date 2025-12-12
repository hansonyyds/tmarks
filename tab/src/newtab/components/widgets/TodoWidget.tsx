/**
 * 待办事项组件 - 网格版本
 */

import { useState, memo } from 'react';
import { Plus, Check, X, CheckSquare } from 'lucide-react';
import { useTodoStore } from '../../hooks/useTodoStore';
import type { WidgetRendererProps } from './types';
import { getSizeSpan } from './widgetRegistry';

export const TodoWidget = memo(function TodoWidget({
  item,
  onRemove,
  isEditing,
}: WidgetRendererProps) {
  const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore();
  const [newTodo, setNewTodo] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const { rows } = getSizeSpan(item.size);

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

  // 根据尺寸计算最大显示数量
  const maxItems = rows <= 2 ? 4 : rows <= 3 ? 6 : 10;

  return (
    <div className="group relative h-full p-3 rounded-xl glass-card flex flex-col">
      {isEditing && onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white 
                     opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white/80">
          <CheckSquare className="w-4 h-4" />
          <span className="text-sm font-medium">待办事项</span>
          {activeTodos.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
              {activeTodos.length}
            </span>
          )}
        </div>
        {completedTodos.length > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            {showCompleted ? '隐藏' : `${completedTodos.length} 完成`}
          </button>
        )}
      </div>

      {/* 输入框 */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加待办..."
          className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none 
                     border border-white/10 focus:border-white/30 placeholder-white/40"
        />
        <button
          onClick={handleAdd}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Plus className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* 待办列表 */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {displayTodos.length === 0 ? (
          <div className="text-center text-white/40 text-sm py-4">
            暂无待办事项
          </div>
        ) : (
          displayTodos.slice(0, maxItems).map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 group/item transition-colors ${
                todo.completed ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                  todo.completed
                    ? 'bg-green-500/50 border-green-500/50'
                    : 'border-white/30 hover:border-white/50'
                }`}
              >
                {todo.completed && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span
                className={`flex-1 text-sm text-white/80 truncate ${
                  todo.completed ? 'line-through' : ''
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => removeTodo(todo.id)}
                className="p-0.5 rounded opacity-0 group-hover/item:opacity-100 hover:bg-white/20 transition-all"
              >
                <X className="w-3 h-3 text-white/50" />
              </button>
            </div>
          ))
        )}
        {displayTodos.length > maxItems && (
          <div className="text-center text-white/40 text-xs py-1">
            还有 {displayTodos.length - maxItems} 项...
          </div>
        )}
      </div>
    </div>
  );
});
