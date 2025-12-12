/**
 * 农历日期组件
 */

import { useMemo } from 'react';
import { Lunar } from 'lunar-javascript';

export function LunarDate() {
  const lunarInfo = useMemo(() => {
    const lunar = Lunar.fromDate(new Date());
    // 获取节日或节气
    let festival = '';
    try {
      const festivals = (lunar as any).getFestivals?.() || [];
      const jieQi = (lunar as any).getJieQi?.() || '';
      festival = festivals[0] || jieQi || '';
    } catch {}
    
    return {
      date: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      year: `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年`,
      festival,
    };
  }, []);

  return (
    <div className="text-center text-white/70 text-sm select-none">
      <span>{lunarInfo.year} {lunarInfo.date}</span>
      {lunarInfo.festival && (
        <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
          {lunarInfo.festival}
        </span>
      )}
    </div>
  );
}
