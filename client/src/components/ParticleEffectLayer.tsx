import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTheme } from '../hooks/useTheme';

const createShapeTexture = (type: string) => {
  const size = 512; 
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const cx = size / 2;
  const cy = size / 2;
  
  ctx.clearRect(0, 0, size, size);

  if (type === 'petal') { 
    // ?? 樱花：水蜜桃粉，无边框，柔焦
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
    grad.addColorStop(0, '#fff0f5'); grad.addColorStop(0.6, '#ffc0cb'); grad.addColorStop(1, '#ff9a9e');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 130);
    ctx.bezierCurveTo(cx + 160, cy - 70, cx + 160, cy - 170, cx, cy - 90);
    ctx.bezierCurveTo(cx - 160, cy - 170, cx - 160, cy - 70, cx, cy + 130);
    ctx.fill();
    ctx.shadowColor = '#ffb7b2'; ctx.shadowBlur = 30; ctx.fill();
  } 
  else if (type === 'star_core') { 
    // ?? 恒星核心：高亮光球
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 200);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,215,0,0.8)'); // Gold tint
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 200, 0, Math.PI*2); ctx.fill();
  }
  else if (type === 'laurel') { 
    // ??? 古希腊：金币/叶片
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.ellipse(cx, cy, 60, 160, Math.PI/4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fef3c7'; ctx.beginPath(); ctx.ellipse(cx, cy, 30, 100, Math.PI/4, 0, Math.PI*2); ctx.fill();
  }
  else if (type === 'lily') {
    // ??? 莫奈
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, 200, 0, Math.PI*2); ctx.fill();
  }
  // FIXME: AI代码生成未完成 其他通用形状
  else if (type === 'mosaic') { ctx.fillStyle='#d4af37'; ctx.fillRect(100,100,312,312); ctx.fillStyle='#000'; ctx.fillRect(200,200,112,112); }
  else if (type === 'stroke') { ctx.lineCap='round'; ctx.lineWidth=40; ctx.strokeStyle='#fcd34d'; ctx.shadowBlur=40; ctx.shadowColor='#fbbf24'; ctx.beginPath(); ctx.moveTo(cx-120,cy); ctx.quadraticCurveTo(cx,cy-60,cx+120,cy); ctx.stroke(); }
  else if (type === 'code') { ctx.fillStyle='#00f260'; ctx.font='bold 300px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('1',cx,cy); }
  else if (type === 'snow') { ctx.strokeStyle='#fff'; ctx.lineWidth=15; ctx.lineCap='round'; for(let i=0;i<6;i++){ctx.save();ctx.translate(cx,cy);ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,180);ctx.moveTo(0,120);ctx.lineTo(50,150);ctx.moveTo(0,120);ctx.lineTo(-50,150);ctx.stroke();ctx.restore();} }
  else if (type === 'bubble') { ctx.strokeStyle='#fff'; ctx.lineWidth=10; ctx.beginPath(); ctx.arc(cx,cy,180,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fill(); }
  else { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,100,0,Math.PI*2); ctx.fill(); }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const Particles = ({ config }: { config: any }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const texture = useMemo(() => createShapeTexture(config.shape), [config.shape]);

  const { positions, velocities, phases, colors, galaxyParams } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    const cols = new Float32Array(count * 3);
    const gParams = new Float32Array(count * 3); // 存储星系专用参数: [radius, angleOffset, speed]
    
    const colorObjs = config.colors.map((c: string) => new THREE.Color(c));

    for (let i = 0; i < count; i++) {
      // 通用初始化
      pos[i * 3] = (Math.random() - 0.5) * 50;     
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50; 
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30; 

      vel[i * 3] = (Math.random() - 0.5) * 0.05;   
      vel[i * 3 + 1] = (Math.random() * 0.05 + 0.02) * config.speed; 
      phs[i] = Math.random() * Math.PI * 2;
      
      const color = colorObjs[Math.floor(Math.random() * colorObjs.length)];
      cols[i * 3] = color.r; cols[i * 3 + 1] = color.g; cols[i * 3 + 2] = color.b;

      // ?? 星系专用初始化 (Galaxy Init)
      if (config.move === 'galaxy') {
        // 计算螺旋位置
        const radius = Math.random() * 25; // 半径
        const branches = 3; // 3条旋臂
        const spinAngle = radius * 0.5; // 核心旋转快，外围旋转慢
        const branchAngle = (i % branches) * ((Math.PI * 2) / branches);
        
        // 随机散布，让星系看起来自然
        const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
        const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
        const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);

        gParams[i * 3] = radius; // 存半径
        gParams[i * 3 + 1] = branchAngle + spinAngle + randomX; // 存初始角度
        gParams[i * 3 + 2] = randomZ * 2; // 存垂直偏离度
        
        // 颜色微调：核心亮，外围暗
        if (radius < 5) {
            cols[i * 3] = 1.0; cols[i * 3 + 1] = 0.9; cols[i * 3 + 2] = 0.6; // 核心金
        }
      }
    }
    return { positions: pos, velocities: vel, phases: phs, colors: cols, galaxyParams: gParams };
  }, [config]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < config.count; i++) {
      const idx = i * 3;
      
      // === ?? 星系旋转逻辑 (Galaxy Physics) ===
      if (config.move === 'galaxy') {
        const radius = galaxyParams[idx];
        const initialAngle = galaxyParams[idx + 1];
        const zOffset = galaxyParams[idx + 2];
        
        // 核心转得快，外围转得慢 (Keplerian-ish)
        const rotationSpeed = 0.5 / (radius + 1); 
        const currentAngle = initialAngle + time * rotationSpeed;

        positions[idx] = Math.cos(currentAngle) * radius;
        positions[idx + 1] = Math.sin(currentAngle) * radius * 0.8; // 稍微压扁一点
        positions[idx + 2] = zOffset + Math.sin(time + phases[i]) * 0.5; // Z轴微动
      }
      
      // === ?? 樱花逻辑 ===
      else if (config.move === 'sakura') { 
        positions[idx + 1] -= velocities[idx + 1];
        positions[idx] += Math.sin(time * 1.2 + phases[i]) * 0.04;
        positions[idx + 2] += Math.cos(time * 0.8 + phases[i]) * 0.02;
        if (positions[idx + 1] < -25) { positions[idx + 1] = 25; positions[idx] = (Math.random()-0.5)*50; }
      }
      
      // === 通用逻辑 ===
      else if (config.move === 'drift') {
        positions[idx] += Math.sin(time * 0.5 + phases[i]) * 0.02;
        positions[idx + 1] += Math.cos(time * 0.3 + phases[i]) * 0.01;
      }
      else if (config.move === 'rain') { positions[idx+1]-=velocities[idx+1]*3; if(positions[idx+1]<-25)positions[idx+1]=25; }
      else if (config.move === 'rise') { positions[idx+1]+=velocities[idx+1]; positions[idx]+=Math.sin(time+phases[i])*0.01; if(positions[idx+1]>25)positions[idx+1]=-25; }
      else if (config.move === 'float') { positions[idx+1]+=Math.sin(time*0.5+phases[i])*0.01; positions[idx]+=Math.cos(time*0.5+phases[i])*0.01; }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // 整体姿态微调
    if (config.move === 'galaxy') {
        // 让星系倾斜一点，更有立体感
        pointsRef.current.rotation.x = 1.0; 
        pointsRef.current.rotation.y = time * 0.05; 
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={config.count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={config.count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={config.size}
        vertexColors
        transparent
        alphaTest={0.01}
        depthWrite={false}
        blending={config.blend || THREE.NormalBlending}
        sizeAttenuation={true}
        opacity={config.opacity || 1.0}
      />
    </points>
  );
};

const getParticleConfig = (themeName: string): any => {
  const t = themeName.toLowerCase();
  
  // 1. Sakura
  if (t.includes('sakura')) return { count: 400, size: 1.2, colors: ['#ffc0cb', '#ffb7b2', '#ffffff'], shape: 'petal', move: 'sakura', speed: 0.8, blend: THREE.NormalBlending, opacity: 0.9 };
  // 2. Van Gogh (星系)
  if (t.includes('van gogh')) return { count: 800, size: 1.0, colors: ['#ffd700', '#fcd34d', '#ffffff'], shape: 'star_core', move: 'galaxy', speed: 0.5, blend: THREE.AdditiveBlending, opacity: 0.9 };
  // 3. Greek
  if (t.includes('greek')) return { count: 150, size: 1.5, colors: ['#fbbf24', '#fef3c7', '#ffffff'], shape: 'laurel', move: 'drift', speed: 0.2, blend: THREE.NormalBlending, opacity: 0.8 };
  // 4. Monet
  if (t.includes('monet')) return { count: 300, size: 2.0, colors: ['#e9d5ff', '#bfdbfe', '#86efac'], shape: 'lily', move: 'drift', speed: 0.3, blend: THREE.AdditiveBlending, opacity: 0.5 };
  // 5. Klimt
  if (t.includes('klimt')) return { count: 200, size: 1.0, colors: ['#d4af37', '#000000', '#f59e0b'], shape: 'mosaic', move: 'float', speed: 0.2, blend: THREE.NormalBlending, opacity: 0.9 };
  
  // 其他主题
  if (t.includes('cyber')) return { count: 800, size: 0.6, colors: ['#00ff00', '#86efac'], shape: 'code', move: 'rain', speed: 3.0, blend: THREE.AdditiveBlending };
  if (t.includes('ocean')) return { count: 300, size: 1.0, colors: ['#bae6fd', '#ffffff'], shape: 'bubble', move: 'rise', speed: 1.0, blend: THREE.NormalBlending };
  if (t.includes('forest')) return { count: 200, size: 0.8, colors: ['#a7f3d0', '#fde047'], shape: 'leaf', move: 'float', speed: 0.5, blend: THREE.NormalBlending };
  if (t.includes('da vinci')) return { count: 150, size: 1.2, colors: ['#d4af37'], shape: 'stroke', move: 'float', speed: 0.2, blend: THREE.NormalBlending };
  if (t.includes('nebula')) return { count: 400, size: 0.8, colors: ['#e9d5ff', '#ffffff'], shape: 'star_core', move: 'galaxy', speed: 0.5, blend: THREE.AdditiveBlending }; // Nebula也用星系
  if (t.includes('snow')) return { count: 600, size: 0.7, colors: ['#ffffff', '#e0f2fe'], shape: 'snow', move: 'rain', speed: 0.8, blend: THREE.NormalBlending };
  if (t.includes('ink')) return { count: 120, size: 2.0, colors: ['#000000', '#525252'], shape: 'ink', move: 'float', speed: 0.1, blend: THREE.NormalBlending };

  return { count: 100, size: 0.5, colors: ['#fff'], shape: 'petal', move: 'float', speed: 0.5 };
};

const ParticleEffectLayer = () => {
  const { theme } = useTheme();
  return (
    <div key={theme} className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }} gl={{ alpha: true }}>
        <Particles config={getParticleConfig(theme)} />
      </Canvas>
    </div>
  );
};

export default ParticleEffectLayer;


