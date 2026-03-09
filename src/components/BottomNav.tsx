import React from 'react';
import { Home, CalendarClock, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

type BottomNavProps = {
    currentTab: 'home' | 'history' | 'ranking' | 'profile';
    onChangeTab: (tab: 'home' | 'history' | 'ranking' | 'profile') => void;
};

const BottomNav: React.FC<BottomNavProps> = React.memo(({ currentTab, onChangeTab }) => {
    const tabs = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'history', icon: CalendarClock, label: 'Historial' },
        { id: 'ranking', icon: Trophy, label: 'Sailkapena' },
        { id: 'profile', icon: User, label: 'Profila' }
    ] as const;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-white/80 backdrop-blur-xl border-t border-slate-200/50 safe-pb shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="max-w-md mx-auto flex items-center justify-around px-2 py-3 sm:py-4">
                {tabs.map((tab) => {
                    const isActive = currentTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChangeTab(tab.id)}
                            className={`relative flex flex-col items-center justify-center w-16 h-12 transition-colors ${isActive ? 'text-pink-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <div className="relative z-10 flex flex-col items-center">
                                <Icon
                                    size={isActive ? 24 : 22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className="transition-all duration-300"
                                />
                                <span
                                    className={`text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100 scale-100 mt-1' : 'opacity-0 scale-75 h-0 overflow-hidden m-0'
                                        }`}
                                >
                                    {tab.label}
                                </span>
                            </div>

                            {isActive && (
                                <motion.div
                                    className="absolute inset-0 bg-pink-100/50 rounded-2xl -z-0"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;
