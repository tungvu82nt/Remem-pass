
import React, { useState, useEffect, useMemo } from 'react';
import { Page, User, VaultItem, ItemType } from './types';
import Sidebar from './components/Sidebar';
import { getSecurityTip, checkPasswordStrengthAI } from './services/geminiService';
import { translations, Language } from './translations';

const USER: User = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatar: "https://picsum.photos/seed/alex/200",
  plan: "Pro"
};

const INITIAL_VAULT: VaultItem[] = [
  { id: '1', type: 'login', name: 'Netflix', username: 'alex.morgan@gmail.com', password: 'Password123!', url: 'netflix.com', favorite: true, lastUsed: new Date().toISOString(), strength: 85 },
  { id: '2', type: 'login', name: 'Spotify', username: 'alex_m_music', password: '123', url: 'spotify.com', favorite: false, lastUsed: new Date().toISOString(), strength: 10 },
  { id: '3', type: 'card', name: 'Chase Visa', cardNumber: '**** **** **** 7890', expiry: '12/26', cvv: '123', favorite: false, lastUsed: new Date().toISOString() },
  { id: '4', type: 'note', name: 'WiFi Home', note: 'secret_wifi_2024', favorite: true, lastUsed: new Date().toISOString() },
];

const App: React.FC = () => {
  // State initialization
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'vi');
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vault, setVault] = useState<VaultItem[]>(() => {
    const saved = localStorage.getItem('vault_data');
    return saved ? JSON.parse(saved) : INITIAL_VAULT;
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [aiTip, setAiTip] = useState<string>("");
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  
  // Generator State
  const [genPass, setGenPass] = useState("");
  const [genLength, setGenLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [aiStrengthFeedback, setAiStrengthFeedback] = useState<{ score: number, label: string } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<Partial<VaultItem>>({ type: 'login', favorite: false });

  const t = translations[lang];

  // Logic: Audit Results & Dynamic Health Score
  const auditReport = useMemo(() => {
    const reused = vault.filter(i => i.type === 'login' && vault.filter(v => v.password === i.password && v.id !== i.id).length > 0);
    const weak = vault.filter(i => i.type === 'login' && (i.password?.length || 0) < 10);
    
    // Calculate Health Score: 100 - (penalty for each issue)
    const loginCount = vault.filter(i => i.type === 'login').length;
    if (loginCount === 0) return { reused, weak, score: 100 };
    
    const penalty = (reused.length * 15) + (weak.length * 10);
    const score = Math.max(0, 100 - penalty);
    return { reused, weak, score };
  }, [vault]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('vault_data', JSON.stringify(vault));
  }, [vault]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // AI Tip
  useEffect(() => {
    if (currentPage === 'dashboard') {
      getSecurityTip(lang).then(setAiTip);
    }
  }, [currentPage, lang]);

  // Toast Management
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(t.copied);
  };

  // Generator Engine
  const generatePassword = () => {
    let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) chars += "0123456789";
    if (includeSymbols) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pass = "";
    for (let i = 0; i < genLength; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGenPass(pass);
    // Debounced AI check could be added here
  };

  useEffect(() => {
    if (currentPage === 'generator' || showModal) {
      generatePassword();
    }
  }, [currentPage, genLength, includeSymbols, includeNumbers, showModal]);

  // CRUD
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVault(prev => prev.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item));
    showToast(lang === 'vi' ? "Đã cập nhật yêu thích" : "Updated favorites");
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVault(prev => prev.filter(item => item.id !== id));
    showToast(lang === 'vi' ? "Đã xóa" : "Deleted");
  };

  const openEditModal = (item: VaultItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemForm(item);
    setEditingId(item.id);
    setShowModal('edit');
  };

  const handleSaveItem = () => {
    if (!itemForm.name) return showToast(lang === 'vi' ? 'Vui lòng nhập tên' : 'Please enter a name', 'info');
    if (showModal === 'add') {
      const newItem: VaultItem = { ...itemForm as VaultItem, id: Date.now().toString(), lastUsed: new Date().toISOString(), favorite: false };
      setVault(prev => [newItem, ...prev]);
    } else if (showModal === 'edit' && editingId) {
      setVault(prev => prev.map(item => item.id === editingId ? { ...item, ...itemForm } as VaultItem : item));
    }
    setShowModal(null);
    setItemForm({ type: 'login', favorite: false });
    setEditingId(null);
    showToast(lang === 'vi' ? "Thành công!" : "Success!");
  };

  // Filter & Search
  const filteredVault = useMemo(() => {
    let items = vault;
    if (currentPage === 'favorites') items = items.filter(i => i.favorite);
    if (filterType !== 'all') items = items.filter(i => i.type === filterType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.username?.toLowerCase().includes(q));
    }
    return items;
  }, [vault, currentPage, searchQuery, filterType]);

  // --- Sub-Components ---

  const LanguageSwitcher = () => (
    <div className="relative">
      <button 
        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:border-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">language</span> {lang}
      </button>
      {isLangMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[80] overflow-hidden py-1 animate-in zoom-in-95 duration-200 origin-top-right">
          {['en', 'vi', 'zh'].map(l => (
            <button 
              key={l} 
              onClick={() => { setLang(l as Language); setIsLangMenuOpen(false); }} 
              className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 ${lang === l ? 'text-primary' : 'text-slate-600 dark:text-slate-400'}`}
            >
              {l === 'en' ? 'English' : l === 'vi' ? 'Tiếng Việt' : '中文'}
              {lang === l && <span className="material-symbols-outlined text-sm">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Explicitly typing DashboardLayout as React.FC to handle children properly in the switch block
  const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={USER} lang={lang} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-2 text-slate-500 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-100 dark:border-slate-800" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1e293b] border-none rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 transition-all" 
                placeholder={t.allItems + "..."} 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <LanguageSwitcher />
             <button onClick={() => setCurrentPage('notifications')} className="hidden sm:flex relative p-2.5 text-slate-400 hover:text-primary transition-colors rounded-xl bg-white dark:bg-[#1e293b] shadow-sm border border-slate-100 dark:border-slate-800">
               <span className="material-symbols-outlined">notifications</span>
               <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1e293b]"></span>
             </button>
             <button onClick={() => setShowModal('add')} className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                <span className="material-symbols-outlined text-[20px]">add</span> <span className="hidden sm:inline">{lang === 'vi' ? "Thêm mới" : "New Item"}</span>
             </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
      
      {/* Modals & Toasts */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white dark:bg-surface-dark rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
            <div className="p-8 lg:p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black">{showModal === 'add' ? (lang === 'vi' ? 'Mục mới' : 'Add Item') : (lang === 'vi' ? 'Sửa mục' : 'Edit Item')}</h2>
                <button onClick={() => setShowModal(null)} className="size-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"><span className="material-symbols-outlined">close</span></button>
              </div>
              
              <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[1.25rem]">
                {(['login', 'card', 'note'] as ItemType[]).map(type => (
                  <button key={type} onClick={() => setItemForm({...itemForm, type})} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${itemForm.type === type ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}>{type}</button>
                ))}
              </div>

              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.name}</label>
                  <input value={itemForm.name || ''} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="h-14 bg-slate-50 dark:bg-background-dark border-none rounded-2xl px-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g. Netflix" />
                </div>
                {itemForm.type === 'login' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t.usernameEmail}</label>
                      <input value={itemForm.username || ''} onChange={e => setItemForm({...itemForm, username: e.target.value})} className="h-14 bg-slate-50 dark:bg-background-dark border-none rounded-2xl px-5 text-sm focus:ring-2 focus:ring-primary/20" placeholder="user@gmail.com" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between px-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.password}</label></div>
                      <div className="relative group">
                        <input type="text" value={itemForm.password || ''} onChange={e => setItemForm({...itemForm, password: e.target.value})} className="w-full h-14 bg-slate-50 dark:bg-background-dark border-none rounded-2xl px-5 font-mono text-sm focus:ring-2 focus:ring-primary/20" />
                        <button onClick={() => setItemForm({...itemForm, password: genPass})} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary shadow-sm opacity-0 group-hover:opacity-100 transition-all border dark:border-slate-700">{lang === 'vi' ? 'DÙNG AI' : 'USE AI'}</button>
                      </div>
                    </div>
                  </>
                )}
                {itemForm.type === 'note' && (
                   <textarea value={itemForm.note || ''} onChange={e => setItemForm({...itemForm, note: e.target.value})} className="w-full h-36 bg-slate-50 dark:bg-background-dark border-none rounded-[1.5rem] p-5 text-sm resize-none focus:ring-2 focus:ring-primary/20" placeholder={t.bio} />
                )}
              </div>
            </div>
            <div className="p-8 lg:p-10 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3">
               <button onClick={() => setShowModal(null)} className="h-14 text-sm font-black text-slate-500 px-8 uppercase tracking-widest">{t.cancel}</button>
               <button onClick={handleSaveItem} className="h-14 px-12 bg-primary text-white rounded-[1.25rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all">{t.saveChanges}</button>
            </div>
          </div>
        </div>
      )}
      
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 animate-in slide-in-from-bottom-10">
          <div className="size-8 bg-emerald-500 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-white text-lg">check</span></div>
          <span className="text-sm font-black uppercase tracking-wider">{toast.message}</span>
        </div>
      )}
    </div>
  );

  // --- Page Components ---

  const DashboardPage = () => (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-1">
          <h2 className="text-5xl font-black tracking-tight leading-none">{t.welcome}, {USER.name.split(' ')[0]} 👋</h2>
          <p className="text-slate-500 text-xl font-medium">{t.vaultSummary}</p>
        </div>
        <div className="flex items-center gap-6 bg-white dark:bg-surface-dark p-6 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 group hover:border-primary/50 transition-all cursor-default">
          <div className="relative size-16 flex items-center justify-center">
            <svg className="transform -rotate-90 size-16">
              <circle className="text-slate-100 dark:text-slate-800" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
              <circle className={`${auditReport.score > 70 ? 'text-emerald-500' : auditReport.score > 40 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`} cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="176" strokeDashoffset={176 - (176 * auditReport.score / 100)} strokeWidth="6" strokeLinecap="round"></circle>
            </svg>
            <span className="absolute text-sm font-black">{auditReport.score}%</span>
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">{t.vaultHealth}</span>
            <span className={`text-xl font-black uppercase tracking-tighter ${auditReport.score > 70 ? 'text-emerald-500' : auditReport.score > 40 ? 'text-amber-500' : 'text-red-500'}`}>
              {auditReport.score > 90 ? t.excellent : auditReport.score > 70 ? 'Good' : 'Needs Work'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { id: 'all-items', label: t.addLogin, sub: 'Logins', icon: 'add_moderator', color: 'bg-blue-500', click: () => setShowModal('add') },
             { id: 'generator', label: t.generator, sub: 'Passwords', icon: 'password', color: 'bg-indigo-500' },
             { id: 'audit', label: t.audit, sub: 'Security', icon: 'health_and_safety', color: 'bg-orange-500' },
             { id: 'favorites', label: t.favorites, sub: 'Starred', icon: 'star', color: 'bg-amber-500' }
           ].map((action, i) => (
             <button key={i} onClick={action.click || (() => setCurrentPage(action.id as Page))} className="group flex flex-col items-start gap-5 p-7 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[2rem] transition-all hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1">
                <div className={`size-12 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><span className="material-symbols-outlined">{action.icon}</span></div>
                <div className="text-left"><p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{action.sub}</p><p className="font-black text-lg leading-tight">{action.label}</p></div>
             </button>
           ))}
        </div>
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-[2.5rem] p-8 flex flex-col gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><span className="material-symbols-outlined text-6xl">auto_awesome</span></div>
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-2xl">bolt</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.aiSecurityTip}</span>
          </div>
          <p className="text-sm italic font-bold text-slate-700 dark:text-slate-300 leading-relaxed z-10">"{aiTip || 'Thinking of a tip for you...'}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
           <div className="flex justify-between items-center px-2">
             <h3 className="text-2xl font-black">{t.recentActivity}</h3>
             <button onClick={() => setCurrentPage('all-items')} className="text-xs font-black text-primary hover:underline uppercase tracking-widest">{t.viewAll}</button>
           </div>
           <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
             {vault.slice(0, 5).map(item => (
               <div key={item.id} onClick={(e) => openEditModal(item, e)} className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${item.type === 'login' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                      <span className="material-symbols-outlined">{item.type === 'login' ? 'lock' : 'credit_card'}</span>
                    </div>
                    <div><p className="font-black text-lg">{item.name}</p><p className="text-xs font-mono text-slate-400">{item.username || item.cardNumber}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleCopy(item.username || item.cardNumber || ''); }} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary rounded-xl transition-all"><span className="material-symbols-outlined text-lg">content_copy</span></button>
                  </div>
               </div>
             ))}
             {vault.length === 0 && (
               <div className="p-20 text-center space-y-4">
                 <span className="material-symbols-outlined text-6xl text-slate-200">sentiment_dissatisfied</span>
                 <p className="text-slate-400 font-bold">No items found.</p>
               </div>
             )}
           </div>
        </div>
        <div className="space-y-6">
           <h3 className="text-2xl font-black px-2">{lang === 'vi' ? 'Sức khỏe Kho' : 'Vault Scan'}</h3>
           <div className="space-y-4">
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="size-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20"><span className="material-symbols-outlined">warning</span></div>
                   <div><p className="text-sm font-black text-red-600 uppercase tracking-widest">{lang === 'vi' ? 'Trùng lặp' : 'Reused'}</p><p className="text-lg font-black">{auditReport.reused.length} Items</p></div>
                 </div>
                 <button onClick={() => setCurrentPage('audit')} className="material-symbols-outlined text-red-500 hover:scale-125 transition-transform">arrow_forward</button>
              </div>
              <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="size-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20"><span className="material-symbols-outlined">security</span></div>
                   <div><p className="text-sm font-black text-amber-600 uppercase tracking-widest">{lang === 'vi' ? 'Mật khẩu yếu' : 'Weak'}</p><p className="text-lg font-black">{auditReport.weak.length} Items</p></div>
                 </div>
                 <button onClick={() => setCurrentPage('audit')} className="material-symbols-outlined text-amber-500 hover:scale-125 transition-transform">arrow_forward</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const AllItemsPage = ({ title }: { title: string }) => (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
         <div className="space-y-1">
           <h1 className="text-5xl font-black tracking-tight leading-none">{title}</h1>
           <p className="text-slate-500 text-lg font-medium">{filteredVault.length} items in this view.</p>
         </div>
         <div className="flex gap-1.5 p-1.5 bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
            {(['all', 'login', 'card', 'note'] as const).map(cat => (
              <button key={cat} onClick={() => setFilterType(cat)} className={`px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filterType === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{cat}</button>
            ))}
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVault.map(item => (
          <div key={item.id} onClick={(e) => openEditModal(item, e)} className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-7 group cursor-pointer hover:border-primary/50 hover:shadow-[0_20px_60px_-15px_rgba(19,91,236,0.15)] transition-all relative overflow-hidden">
             <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`size-14 rounded-2xl flex items-center justify-center shadow-sm ${item.type === 'login' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                   <span className="material-symbols-outlined text-2xl">{item.type === 'login' ? 'lock' : 'credit_card'}</span>
                </div>
                <div className="flex gap-1 transition-all">
                   <button onClick={(e) => toggleFavorite(item.id, e)} className={`p-2 rounded-xl transition-colors ${item.favorite ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}><span className="material-symbols-outlined text-xl icon-fill">favorite</span></button>
                   <button onClick={(e) => deleteItem(item.id, e)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                </div>
             </div>
             <div className="relative z-10">
               <h3 className="text-xl font-black truncate mb-1">{item.name}</h3>
               <p className="text-sm font-mono text-slate-500 mb-8 truncate tracking-tight">{item.username || item.cardNumber || (item.note?.substring(0, 30))}</p>
             </div>
             <div className="flex gap-2 relative z-10">
                <button onClick={(e) => { e.stopPropagation(); handleCopy(item.username || item.cardNumber || ''); }} className="flex-1 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">{lang === 'vi' ? 'Copy User' : 'Copy User'}</button>
                {item.type === 'login' && <button onClick={(e) => { e.stopPropagation(); handleCopy(item.password || ''); }} className="flex-1 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">{lang === 'vi' ? 'Mật khẩu' : 'Pass'}</button>}
             </div>
          </div>
        ))}
      </div>
      {filteredVault.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300 space-y-6 animate-in fade-in zoom-in duration-700">
           <div className="size-32 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center"><span className="material-symbols-outlined text-6xl opacity-30">search_off</span></div>
           <p className="font-black text-xl tracking-tight opacity-60">{lang === 'vi' ? 'Kho trống rỗng' : 'Nothing here yet'}</p>
        </div>
      )}
    </div>
  );

  const AuditPage = () => (
    <div className="max-w-6xl mx-auto space-y-12 py-6">
      <div className="space-y-1">
        <h1 className="text-5xl font-black tracking-tight">{t.audit}</h1>
        <p className="text-slate-500 text-xl font-medium">Global Security Score: <span className={`font-black ${auditReport.score > 70 ? 'text-emerald-500' : 'text-orange-500'}`}>{auditReport.score}%</span></p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[3rem] shadow-sm flex flex-col gap-8">
             <div className="flex justify-between items-center">
                <div className="size-16 bg-red-500 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-red-500/20"><span className="material-symbols-outlined text-4xl">warning</span></div>
                <div className="text-right"><p className="text-4xl font-black text-red-600">{auditReport.reused.length}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'vi' ? 'Trùng lặp' : 'Reused'}</p></div>
             </div>
             <div className="space-y-3">
               {auditReport.reused.map(i => (
                 <div key={i.id} onClick={(e) => openEditModal(i, e)} className="bg-white dark:bg-surface-dark p-5 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-primary border border-transparent transition-all">
                   <div className="flex items-center gap-3"><div className="size-8 bg-red-100 dark:bg-red-500/10 rounded-lg flex items-center justify-center text-red-500"><span className="material-symbols-outlined text-sm">repeat</span></div><span className="font-black text-sm">{i.name}</span></div>
                   <span className="text-[10px] font-black text-red-500 uppercase tracking-widest group-hover:underline">Fix Now</span>
                 </div>
               ))}
               {auditReport.reused.length === 0 && <p className="text-sm text-slate-400 font-bold text-center py-4">Great! No reused passwords.</p>}
             </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-[3rem] shadow-sm flex flex-col gap-8">
             <div className="flex justify-between items-center">
                <div className="size-16 bg-amber-500 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-amber-500/20"><span className="material-symbols-outlined text-4xl">lock_open</span></div>
                <div className="text-right"><p className="text-4xl font-black text-amber-600">{auditReport.weak.length}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'vi' ? 'Yếu' : 'Weak'}</p></div>
             </div>
             <div className="space-y-3">
               {auditReport.weak.map(i => (
                 <div key={i.id} onClick={(e) => openEditModal(i, e)} className="bg-white dark:bg-surface-dark p-5 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-primary border border-transparent transition-all">
                   <div className="flex items-center gap-3"><div className="size-8 bg-amber-100 dark:bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500"><span className="material-symbols-outlined text-sm">shield</span></div><span className="font-black text-sm">{i.name}</span></div>
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest group-hover:underline">Improve</span>
                 </div>
               ))}
               {auditReport.weak.length === 0 && <p className="text-sm text-slate-400 font-bold text-center py-4">Awesome! All passwords are strong.</p>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const GeneratorPage = () => (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      <h1 className="text-5xl font-black tracking-tight">{t.genTitle}</h1>
      <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 lg:p-14 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-indigo-500" />
        
        <div className="bg-slate-50 dark:bg-background-dark p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 mb-14">
          <span className="text-4xl font-mono text-primary font-black tracking-[0.2em] break-all leading-tight text-center md:text-left">{genPass || "********"}</span>
          <div className="flex gap-3 shrink-0">
            <button onClick={generatePassword} className="size-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:text-primary transition-all hover:rotate-180 duration-500"><span className="material-symbols-outlined text-3xl">refresh</span></button>
            <button onClick={() => handleCopy(genPass)} className="size-16 bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"><span className="material-symbols-outlined text-3xl">content_copy</span></button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
           <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.length}</p><p className="text-4xl font-black text-slate-900 dark:text-white">{genLength}</p></div>
              </div>
              <input type="range" min="8" max="64" value={genLength} onChange={e => setGenLength(parseInt(e.target.value))} className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary" />
              <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest"><span>8 chars</span><span>64 chars</span></div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setIncludeSymbols(!includeSymbols)} className={`flex flex-col gap-4 p-6 rounded-[2rem] border-2 transition-all text-left ${includeSymbols ? 'bg-primary/5 border-primary text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                <span className="material-symbols-outlined text-3xl">{includeSymbols ? 'check_circle' : 'circle'}</span>
                <span className="text-sm font-black uppercase tracking-widest">{t.includeSymbols}</span>
              </button>
              <button onClick={() => setIncludeNumbers(!includeNumbers)} className={`flex flex-col gap-4 p-6 rounded-[2rem] border-2 transition-all text-left ${includeNumbers ? 'bg-primary/5 border-primary text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                <span className="material-symbols-outlined text-3xl">{includeNumbers ? 'check_circle' : 'circle'}</span>
                <span className="text-sm font-black uppercase tracking-widest">{t.includeNumbers}</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>
      <div className="space-y-1">
        <input className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder={t.emailAddress} type="email" required />
      </div>
      <div className="space-y-1">
        <input className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder={t.password} type="password" required />
      </div>
      <button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-100 transition-all uppercase tracking-[0.2em] text-sm">{t.login}</button>
      <div className="flex flex-col gap-4 text-xs font-black uppercase tracking-widest text-slate-400 pt-4">
        <button type="button" onClick={() => setCurrentPage('forgot-password')} className="hover:text-primary transition-colors">{t.forgotPassword}</button>
        <p className="normal-case font-bold">{t.noAccount} <button type="button" onClick={() => setCurrentPage('register')} className="text-primary font-black uppercase tracking-widest">{t.signUp}</button></p>
      </div>
    </form>
  );

  const RegisterPage = () => (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setCurrentPage('confirm-email'); }}>
      <input className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder={t.fullName} required />
      <input className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder={t.emailAddress} type="email" required />
      <input className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-6 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder={t.password} type="password" required />
      <button type="submit" className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-100 transition-all uppercase tracking-[0.2em] text-sm mt-4">{t.createAccount}</button>
      <p className="text-xs font-bold text-slate-400 pt-4">{t.alreadyMember} <button type="button" onClick={() => setCurrentPage('login')} className="text-primary font-black uppercase tracking-widest ml-1">{t.login}</button></p>
    </form>
  );

  // Added missing component implementation
  const NotificationsPage = () => (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      <div className="flex justify-between items-end px-2">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tight">{t.notifTitle}</h1>
          <p className="text-slate-500 text-xl font-medium">{t.notifDesc}</p>
        </div>
        <button className="text-xs font-black text-primary hover:underline uppercase tracking-widest">{t.markAllRead}</button>
      </div>
      
      <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl p-10 lg:p-20 text-center space-y-8">
        <div className="size-32 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-6xl opacity-30">notifications_off</span>
        </div>
        <div className="space-y-2">
          <p className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">{t.caughtUp}</p>
          <p className="text-slate-500 font-medium">{lang === 'vi' ? 'Bạn không có thông báo mới nào.' : 'You have no new notifications at the moment.'}</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentPage) {
      case 'login': return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] size-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-20%] size-[60%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[3rem] shadow-2xl p-10 lg:p-14 border border-slate-100 dark:border-slate-800 z-10 animate-in fade-in slide-in-from-bottom-10 duration-700 text-center">
            <div className="size-20 rounded-[1.75rem] bg-primary mx-auto mb-8 flex items-center justify-center text-white shadow-2xl shadow-primary/40"><span className="material-symbols-outlined text-4xl">shield_lock</span></div>
            <h2 className="text-3xl font-black mb-10 tracking-tight">SecurePass</h2>
            <LoginPage />
            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-center"><LanguageSwitcher /></div>
          </div>
        </div>
      );
      case 'register': return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex items-center justify-center p-6 relative">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-[3rem] shadow-2xl p-10 lg:p-14 border border-slate-100 dark:border-slate-800 z-10 text-center">
            <h2 className="text-3xl font-black mb-10 tracking-tight">{t.createAccount}</h2>
            <RegisterPage />
          </div>
        </div>
      );
      case 'dashboard': return <DashboardLayout><DashboardPage /></DashboardLayout>;
      case 'all-items': return <DashboardLayout><AllItemsPage title={t.allItems} /></DashboardLayout>;
      case 'favorites': return <DashboardLayout><AllItemsPage title={t.favorites} /></DashboardLayout>;
      case 'generator': return <DashboardLayout><GeneratorPage /></DashboardLayout>;
      case 'audit': return <DashboardLayout><AuditPage /></DashboardLayout>;
      case 'settings': return <DashboardLayout><div className="max-w-4xl mx-auto space-y-12 py-6"><h1 className="text-5xl font-black tracking-tight">{t.personalInfo}</h1><div className="bg-white dark:bg-surface-dark rounded-[3.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl p-10 lg:p-14 space-y-12"><div className="flex items-center gap-10"><div className="size-40 rounded-[2.5rem] bg-cover bg-center border-8 border-white dark:border-slate-800 shadow-2xl" style={{ backgroundImage: `url(${USER.avatar})` }}></div><div className="space-y-2"><h3 className="text-2xl font-black">{t.profilePhoto}</h3><p className="text-slate-500 font-medium">PNG or JPG, max 5MB.</p><button className="text-sm font-black text-primary uppercase tracking-widest mt-2 hover:underline">{t.changePhoto}</button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t.firstName}</label><input className="w-full h-14 bg-slate-50 dark:bg-background-dark border-none rounded-2xl px-6 text-sm font-medium" defaultValue="Alex" /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t.lastName}</label><input className="w-full h-14 bg-slate-50 dark:bg-background-dark border-none rounded-2xl px-6 text-sm font-medium" defaultValue="Morgan" /></div><div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t.emailAddress}</label><input className="w-full h-14 bg-slate-50 dark:bg-background-dark border-none rounded-2xl px-6 text-sm font-medium opacity-50 cursor-not-allowed" defaultValue={USER.email} disabled /></div></div><div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4"><button className="h-14 px-8 text-sm font-black uppercase tracking-widest text-slate-400">{t.cancel}</button><button onClick={() => showToast('Saved!')} className="h-14 px-12 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-100 transition-all">{t.saveChanges}</button></div></div></div></DashboardLayout>;
      case 'notifications': return <DashboardLayout><NotificationsPage /></DashboardLayout>;
      default: return <DashboardLayout><DashboardPage /></DashboardLayout>;
    }
  };

  return <div className="min-h-screen selection:bg-primary/20 selection:text-primary">{renderContent()}</div>;
};

export default App;
