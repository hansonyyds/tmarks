/**
 * 时钟组件
 */

import { useState, useEffect, useMemo } from 'react';
import { Lunar } from 'lunar-javascript';
import type { ClockFormat } from '../types';

interface ClockProps {
  format: ClockFormat;
  showDate: boolean;
  showSeconds: boolean;
  showLunar?: boolean;
}

export function Clock({ format, showDate, showSeconds, showLunar = false }: ClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    let period = '';

    if (format === '12h') {
      period = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }

    const hoursStr = hours.toString().padStart(2, '0');
    let result = `${hoursStr}:${minutes}`;
    if (showSeconds) result += `:${seconds}`;
    if (format === '12h') result += period;

    return result;
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    };
    return time.toLocaleDateString('zh-CN', options);
  };

  // 农历信息
  const lunarInfo = useMemo(() => {
    if (!showLunar) return null;
    const lunar = Lunar.fromDate(time);
    let festival = '';
    try {
      const festivals = (lunar as any).getFestivals?.() || [];
      const jieQi = (lunar as any).getJieQi?.() || '';
      festival = festivals[0] || jieQi || '';
    } catch {}

    return {
      date: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      festival,
    };
  }, [time, showLunar]);

  return (
    <div className="text-center text-white select-none">
      <div className="text-7xl font-light tracking-wider text-shadow-lg">
        {formatTime()}
      </div>
      {(showDate || showLunar) && (
        <div className="mt-2 text-lg text-white/90 text-shadow flex items-center justify-center gap-3">
          {showDate && <span>{formatDate()}</span>}
          {showDate && showLunar && <span className="text-white/50">|</span>}
          {showLunar && lunarInfo && (
            <>
              <span>{lunarInfo.date}</span>
              {lunarInfo.festival && (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-sm">
                  {lunarInfo.festival}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
