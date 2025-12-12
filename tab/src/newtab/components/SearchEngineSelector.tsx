/**
 * 搜索引擎选择器组件
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SEARCH_ENGINES } from '../constants';
import type { SearchEngine } from '../types';

interface SearchEngineSelectorProps {
  current: SearchEngine;
  onChange: (engine: SearchEngine) => void;
}

// 搜索引擎图标组件
function EngineIcon({ icon, name, size = 'md' }: { icon: string; name: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <img
      src={icon}
      alt={name}
      className={`${sizeClass} object-contain`}
      onError={(e) => {
        // 图标加载失败时隐藏图片，显示默认图标
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent && !parent.querySelector('.fallback-icon')) {
          const fallback = document.createElement('span');
          fallback.className = `fallback-icon ${sizeClass} flex items-center justify-center`;
          fallback.innerHTML = `<svg class="${sizeClass} text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`;
          parent.appendChild(fallback);
        }
      }}
    />
  );
}

export function SearchEngineSelector({ current, onChange }: SearchEngineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentEngine = SEARCH_ENGINES.find((e) => e.id === current) || SEARCH_ENGINES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <EngineIcon icon={currentEngine.icon} name={currentEngine.name} />
        <ChevronDown className={`w-3 h-3 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-40 rounded-xl glass-dark overflow-hidden z-50 animate-scaleIn">
            {SEARCH_ENGINES.map((engine) => (
              <button
                key={engine.id}
                onClick={() => {
                  onChange(engine.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  engine.id === current ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <EngineIcon icon={engine.icon} name={engine.name} />
                <span className="text-sm text-white/80">{engine.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
