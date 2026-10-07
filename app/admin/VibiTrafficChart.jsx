// Adapted directly from vibi_solution/src/components/AdminTrafficChart.tsx.
"use client";
import { useState } from "react";
function VibiTrafficChart({ dailyStats, isGa4Active, averageDuration }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [range, setRange] = useState(7);
  const activeStats = dailyStats && dailyStats.length > 0 ? dailyStats.slice(-range) : Array.from({ length: range }).map((_, i) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - (range - 1 - i));
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      views: 0,
      revenue: 0,
      visitors: 0
    };
  });
  const width = range === 30 ? 840 : 600;
  const height = 200;
  const paddingX = range === 30 ? 55 : 50;
  const paddingY = 30;
  const maxVal = Math.max(...activeStats.flatMap((d) => [d.views, d.visitors]), 500);
  const maxRevenue = Math.max(...activeStats.map((d) => d.revenue ?? 0), 1);
  const slotWidth = (width - paddingX * 2) / activeStats.length;
  const coinWidth = range === 30 ? Math.max(16, Math.min(22, slotWidth * 0.72)) : Math.min(38, slotWidth * 0.56);
  const coinThickness = range === 30 ? Math.max(3.2, Math.min(4.5, coinWidth * 0.24)) : Math.max(5, Math.min(7, coinWidth * 0.2));
  const getCoords = (index, val) => {
    const x = paddingX + slotWidth * (index + 0.5);
    const y = height - paddingY - val * (height - paddingY * 2) / maxVal;
    return { x, y };
  };
  const viewsPoints = activeStats.map((d, i) => getCoords(i, d.views));
  const visitorsPoints = activeStats.map((d, i) => getCoords(i, d.visitors));
  const viewsPath = viewsPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const visitorsPath = visitorsPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const viewsAreaPath = `${viewsPath} L ${viewsPoints[viewsPoints.length - 1].x} ${height - paddingY} L ${viewsPoints[0].x} ${height - paddingY} Z`;
  const visitorsAreaPath = `${visitorsPath} L ${visitorsPoints[visitorsPoints.length - 1].x} ${height - paddingY} L ${visitorsPoints[0].x} ${height - paddingY} Z`;
  const totalViews = activeStats.reduce((sum, d) => sum + d.views, 0);
  const totalVisitors = activeStats.reduce((sum, d) => sum + d.visitors, 0);
  const todayStats = activeStats[activeStats.length - 1];
  const todayViews = todayStats ? todayStats.views : 0;
  const todayVisitors = todayStats ? todayStats.visitors : 0;
  return <div className="vibi-traffic-chart bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100 space-y-5">
      {
    /* Header: Mobile-optimized stacked layout */
  }
      <div className="space-y-3">
        <div>
          <h3 className="text-[14px] sm:text-[16px] font-bold text-gray-900 flex flex-wrap items-center gap-2">
            <span>GA4 트래픽 모니터링</span>
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${isGa4Active ? "bg-green-50 text-green-600 border border-green-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-green-500 ${isGa4Active ? "animate-pulse" : "bg-amber-500"}`} />
              {isGa4Active ? "GA4 \uD65C\uC131" : "\uBCF4\uACE0\uC11C \uC5F0\uACB0 \uB300\uAE30"}
            </span>
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
            GA4 실제 페이지뷰·방문자와 예약 DB 집계 · 보고서 처리 지연이 반영됩니다.
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-[11px] sm:text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-[#fc1c49]">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#fc1c49]" />
            <span>PV</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-500">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500" />
            <span>UV</span>
          </div>
          <span className="text-yellow-600">● 예약 (건)</span>
          <div className="ml-auto flex shrink-0 rounded-lg bg-gray-100 p-1" role="group" aria-label="차트 기간">
            {[7, 30].map((days) => <button
    key={days}
    type="button"
    aria-pressed={range === days}
    onClick={() => {
      setHoveredIndex(null);
      setRange(days);
    }}
    className={`rounded-md px-3 py-1.5 ${range === days ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
  >
                {days}일
              </button>)}
          </div>
        </div>
      </div>

      {
    /* Summary Cards - Mobile: 2x2 compact grid, no scroll */
  }
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3 sm:p-4 bg-gray-50 rounded-md">
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">{range}일 PV</span>
          <p className="text-sm sm:text-lg font-bold text-gray-900 flex items-center gap-1">
            {totalViews.toLocaleString()}

          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">{range}일 UV</span>
          <p className="text-sm sm:text-lg font-bold text-gray-900">{totalVisitors.toLocaleString()}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-[#fc1c49] font-bold">오늘 PV</span>
          <p className="text-sm sm:text-lg font-bold text-gray-900">{todayViews.toLocaleString()}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-[11px] font-medium text-blue-500 font-bold">오늘 UV</span>
          <p className="text-sm sm:text-lg font-bold text-gray-900">{todayVisitors.toLocaleString()}</p>
        </div>
        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">평균 체류</span>
          <p className="text-sm sm:text-lg font-bold text-gray-900">{averageDuration}</p>
        </div>
      </div>

      {
    /* SVG Chart - uses viewBox for full responsiveness, no overflow-x */
  }
      <div className="relative w-full select-none touch-pan-y" onTouchStart={() => setHoveredIndex(null)}>
        <svg className="w-full" viewBox={`0 0 ${width} ${height}`} fill="none" style={{ height: "auto", minHeight: "140px", maxHeight: "256px" }}>
          <defs>
            <linearGradient id="viewsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fc1c49" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fc1c49" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trafficCoinSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="28%" stopColor="#fde047" />
              <stop offset="55%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient id="trafficCoinTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
            <linearGradient id="visitorsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {
    /* Grid Y Lines */
  }
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = height - paddingY - ratio * (height - paddingY * 2);
    const val = Math.round(ratio * maxVal);
    return <g key={ratio}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={paddingX - 10} y={y + 3} textAnchor="end" className="text-[9px] fill-gray-400 font-mono">
                  {val}
                </text>
                <text x={width - paddingX + 6} y={y + 3} className="text-[8px] fill-yellow-600">
                  {maxRevenue > 1 ? new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(ratio * maxRevenue)) : "0"}
                </text>
              </g>;
  })}

          {
    /* Grid X Labels */
  }
          {activeStats.map((d, i) => {
    if (range === 30 && i % 5 !== 0 && i !== activeStats.length - 1) return null;
    const x = viewsPoints[i].x;
    return <text key={i} x={x} y={height - 10} textAnchor="middle" className="text-[10px] fill-gray-500 font-medium">
                {d.date}
              </text>;
  })}

          {
    /* Area Charts */
  }
          <path d={viewsAreaPath} fill="url(#viewsAreaGrad)" />
          <path d={visitorsAreaPath} fill="url(#visitorsAreaGrad)" />

          {
    /* Revenue has its own scale; zero revenue never renders a coin. */
  }
          {activeStats.map((day, index) => {
    const revenue = day.revenue ?? 0;
    if (revenue <= 0) return null;
    const barHeight = revenue / maxRevenue * (height - paddingY * 2);
    const point = { x: viewsPoints[index].x, y: height - paddingY - barHeight };
    const rim = Math.min(coinWidth * 0.18, Math.min(3.5, barHeight / 4));
    const left = point.x - coinWidth / 2;
    const coinCount = Math.max(0, Math.floor((barHeight - rim * 2) / coinThickness));
    return <g key={day.date} data-revenue={revenue} data-date={day.date} opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.65}>
                <title>{`${day.date} \uC608\uC57D ${revenue.toLocaleString()}`}</title>
                <rect x={left} y={point.y + rim} width={coinWidth} height={Math.max(0, barHeight - rim * 2)} fill="url(#trafficCoinSide)" />
                <ellipse cx={point.x} cy={height - paddingY - rim} rx={coinWidth / 2} ry={rim} fill="url(#trafficCoinSide)" />
                {Array.from({ length: coinCount }, (_, layer) => <path key={layer} d={`M ${left} ${height - paddingY - rim - (layer + 1) * coinThickness} q ${coinWidth / 2} ${rim * 2} ${coinWidth} 0`} stroke="#a16207" strokeOpacity="0.38" strokeWidth="0.8" />)}
                <ellipse cx={point.x} cy={point.y + rim} rx={coinWidth / 2} ry={rim} fill="url(#trafficCoinTop)" stroke="#eab308" strokeWidth="0.7" />
              </g>;
  })}

          {
    /* Line Charts */
  }
          <path d={viewsPath} stroke="#fc1c49" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={visitorsPath} stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {
    /* Interactive Vertical Lines and Hover Dots */
  }
          {activeStats.map((d, i) => {
    const pViews = viewsPoints[i];
    const pVisitors = visitorsPoints[i];
    const isHovered = hoveredIndex === i;
    return <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} onClick={() => setHoveredIndex(i)}>
                <rect
      x={pViews.x - slotWidth / 2}
      y={paddingY}
      width={slotWidth}
      height={height - paddingY * 2}
      fill="transparent"
    />
                
                {isHovered && <>
                    <line x1={pViews.x} y1={paddingY} x2={pViews.x} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx={pViews.x} cy={pViews.y} r="5" fill="#fc1c49" stroke="#ffffff" strokeWidth="2.5" />
                    <circle cx={pVisitors.x} cy={pVisitors.y} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
                  </>}
              </g>;
  })}
        </svg>

        {
    /* Tooltip - Hidden on small screens, show on hover for desktop */
  }
        {hoveredIndex !== null && <div
    className="hidden sm:block absolute bg-slate-900/95 backdrop-blur-sm text-white rounded-xl p-3 shadow-2xl border border-slate-700/60 text-[11px] space-y-2 pointer-events-none transition-all duration-75 z-20 whitespace-nowrap min-w-[136px]"
    style={{
      left: `${viewsPoints[hoveredIndex].x / width * 100}%`,
      top: `${Math.max(5, Math.min(viewsPoints[hoveredIndex].y, visitorsPoints[hoveredIndex].y) / height * 100 - 15)}%`,
      transform: hoveredIndex > activeStats.length / 2 ? "translateX(calc(-100% - 10px))" : "translateX(12px)"
    }}
  >
            <div className="font-bold text-gray-300 border-b border-white/10 pb-1.5 whitespace-nowrap text-[11.5px]">
              {activeStats[hoveredIndex].date}
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 text-yellow-300">
              <span>당일 예약</span>
              <strong className="font-mono">{(activeStats[hoveredIndex].revenue ?? 0).toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#fc1c49] shrink-0" />
                <span className="text-gray-300">PV (조회수)</span>
              </div>
              <strong className="font-mono font-bold text-white text-xs whitespace-nowrap">{activeStats[hoveredIndex].views.toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between gap-3 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-gray-300">UV (방문자)</span>
              </div>
              <strong className="font-mono font-bold text-white text-xs whitespace-nowrap">{activeStats[hoveredIndex].visitors.toLocaleString()}</strong>
            </div>
          </div>}

        {
    /* Mobile: Simple bar below chart showing hovered data */
  }
        {hoveredIndex !== null && <div className="sm:hidden flex flex-wrap items-center justify-center gap-3 py-2 px-3 text-xs bg-gray-50 rounded-md mt-1">
            <span className="text-amber-700 font-bold">당일 예약 {(activeStats[hoveredIndex].revenue ?? 0).toLocaleString()}</span>
            <span className="font-bold text-gray-700">{activeStats[hoveredIndex].date}</span>
            <span className="text-[#fc1c49] font-mono font-bold whitespace-nowrap">PV {activeStats[hoveredIndex].views.toLocaleString()}</span>
            <span className="text-blue-500 font-mono font-bold whitespace-nowrap">UV {activeStats[hoveredIndex].visitors.toLocaleString()}</span>
          </div>}
      </div>

    </div>;
}
export {
  VibiTrafficChart as default
};
