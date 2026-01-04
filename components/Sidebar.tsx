
import React from 'react';
import { Page, User } from '../types';
import { translations, Language } from '../translations';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  user: User;
  lang: Language;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, user, lang, isOpen, setIsOpen }) => {
  const t = translations[lang];

  const navItems = [
    { id: 'dashboard' as Page, label: t.dashboard, icon: 'grid_view' },
    { id: 'all-items' as Page, label: t.allItems, icon: 'inventory_2' },
    { id: 'favorites' as Page, label: t.favorites, icon: 'favorite' },
    { id: 'generator' as Page, label: t.generator, icon: 'key' },
    { id: 'audit' as Page, label: t.audit, icon: 'health_and_safety' },
    { id: 'notifications' as Page, label: t.notifications, icon: 'notifications' },
  ];

  const settingsItems = [
    { id: 'settings' as Page, label: t.profile, icon: 'person' },
    { id: 'security' as Page, label: t.security, icon: 'lock' },
  ];

  const handleNavClick = (id: Page) => {
    setCurrentPage(id);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-[70] h-screen w-72 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] p-5 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
              <div className="flex items-center justify-center size-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-2xl">shield_lock</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold leading-none tracking-tight">SecurePass</h1>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Vault Pro</p>
              </div>
            </div>
            <button className="lg:hidden p-2 text-slate-400 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[calc(100vh-250px)]">
            <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-3">{t.mainMenu}</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  currentPage === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined ${currentPage === item.id ? 'icon-fill' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
            
            <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mt-8 mb-3">{t.account}</p>
            {settingsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  currentPage === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined ${currentPage === item.id ? 'icon-fill' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{t.storage}</span>
              <span className="text-[10px] font-black text-primary cursor-pointer hover:underline">{t.upgrade}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">450MB / 1GB {t.used}</p>
          </div>
          
          <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
          
          <div className="flex items-center gap-3 px-2 py-1 group cursor-pointer" onClick={() => handleNavClick('settings')}>
            <div className="bg-center bg-no-repeat bg-cover rounded-2xl size-11 ring-2 ring-transparent group-hover:ring-primary transition-all shadow-md" style={{ backgroundImage: `url(${user.avatar})` }}></div>
            <div className="flex flex-col items-start overflow-hidden">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate w-full group-hover:text-primary transition-colors">{user.name}</p>
              <p className="text-[10px] font-black text-primary uppercase tracking-tighter">{user.plan} {t.plan}</p>
            </div>
            <button 
              className="material-symbols-outlined ml-auto text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-all" 
              title={t.logout} 
              onClick={(e) => { e.stopPropagation(); setCurrentPage('login'); }}
            >
              logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
