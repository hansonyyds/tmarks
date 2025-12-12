/**
 * 设置按钮组件
 */

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 p-3 rounded-full glass hover:bg-white/20 transition-all duration-200 z-20"
        title="设置"
      >
        <Settings className="w-5 h-5 text-white/70" />
      </button>

      {isOpen && <SettingsPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}
