import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls, useMotionValue } from 'framer-motion';
import {
  type LucideIcon,
  Bath,
  Bone,
  Coins,
  Crown,
  Gamepad2,
  Gift,
  Grid3X3,
  Heart,
  Home,
  Leaf,
  Map,
  Moon,
  ShoppingBag,
  Sparkles,
  Sun,
  Trophy,
  Utensils,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

// ==========================================
// 1) 艺术级矢量绘图（更强“3D体积感”与材质）
// ==========================================

const ArtDefs = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      {/* --- 体积软光：外投影 + 高光 + 轻微纹理 --- */}
      <filter id="soft3D" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feOffset in="blur" dx="2" dy="6" result="shadow" />
        <feColorMatrix
          in="shadow"
          type="matrix"
          values="
            0 0 0 0 0
            0 0 0 0 0
            0 0 0 0 0
            0 0 0 .35 0"
          result="shadowTint"
        />

        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" result="noise" />
        <feColorMatrix in="noise" type="matrix"
          values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 .08 0"
          result="noiseAlpha"
        />

        <feSpecularLighting
          in="blur"
          surfaceScale="7"
          specularConstant=".7"
          specularExponent="28"
          lightingColor="#ffffff"
          result="spec"
        >
          <fePointLight x="-4000" y="-6000" z="18000" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="specMasked" />

        <feMerge>
          <feMergeNode in="shadowTint" />
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="specMasked" />
          <feMergeNode in="noiseAlpha" />
        </feMerge>
      </filter>

      {/* --- 内阴影：让形体更“凹” --- */}
      <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feOffset dx="0" dy="2" />
        <feGaussianBlur stdDeviation="3" result="offset-blur" />
        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
        <feFlood floodColor="#000000" floodOpacity=".22" result="color" />
        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
      </filter>

      {/* --- 柔光发光 --- */}
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* --- 龙材质（更立体的渐变 + 边缘轮廓光） --- */}
      <linearGradient id="dragonSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7CFFCB" />
        <stop offset="22%" stopColor="#34D399" />
        <stop offset="55%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>

      <linearGradient id="dragonRim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E8FFF5" stopOpacity=".9" />
        <stop offset="45%" stopColor="#E8FFF5" stopOpacity=".18" />
        <stop offset="100%" stopColor="#E8FFF5" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="dragonBelly" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#E7FFF3" />
        <stop offset="100%" stopColor="#7DE9C5" />
      </linearGradient>

      <radialGradient id="dragonEye" cx="35%" cy="35%" r="85%">
        <stop offset="0%" stopColor="#1f2937" />
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>

      <radialGradient id="fireCore" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity=".95" />
        <stop offset="25%" stopColor="#FDE68A" stopOpacity=".95" />
        <stop offset="55%" stopColor="#FB923C" stopOpacity=".9" />
        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
      </radialGradient>

      {/* --- 狐狸材质 --- */}
      <linearGradient id="foxSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDBA74" />
        <stop offset="50%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#9A3412" />
      </linearGradient>

      {/* --- 猫材质 --- */}
      <linearGradient id="catSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="55%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>

      {/* --- 史莱姆材质 --- */}
      <radialGradient id="slimeBody" cx="30%" cy="25%" r="85%">
        <stop offset="0%" stopColor="#A7F3D0" stopOpacity=".95" />
        <stop offset="40%" stopColor="#34D399" stopOpacity=".9" />
        <stop offset="100%" stopColor="#065F46" stopOpacity=".95" />
      </radialGradient>

      {/* --- 凤凰材质 --- */}
      <linearGradient id="phoenixWing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="45%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>

      {/* --- 狼材质 --- */}
      <linearGradient id="wolfFur" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#CBD5E1" />
        <stop offset="60%" stopColor="#64748B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>

      {/* --- 猫头鹰材质 --- */}
      <linearGradient id="owlFeather" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E9D5FF" />
        <stop offset="60%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>

      {/* --- 机械宠物材质 --- */}
      <linearGradient id="botMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="35%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>

      {/* --- 宝石/能量 --- */}
      <radialGradient id="gemGlow" cx="40%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".95" />
        <stop offset="20%" stopColor="#93C5FD" stopOpacity=".9" />
        <stop offset="65%" stopColor="#3B82F6" stopOpacity=".55" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

// ==========================================
// 2) 宠物图鉴（多宠物、统一口径）
// ==========================================

type PetType = 'dragon' | 'fox' | 'cat' | 'slime' | 'phoenix' | 'wolf' | 'owl' | 'robot';
type PetStage = 'egg' | 'baby' | 'adult';
type TabKey = 'care' | 'collection' | 'shop' | 'upgrades';

const PET_META: Record<
  PetType,
  { name: string; accent: string; eggColor: string; tagline: string; unlockLv: number }
> = {
  dragon: { name: '龙', accent: 'emerald', eggColor: '#34D399', tagline: '火与风的幼王', unlockLv: 1 },
  fox: { name: '狐', accent: 'orange', eggColor: '#FB923C', tagline: '狡黠又黏人', unlockLv: 1 },
  cat: { name: '猫', accent: 'slate', eggColor: '#94A3B8', tagline: '高冷但很治愈', unlockLv: 2 },
  slime: { name: '史莱姆', accent: 'green', eggColor: '#22C55E', tagline: '弹弹软软的能量体', unlockLv: 3 },
  wolf: { name: '狼', accent: 'zinc', eggColor: '#71717A', tagline: '守护与战意', unlockLv: 4 },
  phoenix: { name: '凤凰', accent: 'red', eggColor: '#EF4444', tagline: '浴火重生的光羽', unlockLv: 5 },
  owl: { name: '鸮', accent: 'violet', eggColor: '#A78BFA', tagline: '夜色里的智者', unlockLv: 6 },
  robot: { name: '机灵', accent: 'blue', eggColor: '#3B82F6', tagline: '可升级的机械伙伴', unlockLv: 7 },
};

const PET_ORDER: PetType[] = ['dragon', 'fox', 'cat', 'slime', 'wolf', 'phoenix', 'owl', 'robot'];

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const expNeeded = (level: number) => Math.floor(80 * Math.pow(level, 1.22) + 20);

// ==========================================
// 3) 画法（更“3D”）
// ==========================================

type FaceMood = 'happy' | 'neutral' | 'grumpy' | 'sleep';

const faceMoodFromStats = (mood: number, hunger: number, energy: number): FaceMood => {
  if (energy < 18) return 'sleep';
  if (hunger > 75 || mood < 30) return 'grumpy';
  if (mood > 70 && hunger < 55) return 'happy';
  return 'neutral';
};

const SoftSparkles = ({ intensity = 1 }: { intensity?: number }) => {
  const dots = useMemo(() => {
    const count = Math.round(12 * intensity);
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      s: 0.6 + Math.random() * 1.1,
      d: 2.5 + Math.random() * 2.5,
      delay: Math.random() * 1.5,
    }));
  }, [intensity]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {dots.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/60"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s * 6}px`, height: `${p.s * 6}px` }}
          animate={{ opacity: [0.15, 0.9, 0.15], transform: ['translateY(0px)', 'translateY(-10px)', 'translateY(0px)'] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

// --- 3D感·龙 ---
const MasterpieceDragon3D = ({
  face,
  stage = 'adult',
  power = 0.6,
}: {
  face: FaceMood;
  stage?: PetStage;
  power?: number;
}) => {
  const isSleeping = face === 'sleep';
  const isGrumpy = face === 'grumpy';
  const isHappy = face === 'happy';
  const isBaby = stage === 'baby';
  const isAdult = stage === 'adult';

  return (
    <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl">
      <motion.g
        transform={isBaby ? 'translate(14 24) scale(0.88)' : 'translate(-4 -6) scale(1.02)'}
        animate={isSleeping ? { y: [0, 2, 0] } : { y: [0, isBaby ? -5 : -9, 0] }}
        transition={{ duration: isBaby ? 3.6 : 3.0, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 阶段特效：幼体/成体差异化 */}
        {isAdult && !isSleeping && (
          <motion.g
            animate={{ opacity: [0.15, 0.38, 0.15], rotate: [-2, 2, -2] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            opacity={0.18 + power * 0.28}
          >
            <path
              d="M70 182 C92 118 152 76 220 70 C278 64 330 92 352 142 C374 192 352 254 308 282 C264 310 194 316 136 296 C88 278 58 236 70 182 Z"
              fill="none"
              stroke="url(#fireCore)"
              strokeWidth={3.2}
              filter="url(#glow)"
              opacity={0.45}
            />
          </motion.g>
        )}
        {isBaby && !isSleeping && (
          <motion.g
            animate={{ opacity: [0.25, 0.7, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <circle cx="86" cy="102" r="3" fill="url(#fireCore)" opacity={0.6} />
            <circle cx="102" cy="92" r="2" fill="url(#fireCore)" opacity={0.5} />
            <circle cx="118" cy="104" r="2.5" fill="url(#fireCore)" opacity={0.55} />
          </motion.g>
        )}

        {/* 尾巴（前后层次） */}
        <motion.path
          d="M120 238 C80 255 55 230 50 200 C45 170 72 160 92 172"
          stroke="url(#dragonSkin)"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
          filter="url(#soft3D)"
          opacity="0.95"
          animate={{
            d: [
              'M120 238 C80 255 55 230 50 200 C45 170 72 160 92 172',
              'M120 238 C76 270 48 240 48 205 C48 175 80 160 98 176',
              'M120 238 C80 255 55 230 50 200 C45 170 72 160 92 172',
            ],
          }}
          transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* 尾鳍光 */}
        <path
          d="M82 176 C62 170 52 150 60 134 C70 114 92 118 102 130"
          stroke="url(#dragonRim)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* 后翅膀 */}
        <motion.path
          d="M140 145 C118 110 84 98 60 110 C88 128 92 176 118 192 C132 200 150 186 150 170 Z"
          fill="#34D399"
          opacity="0.45"
          stroke="#064E3B"
          strokeWidth="2"
          filter="url(#soft3D)"
          animate={{ rotate: [0, 9, 0] }}
          style={{ transformOrigin: '150px 170px' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* 身体体积（阴影层） */}
        <path
          d="M130 150 C105 162 96 196 118 224 C148 262 218 252 238 206 C254 170 232 138 194 138 C168 138 150 142 130 150 Z"
          fill="#064E3B"
          opacity="0.18"
          filter="url(#innerShadow)"
        />
        {/* 身体（主层） */}
        <path
          d="M128 148 C98 156 86 198 114 228 C146 264 220 252 244 206 C260 174 242 140 206 134 C172 130 150 138 128 148 Z"
          fill="url(#dragonSkin)"
          filter="url(#soft3D)"
        />
        {/* 肚皮（亮层） */}
        <path
          d="M146 168 C128 176 122 202 138 220 C160 244 208 236 224 210 C236 190 224 170 204 166 C184 162 162 162 146 168 Z"
          fill="url(#dragonBelly)"
          opacity="0.92"
          filter="url(#innerShadow)"
        />
        {/* 轮廓光（让更3D） */}
        <path
          d="M150 144 C120 152 106 190 124 218 C148 254 220 244 240 206"
          fill="none"
          stroke="url(#dragonRim)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* 前翅膀 */}
        <motion.path
          d="M202 150 C234 114 268 104 290 124 C258 142 248 184 220 202 C204 212 188 196 188 178 Z"
          fill="#A7F3D0"
          opacity="0.9"
          stroke="#064E3B"
          strokeWidth="2"
          filter="url(#soft3D)"
          animate={{ rotate: [0, -8, 0] }}
          style={{ transformOrigin: '188px 178px' }}
          transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* 小爪子（前后层次） */}
        <g filter="url(#soft3D)">
          <path d="M155 230 C150 244 160 252 170 246" stroke="#064E3B" strokeWidth="10" strokeLinecap="round" />
          <path d="M205 228 C204 246 214 252 222 242" stroke="#064E3B" strokeWidth="10" strokeLinecap="round" />
        </g>

        {/* 头部 */}
        <g transform="translate(150, 95)">
          {/* 头型：底层阴影 */}
          <path
            d="M10 6 C-18 -28 24 -58 64 -44 C94 -32 92 10 68 30 C44 50 18 38 10 6 Z"
            fill="#064E3B"
            opacity="0.22"
            filter="url(#innerShadow)"
          />
          {/* 头型：主层 */}
          <path
            d="M8 2 C-24 -34 24 -66 70 -50 C104 -38 100 10 74 34 C50 58 20 44 8 2 Z"
            fill="url(#dragonSkin)"
            filter="url(#soft3D)"
          />
          {/* 角 */}
          <path d="M25 -40 L18 -68 L0 -46 Z" fill="#FBBF24" filter="url(#soft3D)" />
          <path d="M62 -44 L76 -70 L88 -44 Z" fill="#F59E0B" filter="url(#soft3D)" />

          {/* 眼睛/表情 */}
          {isSleeping ? (
            <g fill="none" stroke="#064E3B" strokeWidth="4" strokeLinecap="round" opacity="0.95">
              <path d="M18 -6 Q30 2 42 -6" />
              <path d="M52 -8 Q64 0 76 -8" />
            </g>
          ) : (
            <g>
              <circle cx="30" cy="-8" r="10" fill="url(#dragonEye)" />
              <circle cx="33" cy="-12" r="4" fill="#ffffff" filter="url(#glow)" />
              <circle cx="28" cy="-6" r="2" fill="#ffffff" opacity="0.65" />

              <circle cx="66" cy="-10" r="10" fill="url(#dragonEye)" />
              <circle cx="69" cy="-14" r="4" fill="#ffffff" filter="url(#glow)" />
              <circle cx="64" cy="-8" r="2" fill="#ffffff" opacity="0.65" />

              {/* 眉毛 */}
              <path
                d={isGrumpy ? 'M18 -22 Q30 -30 44 -22' : isHappy ? 'M18 -24 Q30 -18 44 -24' : 'M18 -24 Q30 -26 44 -24'}
                stroke="#064E3B"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d={isGrumpy ? 'M54 -24 Q66 -32 80 -24' : isHappy ? 'M54 -26 Q66 -20 80 -26' : 'M54 -26 Q66 -28 80 -26'}
                stroke="#064E3B"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* 腮红 */}
              <ellipse cx="18" cy="14" rx="8" ry="4" fill="#FDA4AF" opacity="0.45" />
              <ellipse cx="84" cy="10" rx="8" ry="4" fill="#FDA4AF" opacity="0.4" />
            </g>
          )}

          {/* 嘴巴 */}
          {!isSleeping && (
            <path
              d={
                isGrumpy
                  ? 'M44 22 Q46 16 52 22'
                  : isHappy
                    ? 'M40 20 Q50 34 60 18'
                    : 'M42 20 Q50 26 58 20'
              }
              stroke="#064E3B"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
          )}

          {/* 胸口能量宝石 */}
          <g transform="translate(40, 44)">
            <circle cx="15" cy="10" r="9" fill="#1D4ED8" opacity="0.25" />
            <circle cx="15" cy="10" r="14" fill="url(#gemGlow)" filter="url(#glow)" opacity={0.7 + power * 0.3} />
            <path d="M15 0 L26 10 L15 20 L4 10 Z" fill="#60A5FA" filter="url(#soft3D)" opacity="0.9" />
          </g>
        </g>

        {/* 火焰：幼体=火花，成体=喷火流（随心情/能量变化） */}
        {!isSleeping && (
          <>
            {/* core flame */}
            <motion.g
              animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.85, isAdult ? 1.22 : 1.08, 0.85] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              opacity={0.3 + power * 0.7}
            >
              <path
                d="M254 132 C274 132 286 152 276 168 C266 184 244 184 236 166 C228 148 236 132 254 132 Z"
                fill="url(#fireCore)"
                filter="url(#glow)"
                opacity={isHappy ? 0.95 : isGrumpy ? 0.65 : 0.85}
              />
            </motion.g>

            {/* adult breath */}
            {isAdult && (
              <motion.g
                animate={{ opacity: [0.18, 0.55, 0.18], x: [0, 3, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                opacity={0.2 + power * 0.6}
              >
                <path
                  d="M274 156 C320 144 354 154 392 166 C426 176 458 176 504 168 C468 196 438 214 396 224 C352 236 312 230 278 214 C300 194 306 176 274 156 Z"
                  fill="url(#fireCore)"
                  filter="url(#glow)"
                  opacity={isHappy ? 0.85 : isGrumpy ? 0.6 : 0.75}
                />
                <path
                  d="M288 162 C334 156 360 164 394 174 C420 182 448 182 482 176 C452 198 426 212 394 218 C360 226 326 220 292 206 C310 192 314 178 288 162 Z"
                  fill="white"
                  opacity={0.12}
                />
              </motion.g>
            )}

            {/* baby sparks */}
            {isBaby && (
              <motion.g
                animate={{ opacity: [0.2, 0.65, 0.2], y: [0, -2, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                opacity={0.25 + power * 0.45}
              >
                <circle cx="288" cy="156" r="2.2" fill="url(#fireCore)" opacity={0.7} />
                <circle cx="304" cy="150" r="1.6" fill="url(#fireCore)" opacity={0.55} />
                <circle cx="316" cy="160" r="1.8" fill="url(#fireCore)" opacity={0.6} />
              </motion.g>
            )}
          </>
        )}
</motion.g>
    </svg>
  );
};

// --- 狐狸 ---
const MasterpieceFox = ({ face }: { face: FaceMood }) => {
  const isSleeping = face === 'sleep';
  const isGrumpy = face === 'grumpy';
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
        {/* 蓬松尾巴 */}
        <motion.path
          d="M205 210 Q284 162 260 86 Q236 20 160 64"
          stroke="url(#foxSkin)"
          strokeWidth="42"
          fill="none"
          strokeLinecap="round"
          filter="url(#soft3D)"
          animate={{ rotate: [0, 5, 0] }}
          style={{ transformOrigin: '205px 210px' }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <path d="M230 90 Q242 66 218 54" stroke="#fff" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.82" />

        {/* 身体 */}
        <path d="M96 154 C74 156 64 210 108 232 L184 232 C214 212 206 154 172 142" fill="url(#foxSkin)" filter="url(#soft3D)" />
        <path d="M114 232 L150 232 L130 180 Z" fill="#fff" opacity="0.92" />

        {/* 头 */}
        <g transform="translate(132, 112)">
          <path d="M0 0 C-20 -32 22 -56 50 -36 C76 -18 56 20 0 0" fill="url(#foxSkin)" filter="url(#soft3D)" />
          <path d="M-10 -18 L-24 -50 L10 -30 Z" fill="#9A3412" />
          <path d="M34 -22 L52 -50 L14 -32 Z" fill="#9A3412" />
          <path d="M-2 0 Q24 24 54 0" fill="#fff" opacity="0.92" />

          {isSleeping ? (
            <g fill="none" stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round">
              <path d="M10 -4 Q20 2 30 -4" />
              <path d="M30 -4 Q40 2 50 -4" />
            </g>
          ) : (
            <g>
              <circle cx="14" cy="-6" r="3.2" fill="#0F172A" />
              <circle cx="40" cy="-6" r="3.2" fill="#0F172A" />
              <path
                d={isGrumpy ? 'M26 10 Q28 6 30 10' : 'M24 10 Q28 14 32 10'}
                stroke="#0F172A"
                strokeWidth="2.6"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="18" cy="10" r="3" fill="#FDA4AF" opacity="0.4" />
              <circle cx="44" cy="10" r="3" fill="#FDA4AF" opacity="0.4" />
            </g>
          )}
        </g>
      </motion.g>
    </svg>
  );
};

// --- 猫 ---
const MasterpieceCat = ({ face }: { face: FaceMood }) => {
  const isSleeping = face === 'sleep';
  const isHappy = face === 'happy';
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 3.3, repeat: Infinity, ease: 'easeInOut' }}>
        {/* 尾巴 */}
        <motion.path
          d="M214 210 C250 212 260 190 254 170 C248 150 226 150 214 162"
          stroke="url(#catSkin)"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
          filter="url(#soft3D)"
          animate={{ rotate: [0, 10, 0] }}
          style={{ transformOrigin: '214px 210px' }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* 身体 */}
        <path
          d="M96 160 C80 164 74 204 104 232 L174 232 C202 212 194 160 168 148 C140 136 116 146 96 160 Z"
          fill="url(#catSkin)"
          filter="url(#soft3D)"
        />
        {/* 肚皮 */}
        <path
          d="M120 176 C110 182 110 208 126 220 C146 236 172 226 178 208 C184 190 166 176 144 172 C134 170 126 172 120 176 Z"
          fill="#F8FAFC"
          opacity="0.9"
          filter="url(#innerShadow)"
        />

        {/* 头 */}
        <g transform="translate(120, 98)">
          <path d="M22 8 C0 -28 28 -62 70 -46 C92 -38 96 -8 78 18 C58 46 30 36 22 8 Z" fill="url(#catSkin)" filter="url(#soft3D)" />
          {/* 耳朵 */}
          <path d="M20 0 L10 -30 L34 -10 Z" fill="#1F2937" opacity="0.9" />
          <path d="M76 -2 L92 -30 L64 -14 Z" fill="#1F2937" opacity="0.9" />
          {/* 耳内 */}
          <path d="M20 -2 L16 -22 L30 -10 Z" fill="#FCA5A5" opacity="0.5" />
          <path d="M74 -4 L84 -22 L66 -12 Z" fill="#FCA5A5" opacity="0.5" />

          {/* 脸 */}
          {isSleeping ? (
            <g fill="none" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round">
              <path d="M34 0 Q44 6 54 0" />
              <path d="M58 0 Q68 6 78 0" />
            </g>
          ) : (
            <g>
              <circle cx="44" cy="0" r="4" fill="#0F172A" />
              <circle cx="70" cy="0" r="4" fill="#0F172A" />
              <path
                d={isHappy ? 'M56 18 Q58 22 60 18' : 'M54 18 Q58 20 62 18'}
                stroke="#0F172A"
                strokeWidth="2.6"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="34" cy="14" r="3.5" fill="#FDA4AF" opacity="0.35" />
              <circle cx="84" cy="14" r="3.5" fill="#FDA4AF" opacity="0.35" />
            </g>
          )}

          {/* 胡须 */}
          <g stroke="#0F172A" strokeWidth="2" opacity="0.7" strokeLinecap="round">
            <path d="M22 12 L0 6" />
            <path d="M22 18 L0 18" />
            <path d="M86 12 L108 6" />
            <path d="M86 18 L108 18" />
          </g>
        </g>
      </motion.g>
    </svg>
  );
};

// --- 史莱姆 ---
const MasterpieceSlime = ({ face }: { face: FaceMood }) => {
  const isSleeping = face === 'sleep';
  const isGrumpy = face === 'grumpy';
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
        <path
          d="M70 220 C70 150 110 90 150 90 C190 90 230 150 230 220 C230 250 206 270 150 270 C94 270 70 250 70 220 Z"
          fill="url(#slimeBody)"
          filter="url(#soft3D)"
        />
        <path
          d="M96 202 C102 166 124 132 150 132 C176 132 198 166 204 202 C190 232 172 244 150 244 C128 244 110 232 96 202 Z"
          fill="#FFFFFF"
          opacity="0.08"
        />
        {/* 眼睛 */}
        {isSleeping ? (
          <g fill="none" stroke="#064E3B" strokeWidth="4" strokeLinecap="round" opacity="0.9">
            <path d="M112 178 Q130 188 148 178" />
            <path d="M152 178 Q170 188 188 178" />
          </g>
        ) : (
          <g>
            <circle cx="130" cy="178" r="8" fill="#064E3B" opacity="0.95" />
            <circle cx="170" cy="178" r="8" fill="#064E3B" opacity="0.95" />
            <path
              d={isGrumpy ? 'M140 206 Q150 198 160 206' : 'M138 206 Q150 216 162 206'}
              stroke="#064E3B"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>
        )}
        {/* 高光 */}
        <ellipse cx="104" cy="156" rx="20" ry="32" fill="#fff" opacity="0.15" transform="rotate(-20 104 156)" />
      </motion.g>
    </svg>
  );
};

// --- 凤凰 ---
const MasterpiecePhoenix = ({ face, power = 0.8 }: { face: FaceMood; power?: number }) => {
  const isSleeping = face === 'sleep';
  return (
    <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl">
      <motion.g animate={{ y: [0, -7, 0] }} transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}>
        {/* 光翼 */}
        <motion.path
          d="M76 170 C36 130 54 92 98 88 C120 86 132 108 136 124 C114 126 100 140 98 160 C96 178 108 200 132 214 C108 212 90 198 76 170 Z"
          fill="url(#phoenixWing)"
          opacity="0.85"
          filter="url(#soft3D)"
          animate={{ rotate: [0, 6, 0] }}
          style={{ transformOrigin: '140px 160px' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M244 172 C284 132 266 92 222 88 C200 86 188 108 184 124 C206 126 220 140 222 160 C224 178 212 200 188 214 C212 212 230 198 244 172 Z"
          fill="url(#phoenixWing)"
          opacity="0.92"
          filter="url(#soft3D)"
          animate={{ rotate: [0, -6, 0] }}
          style={{ transformOrigin: '180px 160px' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* 身体 */}
        <path
          d="M120 150 C120 120 142 96 160 96 C178 96 200 120 200 150 C200 190 188 226 160 240 C132 226 120 190 120 150 Z"
          fill="url(#phoenixWing)"
          filter="url(#soft3D)"
        />
        <path d="M152 120 C148 144 148 176 156 206 C160 218 168 218 172 206 C180 176 180 144 176 120 Z" fill="#FFF7ED" opacity="0.25" />

        {/* 头 */}
        <g transform="translate(140, 86)">
          <path d="M18 10 C6 -10 24 -28 44 -18 C62 -8 58 14 44 26 C32 38 22 28 18 10 Z" fill="url(#phoenixWing)" filter="url(#soft3D)" />
          <path d="M48 -6 L62 -18 L56 2 Z" fill="#FDE68A" filter="url(#soft3D)" />
          {/* 眼 */}
          {isSleeping ? (
            <path d="M26 8 Q34 12 42 8" stroke="#7C2D12" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <g>
              <circle cx="32" cy="8" r="4" fill="#0F172A" />
              <circle cx="44" cy="8" r="4" fill="#0F172A" />
              <path d="M36 22 Q38 26 40 22" stroke="#7C2D12" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
          )}
        </g>

        {/* 火羽尾流 */}
        {!isSleeping && (
          <motion.g
            opacity={0.35 + power * 0.65}
            animate={{ opacity: [0.35, 0.8, 0.35], y: [0, 2, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M160 238 C152 252 142 270 120 276 C152 270 160 258 160 248 C160 258 168 270 200 276 C178 270 168 252 160 238 Z" fill="url(#fireCore)" filter="url(#glow)" />
          </motion.g>
        )}
      </motion.g>
    </svg>
  );
};

// --- 狼 ---
const MasterpieceWolf = ({ face }: { face: FaceMood }) => {
  const isSleeping = face === 'sleep';
  const isGrumpy = face === 'grumpy';
  return (
    <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl">
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut' }}>
        {/* 身体 */}
        <path d="M106 170 C92 176 86 206 106 232 L198 232 C226 216 220 170 190 154 C166 142 132 150 106 170 Z" fill="url(#wolfFur)" filter="url(#soft3D)" />
        <path d="M124 192 C124 170 142 154 160 154 C178 154 196 170 196 192 C196 214 184 232 160 242 C136 232 124 214 124 192 Z" fill="#F8FAFC" opacity="0.1" />

        {/* 头 */}
        <g transform="translate(118, 110)">
          <path d="M30 20 C8 -6 34 -44 76 -30 C104 -20 104 20 84 42 C64 64 42 52 30 20 Z" fill="url(#wolfFur)" filter="url(#soft3D)" />
          <path d="M26 10 L14 -20 L38 -6 Z" fill="#0F172A" opacity="0.9" />
          <path d="M86 6 L102 -22 L70 -8 Z" fill="#0F172A" opacity="0.9" />

          {isSleeping ? (
            <g fill="none" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round">
              <path d="M46 16 Q56 22 66 16" />
              <path d="M68 16 Q78 22 88 16" />
            </g>
          ) : (
            <g>
              <circle cx="56" cy="16" r="4.2" fill="#0F172A" />
              <circle cx="82" cy="16" r="4.2" fill="#0F172A" />
              <path
                d={isGrumpy ? 'M66 34 Q70 26 74 34' : 'M64 34 Q70 38 76 34'}
                stroke="#0F172A"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>

        {/* 月牙点缀 */}
        <path d="M248 112 C236 118 232 132 238 146 C224 140 218 126 224 112 C230 98 242 92 258 96 C254 102 252 108 248 112 Z" fill="#E2E8F0" opacity="0.5" />
      </motion.g>
    </svg>
  );
};

// --- 鸮（猫头鹰） ---
const MasterpieceOwl = ({ face }: { face: FaceMood }) => {
  const isSleeping = face === 'sleep';
  const isHappy = face === 'happy';
  return (
    <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl">
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}>
        <path
          d="M120 112 C104 132 96 162 96 192 C96 248 126 276 160 276 C194 276 224 248 224 192 C224 162 216 132 200 112 C188 96 172 90 160 90 C148 90 132 96 120 112 Z"
          fill="url(#owlFeather)"
          filter="url(#soft3D)"
        />
        <path
          d="M122 150 C134 138 148 132 160 132 C172 132 186 138 198 150 C184 160 172 166 160 166 C148 166 136 160 122 150 Z"
          fill="#F8FAFC"
          opacity="0.16"
        />

        {/* 眼圈 */}
        <g>
          <circle cx="138" cy="172" r="22" fill="#F8FAFC" opacity="0.65" />
          <circle cx="182" cy="172" r="22" fill="#F8FAFC" opacity="0.65" />
          {isSleeping ? (
            <g fill="none" stroke="#0F172A" strokeWidth="4" strokeLinecap="round">
              <path d="M124 172 Q138 180 152 172" />
              <path d="M168 172 Q182 180 196 172" />
            </g>
          ) : (
            <g>
              <circle cx="138" cy="172" r="9" fill="#0F172A" />
              <circle cx="182" cy="172" r="9" fill="#0F172A" />
              <circle cx="141" cy="168" r="3.5" fill="#ffffff" opacity="0.85" />
              <circle cx="185" cy="168" r="3.5" fill="#ffffff" opacity="0.85" />
            </g>
          )}

          {/* 喙 */}
          <path d="M160 182 L172 198 L160 212 L148 198 Z" fill={isHappy ? '#FDE68A' : '#EAB308'} filter="url(#soft3D)" />
        </g>

        {/* 小翅 */}
        <path d="M96 198 C80 198 72 212 80 226 C90 242 112 244 122 236 C110 230 104 214 104 204 C104 202 104 200 104 198 Z" fill="#C4B5FD" opacity="0.65" />
        <path d="M224 198 C240 198 248 212 240 226 C230 242 208 244 198 236 C210 230 216 214 216 204 C216 202 216 200 216 198 Z" fill="#C4B5FD" opacity="0.65" />
      </motion.g>
    </svg>
  );
};

// --- 机械宠物 ---
const MasterpieceRobot = ({ face, power = 0.7 }: { face: FaceMood; power?: number }) => {
  const isSleeping = face === 'sleep';
  const isGrumpy = face === 'grumpy';
  return (
    <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-2xl">
      <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 2.9, repeat: Infinity, ease: 'easeInOut' }}>
        {/* 身体 */}
        <path d="M120 120 Q160 86 200 120 V220 Q160 260 120 220 Z" fill="url(#botMetal)" filter="url(#soft3D)" />
        <path d="M132 132 Q160 110 188 132 V206 Q160 234 132 206 Z" fill="#0F172A" opacity="0.12" />
        {/* 屏幕 */}
        <path d="M136 144 Q160 128 184 144 V188 Q160 206 136 188 Z" fill="#0B1220" />
        <path d="M140 148 Q160 136 180 148 V184 Q160 198 140 184 Z" fill="#0EA5E9" opacity={0.25 + power * 0.35} />

        {/* 眼睛 */}
        {isSleeping ? (
          <g fill="none" stroke="#93C5FD" strokeWidth="4" strokeLinecap="round" opacity="0.9">
            <path d="M150 164 Q156 168 162 164" />
            <path d="M164 164 Q170 168 176 164" />
          </g>
        ) : (
          <g>
            <circle cx="154" cy="164" r="5" fill="#93C5FD" filter="url(#glow)" opacity={0.75 + power * 0.25} />
            <circle cx="172" cy="164" r="5" fill="#93C5FD" filter="url(#glow)" opacity={0.75 + power * 0.25} />
            <path
              d={isGrumpy ? 'M158 182 Q164 176 170 182' : 'M156 182 Q164 188 172 182'}
              stroke="#93C5FD"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>
        )}

        {/* 天线 */}
        <path d="M160 96 V76" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
        <motion.circle
          cx="160"
          cy="68"
          r="8"
          fill="#93C5FD"
          filter="url(#glow)"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          opacity={0.4 + power * 0.6}
        />

        {/* 底座小喷气 */}
        {!isSleeping && (
          <motion.g animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 1.2, repeat: Infinity }}>
            <path d="M150 226 C146 240 144 250 132 256 C148 252 154 244 156 236 C158 244 164 252 180 256 C168 250 166 240 162 226 Z" fill="url(#gemGlow)" filter="url(#glow)" />
          </motion.g>
        )}
      </motion.g>
    </svg>
  );
};

// --- 蛋（通用） ---
const MasterpieceEgg = ({ type }: { type: PetType }) => {
  const base = PET_META[type]?.eggColor ?? '#A78BFA';
  const id = `eggGrad-${type}`;
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
      <defs>
        <radialGradient id={id} cx="30%" cy="25%" r="85%">
          <stop offset="0%" stopColor={base} stopOpacity=".95" />
          <stop offset="55%" stopColor={base} stopOpacity=".55" />
          <stop offset="100%" stopColor="#000" stopOpacity=".55" />
        </radialGradient>
      </defs>
      <motion.g animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}>
        <path
          d="M100 18 Q182 18 182 100 Q182 190 100 190 Q18 190 18 100 Q18 18 100 18"
          fill={`url(#${id})`}
          filter="url(#soft3D)"
        />
        {/* 裂纹与光 */}
        <path d="M74 66 L98 98 L120 70 L132 98" stroke="rgba(255,255,255,0.45)" strokeWidth="3.2" fill="none" />
        <ellipse cx="70" cy="72" rx="20" ry="30" fill="white" opacity="0.18" transform="rotate(-28 70 72)" />
        <motion.path
          d="M98 110 C110 94 126 92 136 104 C126 118 112 126 98 110 Z"
          fill="url(#gemGlow)"
          filter="url(#glow)"
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          opacity="0.6"
        />
      </motion.g>
    </svg>
  );
};

const PetSprite: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => (
  <div className="w-full h-full">
    <img
      src={src}
      alt={alt ?? ''}
      draggable={false}
      className="w-full h-full object-contain select-none pointer-events-none drop-shadow-2xl"
    />
  </div>
);

const renderPetArt = (
  type: PetType,
  stage: PetStage,
  face: FaceMood,
  power: number,
  skinUrl?: string | null,
) => {
  if (skinUrl) return <PetSprite src={skinUrl} alt={PET_META[type]?.name ?? type} />;
  if (stage === 'egg') return <MasterpieceEgg type={type} />;
  switch (type) {
    case 'dragon':
      return <MasterpieceDragon3D face={face} stage={stage} power={power} />;
    case 'fox':
      return <MasterpieceFox face={face} />;
    case 'cat':
      return <MasterpieceCat face={face} />;
    case 'slime':
      return <MasterpieceSlime face={face} />;
    case 'phoenix':
      return <MasterpiecePhoenix face={face} power={power} />;
    case 'wolf':
      return <MasterpieceWolf face={face} />;
    case 'owl':
      return <MasterpieceOwl face={face} />;
    case 'robot':
      return <MasterpieceRobot face={face} power={power} />;
    default:
      return <MasterpieceDragon3D face={face} stage={stage} power={power} />;
  }
};


// ==========================================
// 4) 游戏引擎（玩法可升级：商店、升级、图鉴解锁）
// ==========================================

interface Upgrades {
  xpBoost: number; // +% XP
  slowHunger: number; // -% hunger tick
  regenEnergy: number; // +% energy regen from rest/clean
  autoCare: number; // 自动护理概率
}

interface Inventory {
  food: number;
  toy: number;
  bath: number;
  giftBox: number;
}

interface PetState {
  type: PetType;
  stage: PetStage;
  /** 破壳时间戳（用于「七日进化」：幼体→成体） */
  hatchedAt?: number;
  level: number;
  exp: number;
  coins: number;

  health: number;
  mood: number;
  hunger: number;
  energy: number;
  cleanliness: number;

  isOutside: boolean;

  unlocked: Record<PetType, boolean>;
  upgrades: Upgrades;
  inv: Inventory;
}

const INITIAL_STATE: PetState = {
  type: 'dragon',
  stage: 'egg',
  hatchedAt: undefined,
  level: 1,
  exp: 0,
  coins: 120,

  health: 100,
  mood: 100,
  hunger: 0,
  energy: 100,
  cleanliness: 100,

  isOutside: false,

  unlocked: {
    dragon: true,
    fox: true,
    cat: false,
    slime: false,
    phoenix: false,
    wolf: false,
    owl: false,
    robot: false,
  },

  upgrades: {
    xpBoost: 0,
    slowHunger: 0,
    regenEnergy: 0,
    autoCare: 0,
  },

  inv: {
    food: 3,
    toy: 2,
    bath: 1,
    giftBox: 0,
  },
};

const LS_DATA = 'UP_DATA_ULTRA';
const LS_POS = 'UP_POS_ULTRA';

const LS_SKINS = 'UP_SKINS_ULTRA';

type SkinPack = Partial<Record<PetType, Partial<Record<PetStage, string>>>>;

// 默认皮肤：留空，默认使用内置的矢量 3D 动画外观（更“会动”）。
// 你可以在「图鉴 → 外观皮肤」里，为每个阶段（蛋/幼体/成体）分别上传 PNG/JPG/WebP/GIF 来覆盖。
const DEFAULT_SKINS: SkinPack = {};




const tryParse = <T,>(s: string | null): T | null => {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
};

const unlockByLevel = (level: number, unlocked: Record<PetType, boolean>) => {
  const next = { ...unlocked };
  PET_ORDER.forEach((t) => {
    if (level >= PET_META[t].unlockLv) next[t] = true;
  });
  return next;
};

// ==========================================
// 5) 主组件（UltimatePet Ultra）
// ==========================================

export const UltimatePet: React.FC = () => {
  const [pet, setPet] = useState<PetState>(() => {
    const saved = tryParse<PetState>(typeof window !== 'undefined' ? localStorage.getItem(LS_DATA) : null);
    const base = (saved ?? INITIAL_STATE) as PetState;
    // 数据兼容：旧存档可能没有 hatchedAt
    if (base.stage !== 'egg' && !base.hatchedAt) return { ...base, hatchedAt: Date.now() };
    return base;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('care');
  const [notification, setNotification] = useState<string | null>(null);

  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 24, y: 24 };
    const fallback = { x: window.innerWidth - 220, y: window.innerHeight - 260 };
    const saved = tryParse<{ x: number; y: number }>(localStorage.getItem(LS_POS));
    return saved ?? fallback;
  });
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });
  const fullSize = useMemo(() => ({
    w: clamp(viewport.w * 0.88, 320, 420),
    h: clamp(viewport.h * 0.82, 520, 760),
  }), [viewport.h, viewport.w]);

  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);

  const commitPosition = useCallback((px: number, py: number) => {
    const maxW = typeof window !== 'undefined' ? Math.max(8, window.innerWidth - fullSize.w - 16) : px;
    const maxH = typeof window !== 'undefined' ? Math.max(8, window.innerHeight - fullSize.h - 16) : py;
    const clamped = { x: clamp(px, 8, maxW), y: clamp(py, 8, maxH) };
    setPosition(clamped);
    x.set(clamped.x);
    y.set(clamped.y);
    if (typeof window !== 'undefined') localStorage.setItem(LS_POS, JSON.stringify(clamped));
  }, [fullSize.h, fullSize.w, x, y]);

  useEffect(() => {
    x.set(position.x);
    y.set(position.y);
  }, [position.x, position.y, x, y]);

  // 持久化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_DATA, JSON.stringify(pet));
  }, [pet]);

  // 窗口尺寸变化：更新视口并确保面板不会漂出屏幕
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      requestAnimationFrame(() => commitPosition(x.get(), y.get()));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [commitPosition, x, y]);

  // 展开/收起或尺寸变化时：自动把面板“吸附”回可视区域内，避免弹出屏幕
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => commitPosition(x.get(), y.get()));
  }, [commitPosition, fullSize.h, fullSize.w, isOpen, x, y]);

  // 核心循环（数值变动）
  useEffect(() => {
    const timer = setInterval(() => {
      setPet((prev) => {
        if (prev.stage === 'egg') return prev;

        // 七日进化：幼体 -> 成体（从破壳算起，满 7 天自动解锁成体形态）
        if (prev.stage === 'baby' && prev.hatchedAt && Date.now() - prev.hatchedAt >= 7 * 24 * 60 * 60 * 1000) {
          toast('七日进化：成体形态解锁！');
          return { ...prev, stage: 'adult' };
        }

        const slow = 1 - clamp(prev.upgrades.slowHunger * 0.06, 0, 0.42);
        const hungerUp = 0.55 * slow;
        const moodDown = prev.isOutside ? 0.12 : 0.18;
        const energyDown = prev.isOutside ? 0.24 : 0.18;
        const cleanDown = prev.isOutside ? 0.25 : 0.16;

        let hunger = clamp(prev.hunger + hungerUp, 0, 100);
        let energy = clamp(prev.energy - energyDown, 0, 100);
        let mood = clamp(prev.mood - moodDown, 0, 100);
        let cleanliness = clamp(prev.cleanliness - cleanDown, 0, 100);

        // 状态联动（脏/饿会影响心情与健康）
        let health = prev.health;
        if (hunger > 85) health = clamp(health - 0.35, 0, 100);
        if (cleanliness < 25) health = clamp(health - 0.25, 0, 100);
        if (energy < 10) mood = clamp(mood - 0.35, 0, 100);

        // 轻度自动护理（升级后概率触发）
        const autoChance = clamp(prev.upgrades.autoCare * 0.02, 0, 0.12);
        if (Math.random() < autoChance) {
          if (prev.inv.food > 0 && hunger > 70) {
            hunger = clamp(hunger - 22, 0, 100);
            mood = clamp(mood + 6, 0, 100);
          } else if (prev.inv.bath > 0 && cleanliness < 40) {
            cleanliness = clamp(cleanliness + 20, 0, 100);
            mood = clamp(mood + 5, 0, 100);
          }
        }

        return { ...prev, hunger, energy, mood, cleanliness, health };
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const face = faceMoodFromStats(pet.mood, pet.hunger, pet.energy);
  const power = clamp((pet.level / 10) + (pet.mood / 160) - (pet.hunger / 250), 0.25, 1);

  // 拖动结束：持久化并强制 clamp，避免拖出屏幕或展开后溢出
  const handleDragEnd = () => {
    commitPosition(x.get(), y.get());
  };

  const toast = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2800);
  }, []);

  // =====================
  // 外观皮肤（图片化）：默认使用内置矢量 3D 动画；你可以上传自定义图片/GIF 覆盖每个阶段外观。
  // =====================

  const [skinOverrides, setSkinOverrides] = useState<SkinPack>(() => {
    const saved = tryParse<SkinPack>(typeof window !== 'undefined' ? localStorage.getItem(LS_SKINS) : null);
    return saved ?? {};
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_SKINS, JSON.stringify(skinOverrides));
  }, [skinOverrides]);

  const getSkin = useCallback(
    (type: PetType, stage: PetStage) => skinOverrides[type]?.[stage] ?? DEFAULT_SKINS[type]?.[stage] ?? null,
    [skinOverrides],
  );
  // 皮肤上传：支持按阶段选择（蛋/幼体/成体），便于做“三阶段不同形象”。
  const [skinStage, setSkinStage] = useState<PetStage>('baby');
  useEffect(() => {
    setSkinStage(pet.stage);
  }, [pet.type, pet.stage]);

  const applySkin = useCallback((type: PetType, stage: PetStage, dataUrl: string) => {
    setSkinOverrides((prev) => ({
      ...prev,
      [type]: { ...(prev[type] ?? {}), [stage]: dataUrl },
    }));
  }, []);

  const clearSkin = useCallback((type: PetType, stage: PetStage) => {
    setSkinOverrides((prev) => {
      const nextStage = { ...(prev[type] ?? {}) };
      delete (nextStage as any)[stage];
      const next = { ...prev, [type]: nextStage };
      if (Object.keys(nextStage).length === 0) delete (next as any)[type];
      return next;
    });
  }, []);

  const fileToDataUrl = useCallback(
    (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      }),
    [],
  );

  const onUploadSkin = useCallback(
    async (file: File, type: PetType, stage: PetStage) => {
      if (!file.type.startsWith('image/')) {
        toast('请选择图片文件（PNG/JPG/WebP/GIF）');
        return;
      }
      // 体积控制：避免 localStorage 被塞爆（约 4~5MB 以上可能失败）
      if (file.size > 1_200_000) {
        toast('图片太大，建议小于 1.2MB（可先压缩/转 WebP）。');
        return;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        applySkin(type, stage, dataUrl);
        toast('皮肤已应用（保存在浏览器本地）');
      } catch {
        toast('读取图片失败，请重试。');
      }
    },
    [applySkin, fileToDataUrl, toast],
  );


  const gainExpCoins = (baseExp: number, baseCoins: number) => {
    const boost = 1 + clamp(pet.upgrades.xpBoost * 0.08, 0, 0.48);
    const exp = Math.round(baseExp * boost);
    const coins = Math.round(baseCoins);
    setPet((p) => ({ ...p, exp: p.exp + exp, coins: p.coins + coins }));
  };

  const levelUpIfNeeded = (state: PetState): PetState => {
    let s = { ...state };
    // 多级连跳
    for (let i = 0; i < 3; i += 1) {
      const need = expNeeded(s.level);
      if (s.exp < need) break;
      s.exp = s.exp - need;
      s.level += 1;
      s.coins += 80 + s.level * 12;
      s.unlocked = unlockByLevel(s.level, s.unlocked);
      toast(`升级！Lv.${s.level}（解锁内容已刷新）`);
      if (s.level >= 5 && s.stage === 'baby') s.stage = 'adult';
    }
    return s;
  };

  const interact = (action: 'hatch' | 'feed' | 'play' | 'clean' | 'explore' | 'rest' | 'gift') => {
    setPet((prev) => {
      let next = { ...prev };

      if (action === 'hatch') {
        next.stage = 'baby';
        next.hatchedAt = Date.now();
        next.level = Math.max(1, next.level);
        next.health = 100;
        next.mood = 90;
        next.hunger = 25;
        next.energy = 95;
        next.cleanliness = 95;
        next.coins += 60;
        toast(`破壳！获得：${PET_META[next.type].name}（+60金币）`);
        return next;
      }

      if (next.stage === 'egg') {
        toast('先点击蛋孵化，再互动。');
        return next;
      }

      if (action === 'feed') {
        const hasFood = next.inv.food > 0;
        if (hasFood) next.inv = { ...next.inv, food: next.inv.food - 1 };
        const delta = hasFood ? 34 : 18;
        next.hunger = clamp(next.hunger - delta, 0, 100);
        next.mood = clamp(next.mood + (hasFood ? 6 : 2), 0, 100);
        next.energy = clamp(next.energy + 4, 0, 100);
        gainExpCoins(18, 8);
        toast(hasFood ? `喂食成功（-1食物，饱食+${delta}）` : `临时喂食（建议去商店买食物）`);
      }

      if (action === 'play') {
        const hasToy = next.inv.toy > 0;
        if (hasToy) next.inv = { ...next.inv, toy: next.inv.toy - 1 };
        next.mood = clamp(next.mood + (hasToy ? 22 : 14), 0, 100);
        next.energy = clamp(next.energy - 10, 0, 100);
        next.cleanliness = clamp(next.cleanliness - 6, 0, 100);
        gainExpCoins(24, 10);
        toast(hasToy ? `玩耍（-1玩具，心情提升）` : `玩耍（建议用玩具效果更好）`);
      }

      if (action === 'clean') {
        const hasBath = next.inv.bath > 0;
        if (hasBath) next.inv = { ...next.inv, bath: next.inv.bath - 1 };
        const regen = 1 + clamp(next.upgrades.regenEnergy * 0.06, 0, 0.36);
        next.cleanliness = clamp(next.cleanliness + (hasBath ? 40 : 26), 0, 100);
        next.mood = clamp(next.mood + (hasBath ? 10 : 6), 0, 100);
        next.energy = clamp(next.energy + Math.round(8 * regen), 0, 100);
        gainExpCoins(16, 7);
        toast(hasBath ? `清洁完成（-1清洁）` : `简单清洁（建议买清洁用品）`);
      }

      if (action === 'explore') {
        const canExplore = next.level >= 2;
        if (!canExplore) {
          toast('Lv.2 解锁“探险”。');
          return next;
        }
        next.isOutside = !next.isOutside;
        gainExpCoins(next.isOutside ? 14 : 8, next.isOutside ? 6 : 3);
        toast(next.isOutside ? '出门探险（更耗精力，奖励更高）' : '回到家里（更稳定）');
      }

      if (action === 'rest') {
        const regen = 1 + clamp(next.upgrades.regenEnergy * 0.06, 0, 0.36);
        next.energy = clamp(next.energy + Math.round(26 * regen), 0, 100);
        next.mood = clamp(next.mood + 4, 0, 100);
        next.hunger = clamp(next.hunger + 6, 0, 100);
        gainExpCoins(10, 3);
        toast('休息：精力恢复');
      }

      if (action === 'gift') {
        if (next.inv.giftBox <= 0) {
          toast('没有礼物盒（去商店买一个）。');
          return next;
        }
        next.inv = { ...next.inv, giftBox: next.inv.giftBox - 1 };
        next.mood = 100;
        next.health = clamp(next.health + 8, 0, 100);
        next.cleanliness = clamp(next.cleanliness + 10, 0, 100);
        gainExpCoins(22, 0);
        toast('打开礼物盒：心情拉满！');
      }

      // 升级与进化
      next = levelUpIfNeeded(next);
      return next;
    });
  };

  const switchPetType = (type: PetType) => {
    setPet((p) => {
      if (!p.unlocked[type]) {
        toast(`Lv.${PET_META[type].unlockLv} 解锁：${PET_META[type].name}`);
        return p;
      }
      toast(`切换：${PET_META[type].name}`);
      return { ...p, type };
    });
  };

  const buy = (sku: 'food' | 'toy' | 'bath' | 'giftBox' | 'upgrade_xp' | 'upgrade_hunger' | 'upgrade_regen' | 'upgrade_auto') => {
    setPet((prev) => {
      const next = { ...prev, inv: { ...prev.inv }, upgrades: { ...prev.upgrades } };

      const pay = (cost: number) => {
        if (next.coins < cost) return false;
        next.coins -= cost;
        return true;
      };

      if (sku === 'food') {
        if (!pay(18)) {
          toast('金币不够。');
          return prev;
        }
        next.inv.food += 1;
        toast('购买：食物 +1');
        return next;
      }

      if (sku === 'toy') {
        if (!pay(22)) {
          toast('金币不够。');
          return prev;
        }
        next.inv.toy += 1;
        toast('购买：玩具 +1');
        return next;
      }

      if (sku === 'bath') {
        if (!pay(24)) {
          toast('金币不够。');
          return prev;
        }
        next.inv.bath += 1;
        toast('购买：清洁 +1');
        return next;
      }

      if (sku === 'giftBox') {
        if (!pay(60)) {
          toast('金币不够。');
          return prev;
        }
        next.inv.giftBox += 1;
        toast('购买：礼物盒 +1');
        return next;
      }

      // upgrades
      const maxLv = 6;

      if (sku === 'upgrade_xp') {
        const lv = next.upgrades.xpBoost;
        if (lv >= maxLv) {
          toast('该升级已满级。');
          return prev;
        }
        const cost = 90 + lv * 55;
        if (!pay(cost)) {
          toast('金币不够。');
          return prev;
        }
        next.upgrades.xpBoost += 1;
        toast(`升级：经验加成 Lv.${next.upgrades.xpBoost}`);
        return next;
      }

      if (sku === 'upgrade_hunger') {
        const lv = next.upgrades.slowHunger;
        if (lv >= maxLv) {
          toast('该升级已满级。');
          return prev;
        }
        const cost = 85 + lv * 50;
        if (!pay(cost)) {
          toast('金币不够。');
          return prev;
        }
        next.upgrades.slowHunger += 1;
        toast(`升级：饥饿减速 Lv.${next.upgrades.slowHunger}`);
        return next;
      }

      if (sku === 'upgrade_regen') {
        const lv = next.upgrades.regenEnergy;
        if (lv >= maxLv) {
          toast('该升级已满级。');
          return prev;
        }
        const cost = 80 + lv * 45;
        if (!pay(cost)) {
          toast('金币不够。');
          return prev;
        }
        next.upgrades.regenEnergy += 1;
        toast(`升级：恢复增益 Lv.${next.upgrades.regenEnergy}`);
        return next;
      }

      if (sku === 'upgrade_auto') {
        const lv = next.upgrades.autoCare;
        if (lv >= maxLv) {
          toast('该升级已满级。');
          return prev;
        }
        const cost = 110 + lv * 70;
        if (!pay(cost)) {
          toast('金币不够。');
          return prev;
        }
        next.upgrades.autoCare += 1;
        toast(`升级：自动护理 Lv.${next.upgrades.autoCare}`);
        return next;
      }

      return prev;
    });
  };

  // 渲染：场景背景（室内/室外 + 昼夜与氛围）
  const scene = useMemo(() => {
    const outside = pet.isOutside;
    const night = face === 'sleep';
    const base = outside
      ? night
        ? 'bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,.25),transparent_55%),linear-gradient(180deg,#0B1220,#0F172A)]'
        : 'bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,.35),transparent_55%),linear-gradient(180deg,#ECFEFF,#E0F2FE)]'
      : night
        ? 'bg-[radial-gradient(circle_at_50%_20%,rgba(148,163,184,.18),transparent_55%),linear-gradient(180deg,#0B1220,#111827)]'
        : 'bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,.35),transparent_55%),linear-gradient(180deg,#FFF7ED,#FFFBEB)]';
    return base;
  }, [pet.isOutside, face]);

  const canExplore = pet.level >= 2;
  const expPct = clamp((pet.exp / expNeeded(pet.level)) * 100, 0, 100);
  const consoleMaxH = useMemo(() => clamp(fullSize.h - 360, 180, 360), [fullSize.h]);


  return (
    <>
      <ArtDefs />

      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragMomentum={false}
          dragElastic={0}
          dragListener={!isOpen}
          dragControls={dragControls}
          style={{ x, y }}
          onDragEnd={handleDragEnd}
          className="absolute pointer-events-auto"
        >
          <AnimatePresence mode="wait">
            {/* =======================
                收起态：玻璃胶囊
               ======================= */}
            {!isOpen && (
              <motion.div
                key="mini"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                whileHover={{ scale: 1.08 }}
                className="relative cursor-pointer select-none"
                onClick={() => setIsOpen(true)}
              >
                <div className="w-24 h-24 rounded-full bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_10px_40px_rgba(2,6,23,0.18)] overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.9),transparent_45%)] opacity-70" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_80%,rgba(59,130,246,.14),transparent_55%)]" />
                  <div className="w-full h-full p-2">
                    {renderPetArt(pet.type, pet.stage, face, power, getSkin(pet.type, pet.stage))}
                  </div>
                </div>

                {/* 红点：饥饿或脏 */}
                {(pet.hunger > 80 || pet.cleanliness < 30) && pet.stage !== 'egg' && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white shadow-lg flex items-center justify-center">
                    <Utensils className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                {/* 经验条微提示 */}
                <div className="absolute -bottom-3 left-0 right-0 mx-auto w-20 h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div className="h-full bg-emerald-500/70" style={{ width: `${expPct}%` }} />
                </div>
              </motion.div>
            )}

            {/* =======================
                展开态：主面板
               ======================= */}
            {isOpen && (
              <motion.div
                key="full"
                initial={{ width: 100, height: 100, opacity: 0, borderRadius: '999px' }}
                animate={{ width: fullSize.w, height: fullSize.h, opacity: 1, borderRadius: '44px' }}
                exit={{ width: 100, height: 100, opacity: 0, borderRadius: '999px' }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                className="relative overflow-hidden flex flex-col bg-white/92 backdrop-blur-3xl shadow-[0_20px_80px_rgba(2,6,23,0.25)] border border-white/70 font-sans"
              >
                {/* 顶部拖拽栏 */}
                <div
                  onPointerDown={(e) => dragControls.start(e)}
                  className="relative h-16 flex items-center justify-between px-6 cursor-move select-none border-b border-white/60 bg-[linear-gradient(90deg,rgba(16,185,129,.12),rgba(59,130,246,.10))]"
                >
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-white/70 border border-white/80 shadow-sm" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-white/70 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">Lv.{pet.level}</span>
                        <span className="text-xs font-bold text-slate-400">{PET_META[pet.type].name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">{PET_META[pet.type].tagline}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* 场景区 */}
                <div className={`relative flex-1 min-h-0 ${scene} transition-[background] duration-700`}>
                  {/* 背景动态元素 */}
                  <div className="absolute inset-0 pointer-events-none">
                    <SoftSparkles intensity={pet.isOutside ? 1.2 : 0.85} />

                    {/* 昼夜图标 */}
                    <motion.div
                      className="absolute top-6 right-6 opacity-90"
                      animate={{ rotate: [0, 12, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {face === 'sleep' ? (
                        <Moon className="w-10 h-10 text-slate-200 drop-shadow" />
                      ) : (
                        <Sun className="w-10 h-10 text-amber-300 drop-shadow" />
                      )}
                    </motion.div>

                    {/* 地平线/地面 */}
                    <div className="absolute bottom-0 left-0 right-0 h-40">
                      <div className="absolute bottom-0 left-0 right-0 h-40 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,.35),transparent_60%)] blur-2xl opacity-70" />
                      <div className="absolute bottom-0 left-0 right-0 h-28 bg-white/20 blur-2xl" />
                    </div>
                  </div>

                  {/* 宠物主体 */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="w-64 h-64 sm:w-72 sm:h-72 cursor-pointer"
                      onClick={() => (pet.stage === 'egg' ? interact('hatch') : interact('play'))}
                    >
                      {renderPetArt(pet.type, pet.stage, face, power, getSkin(pet.type, pet.stage))}
                    </motion.div>
                  </div>

                  {/* 顶部信息条：金币与经验 */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2 rounded-full bg-white/65 backdrop-blur px-3 py-1.5 border border-white/70 shadow-sm">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-extrabold text-slate-800 tabular-nums">{pet.coins}</span>
                    </div>
                    <div className="w-40 h-2 rounded-full bg-white/30 overflow-hidden border border-white/40">
                      <div className="h-full bg-emerald-500/70" style={{ width: `${expPct}%` }} />
                    </div>
                  </div>

                  {/* 通知 */}
                  <AnimatePresence>
                    {notification && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="absolute bottom-7 left-0 right-0 mx-auto w-max max-w-[320px] px-5 py-2 rounded-full bg-white/75 backdrop-blur-xl border border-white/70 shadow-lg text-sm font-extrabold text-emerald-700 z-30"
                      >
                        {notification}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 孵化提示 */}
                  {pet.stage === 'egg' && (
                    <div className="absolute bottom-24 w-full text-center z-20">
                      <span className="inline-flex items-center gap-2 bg-white/70 backdrop-blur px-4 py-2 rounded-full text-xs font-extrabold text-slate-700 shadow-md border border-white/70">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        点击孵化（解锁玩法从 Lv.2 开始）
                      </span>
                    </div>
                  )}
                </div>

                {/* 控制台 */}
                <div className="relative z-20 shrink-0 bg-white p-6 rounded-t-[36px] -mt-7 shadow-[0_-14px_50px_rgba(2,6,23,0.08)] border-t border-white/80">
                  {/* Tab Bar */}
                  <div className="flex items-center justify-between mb-5">
                    <TabButton active={tab === 'care'} icon={Heart} label="养成" onClick={() => setTab('care')} />
                    <TabButton active={tab === 'collection'} icon={Grid3X3} label="图鉴" onClick={() => setTab('collection')} />
                    <TabButton active={tab === 'shop'} icon={ShoppingBag} label="商店" onClick={() => setTab('shop')} />
                    <TabButton active={tab === 'upgrades'} icon={Wand2} label="升级" onClick={() => setTab('upgrades')} />
                  </div>

                  <div className="overflow-auto pr-1" style={{ maxHeight: consoleMaxH }}>
                    <AnimatePresence mode="wait">
                    {/* ============ 养成 ============ */}
                    {tab === 'care' && (
                      <motion.div key="care" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                        {/* 属性 */}
                        <div className="grid grid-cols-5 gap-3 mb-5">
                          <StatItem icon={Heart} color="text-rose-500" val={pet.health} label="健康" />
                          <StatItem icon={Utensils} color="text-orange-500" val={100 - pet.hunger} label="饱食" />
                          <StatItem icon={Bath} color="text-cyan-500" val={pet.cleanliness} label="清洁" />
                          <StatItem icon={Sparkles} color="text-amber-500" val={pet.mood} label="心情" />
                          <StatItem icon={Zap} color="text-indigo-500" val={pet.energy} label="精力" />
                        </div>

                        {/* 动作 */}
                        <div className="grid grid-cols-4 gap-4">
                          <ActionBtn icon={Utensils} color="bg-rose-50 text-rose-500" label="喂食" onClick={() => interact('feed')} />
                          <ActionBtn icon={Gamepad2} color="bg-amber-50 text-amber-600" label="玩耍" onClick={() => interact('play')} />
                          <ActionBtn icon={Bath} color="bg-cyan-50 text-cyan-600" label="清洁" onClick={() => interact('clean')} />
                          <ActionBtn
                            icon={pet.isOutside ? Home : Map}
                            color="bg-emerald-50 text-emerald-600"
                            label={pet.isOutside ? '回家' : '探险'}
                            onClick={() => interact('explore')}
                            disabled={!canExplore}
                            badge={!canExplore ? 'Lv.2' : undefined}
                          />
                        </div>

                        {/* 次级动作 */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <MiniBtn icon={Moon} label="休息" onClick={() => interact('rest')} />
                          <MiniBtn icon={Gift} label="礼物" onClick={() => interact('gift')} />
                        </div>

                        {/* 背包小条 */}
                        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1"><Utensils className="w-4 h-4 text-slate-400" />{pet.inv.food}</span>
                            <span className="inline-flex items-center gap-1"><Gamepad2 className="w-4 h-4 text-slate-400" />{pet.inv.toy}</span>
                            <span className="inline-flex items-center gap-1"><Bath className="w-4 h-4 text-slate-400" />{pet.inv.bath}</span>
                            <span className="inline-flex items-center gap-1"><Gift className="w-4 h-4 text-slate-400" />{pet.inv.giftBox}</span>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="font-bold text-slate-700">下一次升级需要 {Math.max(0, expNeeded(pet.level) - pet.exp)} 经验</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ============ 图鉴 ============ */}
                    {tab === 'collection' && (
                      <motion.div key="collection" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-extrabold text-slate-800">宠物图鉴</div>
                          <div className="text-xs text-slate-500">按等级逐步解锁（当前 Lv.{pet.level}）</div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          {PET_ORDER.map((t) => {
                            const locked = !pet.unlocked[t];
                            const active = pet.type === t;
                            return (
                              <button
                                key={t}
                                onClick={() => switchPetType(t)}
                                className={[
                                  'relative rounded-2xl overflow-hidden border transition-all',
                                  active ? 'border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.20)]' : 'border-slate-200 hover:border-slate-300',
                                  locked ? 'opacity-55' : 'opacity-100',
                                ].join(' ')}
                              >
                                <div className="h-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.9),transparent_55%)]" />
                                <div className="absolute inset-0 p-2">
                                  <div className="w-full h-full">
                                    {renderPetArt(t, pet.stage === 'egg' ? 'egg' : 'baby', face, power, getSkin(t, pet.stage === 'egg' ? 'egg' : 'baby'))}
                                  </div>
                                </div>
                                <div className="absolute bottom-1 left-1 right-1 px-2">
                                  <div className="text-[10px] font-extrabold text-slate-700 flex items-center justify-between">
                                    <span>{PET_META[t].name}</span>
                                    {locked && <span className="text-slate-500">Lv.{PET_META[t].unlockLv}</span>}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* 外观皮肤（图片化） */}
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-sm font-extrabold text-slate-800">外观皮肤（图片化）</div>
                              <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                为「蛋 / 幼体 / 成体」分别上传图片（PNG/JPG/WebP/GIF），即可替换该阶段外观；GIF/WebP 会自动播放（无边框、透明背景取决于图片本身）。
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                clearSkin(pet.type, skinStage);
                                toast('已恢复默认外观');
                              }}
                              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                            >
                              恢复默认
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <div className="text-[11px] font-extrabold text-slate-700 mr-1">阶段：</div>
                            {(['egg', 'baby', 'adult'] as PetStage[]).map((s) => (
                              <button
                                key={s}
                                onClick={() => setSkinStage(s)}
                                className={
                                  'px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-colors ' +
                                  (skinStage === s
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')
                                }
                              >
                                {s === 'egg' ? '蛋' : s === 'baby' ? '幼体' : '成体'}
                              </button>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                              <div className="w-full h-full p-1.5">
                                {renderPetArt(pet.type, skinStage, face, power, getSkin(pet.type, skinStage))}
                              </div>
                            </div>

                            <label className="flex-1 cursor-pointer">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors px-4 py-3">
                                <div className="text-xs font-extrabold text-slate-800">
                                  点击上传：
                                  {skinStage === 'egg' ? '蛋' : skinStage === 'baby' ? '幼体' : '成体'}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">建议 &lt; 1.2MB，避免存储失败</div>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  onUploadSkin(f, pet.type, skinStage);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          <div className="mt-2 text-[11px] text-slate-500">
                            提示：如果你想用「动图」效果，优先用透明背景的 GIF / WebP；图片是否“无边框”取决于素材本身是否带底色。
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                              <Leaf className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-extrabold text-slate-800">解锁路线</div>
                              <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                                Lv.2 解锁探险与猫；Lv.3 解锁史莱姆；Lv.4 解锁狼；Lv.5 解锁凤凰并进化为成体；Lv.6 解锁鸮；Lv.7 解锁机灵（可升级）。
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ============ 商店 ============ */}
                    {tab === 'shop' && (
                      <motion.div key="shop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-extrabold text-slate-800">商店</div>
                          <div className="text-xs text-slate-500">购买道具让互动更强</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <ShopItem icon={Utensils} title="食物" desc="喂食效果更强" price={18} onBuy={() => buy('food')} />
                          <ShopItem icon={Gamepad2} title="玩具" desc="玩耍收益更高" price={22} onBuy={() => buy('toy')} />
                          <ShopItem icon={Bath} title="清洁" desc="清洁恢复更多" price={24} onBuy={() => buy('bath')} />
                          <ShopItem icon={Gift} title="礼物盒" desc="心情拉满一次" price={60} onBuy={() => buy('giftBox')} />
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                              <Bone className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-extrabold text-slate-800">小技巧</div>
                              <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                                探险时衰减更快，但经验和金币更高；如果精力低于 18，会自动进入“睡眠表情”，建议先休息或清洁。
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ============ 升级 ============ */}
                    {tab === 'upgrades' && (
                      <motion.div key="upgrades" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-extrabold text-slate-800">升级</div>
                          <div className="text-xs text-slate-500">玩法随升级变强</div>
                        </div>

                        <div className="space-y-3">
                          <UpgradeRow
                            icon={Sparkles}
                            title="经验加成"
                            desc="所有互动获得更多经验"
                            level={pet.upgrades.xpBoost}
                            onBuy={() => buy('upgrade_xp')}
                            priceText={`当前：+${pet.upgrades.xpBoost * 8}%`}
                          />
                          <UpgradeRow
                            icon={Utensils}
                            title="饥饿减速"
                            desc="基础饥饿增长变慢"
                            level={pet.upgrades.slowHunger}
                            onBuy={() => buy('upgrade_hunger')}
                            priceText={`当前：-${Math.round(pet.upgrades.slowHunger * 6)}%`}
                          />
                          <UpgradeRow
                            icon={Zap}
                            title="恢复增益"
                            desc="休息/清洁恢复更多精力"
                            level={pet.upgrades.regenEnergy}
                            onBuy={() => buy('upgrade_regen')}
                            priceText={`当前：+${Math.round(pet.upgrades.regenEnergy * 6)}%`}
                          />
                          <UpgradeRow
                            icon={Wand2}
                            title="自动护理"
                            desc="循环中有概率自动使用道具"
                            level={pet.upgrades.autoCare}
                            onBuy={() => buy('upgrade_auto')}
                            priceText={`当前：${Math.round(pet.upgrades.autoCare * 2)}%/Tick`}
                          />
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-extrabold text-slate-800">升级解锁的“玩法提升”</div>
                              <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                                你会看到：更快升级、更慢饥饿、更强恢复、甚至自动护理。配合图鉴解锁，多宠物切换与进化会越来越有“游戏感”。
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

// ==========================================
// 6) UI 组件
// ==========================================

interface TabButtonProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={[
      'flex items-center gap-2 px-3 py-2 rounded-2xl transition-all border',
      active ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300',
    ].join(' ')}
  >
    <Icon className={active ? 'w-4 h-4 text-emerald-600' : 'w-4 h-4 text-slate-500'} />
    <span className={active ? 'text-xs font-extrabold text-emerald-700' : 'text-xs font-bold text-slate-600'}>{label}</span>
  </button>
);

interface StatItemProps {
  icon: LucideIcon;
  color: string;
  val: number;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, color, val, label }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
      <div className={`absolute bottom-0 left-0 w-full bg-current opacity-10 ${color}`} style={{ height: `${val}%`, transition: 'height 0.5s' }} />
      <Icon className={`w-5 h-5 ${color} relative z-10`} />
    </div>
    <span className="text-[10px] font-extrabold text-slate-400">{label}</span>
  </div>
);

interface ActionBtnProps {
  icon: LucideIcon;
  color: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

const ActionBtn: React.FC<ActionBtnProps> = ({ icon: Icon, color, label, onClick, disabled, badge }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      'relative flex flex-col items-center justify-center aspect-square rounded-[20px] transition-all active:scale-95 hover:shadow-lg',
      color,
      disabled ? 'opacity-55 cursor-not-allowed' : '',
    ].join(' ')}
  >
    {badge && (
      <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-900 text-white shadow">
        {badge}
      </div>
    )}
    <Icon className="w-6 h-6 mb-1" />
    <span className="text-[10px] font-extrabold opacity-80">{label}</span>
  </button>
);

interface MiniBtnProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

const MiniBtn: React.FC<MiniBtnProps> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all active:scale-[0.99]"
  >
    <Icon className="w-4 h-4 text-slate-600" />
    <span className="text-xs font-extrabold text-slate-700">{label}</span>
  </button>
);

interface ShopItemProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  price: number;
  onBuy: () => void;
}

const ShopItem: React.FC<ShopItemProps> = ({ icon: Icon, title, desc, price, onBuy }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-extrabold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
    </div>
    <button
      onClick={onBuy}
      className="mt-3 w-full rounded-2xl bg-slate-900 text-white py-2 text-xs font-extrabold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
    >
      <Coins className="w-4 h-4" />
      {price}
    </button>
  </div>
);

interface UpgradeRowProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  level: number;
  priceText: string;
  onBuy: () => void;
}

const UpgradeRow: React.FC<UpgradeRowProps> = ({ icon: Icon, title, desc, level, priceText, onBuy }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-800">{title}</div>
          <div className="text-xs font-extrabold text-slate-600">Lv.{level}</div>
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        <div className="text-xs text-slate-600 mt-2 font-bold">{priceText}</div>
      </div>
    </div>

    <button
      onClick={onBuy}
      className="mt-3 w-full rounded-2xl bg-emerald-600 text-white py-2 text-xs font-extrabold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
    >
      <Wand2 className="w-4 h-4" />
      购买升级
    </button>
  </div>
);
