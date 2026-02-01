import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';

import confetti from 'canvas-confetti';
import { useLanguage } from '@/i18n/LanguageContext';



export const HabitTree = ({ onClose }: { onClose: () => void }) => {
  const { t } = useLanguage();

  const [level, setLevel] = useState(1); // 1-7

  const [checkedToday, setCheckedToday] = useState(false);



  useEffect(() => {

    // 实际项目中应读取后端API

    const savedLevel = localStorage.getItem('user_habit_level');

    if (savedLevel) setLevel(parseInt(savedLevel));

    

    // 检查今日是否已打卡 (模拟)

    const lastCheck = localStorage.getItem('user_habit_last_date');

    if (lastCheck === new Date().toDateString()) setCheckedToday(true);

  }, []);



  const checkIn = () => {

    if (!checkedToday) {

        setCheckedToday(true);

        const newLevel = Math.min(level + 1, 7);

        setLevel(newLevel);

        

        localStorage.setItem('user_habit_level', newLevel.toString());

        localStorage.setItem('user_habit_last_date', new Date().toDateString());



        if (newLevel === 7) {

            confetti({ colors: ['#a7f3d0', '#34d399', '#ff9a9e'] });

        }

    }

  };



  const water = () => {

      // 补签逻辑

      alert(t('habitTree.water.success'));
  };



  return (

    <div className="w-80 h-[480px] bg-gradient-to-b from-green-50 to-emerald-100 rounded-[30px] shadow-2xl overflow-hidden flex flex-col relative border-4 border-white/50">

      <button onClick={onClose} className="absolute top-4 right-4 text-emerald-600/50 hover:text-emerald-600 z-20">×</button>
      

      {/* 标题 */}

      <div className="absolute top-6 left-6 z-10">

          <h3 className="text-emerald-800 font-bold text-lg">{t('habitTree.title')}</h3>

          <p className="text-emerald-600/70 text-xs">{t('habitTree.subtitle', { level })}</p>
      </div>



      <div className="flex-1 relative flex items-end justify-center pb-12">

        {/* 太阳 */}

        <motion.div 

            animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}

            className="absolute top-10 right-8 text-5xl opacity-80"
        >

            {t('habitTree.sun')}
        </motion.div>



        {/* 树主体 */}

        <div className="relative w-48 h-64 flex justify-center items-end">

            {/* 花盆 */}

            <div className="absolute bottom-0 z-10 w-24 h-20 bg-[#8d6e63] rounded-b-3xl rounded-t-sm flex items-center justify-center shadow-lg">

                <div className="w-20 h-2 bg-[#5d4037] absolute top-2 rounded-full opacity-20" />

                <span className="text-2xl">{t('habitTree.sprout')}</span>
            </div>



            {/* 树干 */}

            <motion.div 

                initial={{ height: 0 }} animate={{ height: 40 + level * 20 }}

                className="w-4 bg-[#795548] rounded-t-full relative z-0 origin-bottom"

            >

                {/* 树枝叶子生成 */}

                {[...Array(level)].map((_, i) => (

                    <motion.div

                        key={i}

                        initial={{ scale: 0 }} animate={{ scale: 1 }}

                        transition={{ delay: i * 0.1, type: 'spring' }}

                        className="absolute text-4xl filter drop-shadow-sm origin-bottom-left"

                        style={{ 

                            bottom: 20 + i * 25, 

                            left: i % 2 === 0 ? '50%' : '-50%',

                            marginLeft: i % 2 === 0 ? 5 : -25,

                            transform: `rotate(${i % 2 === 0 ? 15 : -15}deg)`

                        }}

                    >

                        {i === 6 ? t('habitTree.flower') : t('habitTree.leaf')}
                    </motion.div>

                ))}

            </motion.div>

        </div>

      </div>



      {/* 底部打卡栏 */}

      <div className="bg-white/60 p-5 backdrop-blur-md flex gap-3">

        <button 

            onClick={checkIn}

            disabled={checkedToday}

            className={`flex-1 py-3 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${checkedToday ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-400 text-white hover:bg-emerald-500 hover:scale-105'}`}

        >

            {checkedToday ? <span>{t('habitTree.checked')}</span> : <span>{t('habitTree.checkin')}</span>}
        </button>

        <button
          onClick={water}
          className="w-12 bg-blue-100 text-blue-500 rounded-2xl hover:bg-blue-200 flex items-center justify-center shadow-sm"
          title={t('habitTree.water')}
        >
          {t('habitTree.water_short')}
        </button>

      </div>

    </div>

  );

};







