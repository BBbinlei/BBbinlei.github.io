import React from "react";

export interface AirshipProps {
  width: number;
  height: number;
  className?: string;
  id?: string;
}

/**
 * 纯 SVG 飞艇图形组件（朝向左侧：椭圆气囊、蒙皮纵线、金色腰带、吊舱舷窗与尾翼）
 */
export function Airship({ width, height, className = "", id = "airship" }: AirshipProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        filter: "drop-shadow(0 6px 10px rgba(6, 11, 24, 0.45))",
      }}
    >
      <defs>
        {/* 气囊立体银白大理石质感渐变 */}
        <linearGradient id={`${id}-balloon-grad`} x1="50" y1="7" x2="50" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="75%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        {/* 吊舱深海皇家蓝渐变 */}
        <linearGradient id={`${id}-cabin-grad`} x1="50" y1="41" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* 1. 尾翼 (两片对称翼片，描金细边) */}
      <polygon points="86,12 99,6 94,22" fill="#e2e8f0" stroke="#fbbf24" strokeWidth="0.5" />
      <polygon points="86,34 99,40 94,26" fill="#cbd5e1" stroke="#fbbf24" strokeWidth="0.5" />

      {/* 2. 气囊主体 (半轴 a=46, b=17, 中心 (52, 24)) */}
      <ellipse
        cx="52"
        cy="24"
        rx="46"
        ry="17"
        fill={`url(#${id}-balloon-grad)`}
        opacity="0.94"
        stroke="rgba(255, 255, 255, 0.8)"
        strokeWidth="0.6"
      />

      {/* 3. 气囊纵向缝线 (5 条弧线增强三维立体感) */}
      <path d="M 6 24 Q 52 14 98 24" stroke="rgba(100, 116, 139, 0.35)" strokeWidth="0.4" fill="none" />
      <path d="M 6 24 Q 52 19 98 24" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="0.4" fill="none" />
      <path d="M 6 24 Q 52 29 98 24" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="0.4" fill="none" />
      <path d="M 6 24 Q 52 34 98 24" stroke="rgba(100, 116, 139, 0.35)" strokeWidth="0.4" fill="none" />

      {/* 4. 皇家金纹腰带 (位于气囊中下部) */}
      <path
        d="M 12 28.5 Q 52 32.5 92 28.5"
        stroke="#fbbf24"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 14 28.5 Q 52 32.5 90 28.5"
        stroke="#fef08a"
        strokeWidth="0.6"
        fill="none"
      />

      {/* 5. 吊舱悬挂索 (4 条纤细钢索) */}
      <line x1="38" y1="36" x2="39" y2="42" stroke="rgba(251, 191, 36, 0.7)" strokeWidth="0.4" />
      <line x1="45" y1="39" x2="45" y2="42" stroke="rgba(251, 191, 36, 0.7)" strokeWidth="0.4" />
      <line x1="55" y1="39" x2="55" y2="42" stroke="rgba(251, 191, 36, 0.7)" strokeWidth="0.4" />
      <line x1="62" y1="36" x2="61" y2="42" stroke="rgba(251, 191, 36, 0.7)" strokeWidth="0.4" />

      {/* 6. 吊舱主体 (圆角长方形，长 28，高 8，金色描边) */}
      <rect
        x="36"
        y="42"
        width="28"
        height="8"
        rx="3"
        fill={`url(#${id}-cabin-grad)`}
        stroke="#fbbf24"
        strokeWidth="0.6"
      />

      {/* 7. 吊舱舷窗 (3 个泛着暖黄灯火的小圆舷窗) */}
      <circle cx="42" cy="46" r="1.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.3" />
      <circle cx="50" cy="46" r="1.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.3" />
      <circle cx="58" cy="46" r="1.5" fill="#fef08a" stroke="#f59e0b" strokeWidth="0.3" />

      {/* 船头导向探照微光 */}
      <circle cx="6" cy="24" r="1.2" fill="#38bdf8" />
    </svg>
  );
}
