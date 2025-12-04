import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Users, 
  Calendar, 
  Gift, 
  Bell, 
  Plus, 
  Trash2, 
  AlertCircle,
  RefreshCw,
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trophy
} from 'lucide-react';

// --- Types ---

// Simplified Member type with fixed avatar (emoji)
interface Member {
  id: string;
  name: string;
  number: string;
  avatar: string; // Emoji character
}

interface Group {
  id: string;
  name: string;
  members: Member[];
}

// Grouped Win type: One prize/sponsor can have multiple winning numbers
interface WinGroup {
  numbers: string[];
  prize: string;
  sponsor: string;
}

interface DayData {
  day: number;
  winGroups: WinGroup[];
}

interface NotificationLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'win' | 'info';
}

// --- Constants & Utilities ---

const LIONS_URL = "https://www.lionsclub-badduerkheim.de/adventskalender/gewinne-2025";

const CHRISTMAS_AVATARS = [
  '🎅', '🤶', '🦌', '⛄', '🍪', 
  '🎄', '🎁', '🔔', '🕯️', '👼'
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'My Family',
    members: [
      { id: 'm1', name: 'Dad', number: '1234', avatar: '🎅' },
      { id: 'm2', name: 'Mom', number: '5678', avatar: '🤶' },
    ]
  }
];

// --- Services ---

const UrlService = {
  serialize: (groups: Group[]): string => {
    try {
      const json = JSON.stringify(groups);
      return btoa(encodeURIComponent(json));
    } catch (e) {
      console.error("Failed to serialize", e);
      return "";
    }
  },
  deserialize: (hash: string): Group[] | null => {
    try {
      if (!hash || !hash.startsWith('#data=')) return null;
      const base64 = hash.replace('#data=', '');
      const json = decodeURIComponent(atob(base64));
      // Basic migration for old data structure if needed, or just let it fail safely
      const parsed = JSON.parse(json);
      // Validate structure roughly
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].members) {
        // Map old members to new structure if avatar is missing
        parsed.forEach((g: any) => {
            g.members.forEach((m: any) => {
                if (!m.avatar) m.avatar = '🎅';
            });
        });
        return parsed;
      }
      return null;
    } catch (e) {
      console.error("Failed to deserialize URL data", e);
      return null;
    }
  }
};

const StorageService = {
  loadGroups: (): Group[] => {
    if (window.location.hash.startsWith('#data=')) {
      const fromUrl = UrlService.deserialize(window.location.hash);
      if (fromUrl) return fromUrl;
    }
    try {
      // Changed key to v2 to avoid conflicts with old complex avatar data
      const saved = localStorage.getItem('lions_groups_v2'); 
      return saved ? JSON.parse(saved) : INITIAL_GROUPS;
    } catch (e) { return INITIAL_GROUPS; }
  },
  saveGroups: (groups: Group[]) => {
    try {
      localStorage.setItem('lions_groups_v2', JSON.stringify(groups));
    } catch (e) { console.error("Failed to save groups", e); }
  },
  loadWins: (): DayData[] => {
    try {
      // Changed key to v3 for grouped win structure
      const saved = localStorage.getItem('lions_wins_v3');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  },
  saveWins: (wins: DayData[]) => {
    localStorage.setItem('lions_wins_v3', JSON.stringify(wins));
  }
};

// --- Components ---

const Header = () => (
  <header className="bg-christmas-red text-white shadow-lg sticky top-0 z-50">
    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-full">
          <Gift className="w-6 h-6 text-christmas-gold" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-bold leading-tight">Lions Advent Checker</h1>
          <p className="text-xs text-red-100 opacity-90">Bad Dürkheim Edition</p>
        </div>
      </div>
      <div className="text-xs hidden sm:block bg-black/20 px-3 py-1 rounded-full">
        v2025.5.1
      </div>
    </div>
  </header>
);

const MemberAvatar: React.FC<{ 
  avatar: string;
  className?: string; 
}> = ({ 
  avatar,
  className = "w-10 h-10 text-2xl" 
}) => (
  <div className={`flex items-center justify-center rounded-full border-2 border-white shadow-sm bg-slate-50 select-none ${className}`}>
    {avatar}
  </div>
);

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const DayCard: React.FC<{
  day: number;
  data?: DayData;
  groups: Group[];
}> = ({ day, data, groups }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  
  // Flatten members for easy lookup
  const allMembers = useMemo(() => groups.flatMap(g => g.members), [groups]);

  // Find if a specific win group has any of our members
  const getWinnersForGroup = useCallback((winGroup: WinGroup) => {
    return allMembers.filter(m => winGroup.numbers.includes(m.number));
  }, [allMembers]);

  // Find if the entire day has any winners to highlight the card
  const overallWinners = useMemo(() => {
    if (!data) return [];
    const winners: Member[] = [];
    data.winGroups.forEach(group => {
       const matched = getWinnersForGroup(group);
       winners.push(...matched);
    });
    return winners;
  }, [data, getWinnersForGroup]);

  // Initialize slide to show a winner if present
  useEffect(() => {
    if (data && data.winGroups.length > 0) {
      const winningGroupIndex = data.winGroups.findIndex(group => 
        getWinnersForGroup(group).length > 0
      );
      if (winningGroupIndex !== -1) {
        setSlideIndex(winningGroupIndex);
      }
    }
  }, [data, getWinnersForGroup]);

  const winGroups = data?.winGroups || [];
  const currentGroup = winGroups[slideIndex];
  
  const winnersForCurrentSlide = currentGroup ? getWinnersForGroup(currentGroup) : [];
  const isWinningSlide = winnersForCurrentSlide.length > 0;
  const hasMultiple = winGroups.length > 1;

  // Sorting numbers for display: User matches first, then numerical
  const displayNumbers = useMemo(() => {
    if (!currentGroup) return [];
    return [...currentGroup.numbers].sort((a, b) => {
      const isAMatch = allMembers.some(m => m.number === a);
      const isBMatch = allMembers.some(m => m.number === b);
      if (isAMatch && !isBMatch) return -1;
      if (!isAMatch && isBMatch) return 1;
      return a.localeCompare(b);
    });
  }, [currentGroup, allMembers]);

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev + 1) % winGroups.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev - 1 + winGroups.length) % winGroups.length);
  };

  return (
    <div 
      className={`relative min-h-[170px] p-3 rounded-xl border transition-all duration-300 flex flex-col group overflow-hidden
        ${overallWinners.length > 0 
          ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-md transform scale-105 z-10' 
          : data 
            ? 'bg-white border-slate-200 hover:border-christmas-red/30 hover:shadow-md' 
            : 'bg-slate-50 border-slate-100 opacity-60'}
      `}
    >
      {/* Header: Day Number */}
      <div className="flex justify-between items-start mb-2 z-20 relative">
        <span className={`text-xl font-serif font-bold ${overallWinners.length > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
          {day}
        </span>
        {isWinningSlide && <Trophy className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />}
        {data && !isWinningSlide && overallWinners.length > 0 && (
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Win on another slide"></div>
        )}
      </div>

      {data ? (
        <div className="flex-1 flex flex-col relative z-20">
          {/* Win Content */}
          <div className="flex-1 flex flex-col min-h-[90px]">
             <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1 truncate">
                  {currentGroup.sponsor}
                </p>
                <p className={`text-xs font-medium leading-tight line-clamp-3 mb-2 ${isWinningSlide ? 'text-amber-800' : 'text-slate-700'}`}>
                  {currentGroup.prize}
                </p>
             </div>
             
             {/* Winning Numbers Grid - ONE ROW ONLY */}
             <div className="mt-auto h-6 overflow-hidden">
               <div className="flex flex-nowrap gap-1">
                  {displayNumbers.map((num) => {
                    const isMatch = allMembers.some(m => m.number === num);
                    return (
                      <div key={num} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0
                        ${isMatch 
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                          : 'bg-slate-50 text-slate-500 border-slate-100'}
                      `}>
                        {num}
                      </div>
                    );
                  })}
               </div>
             </div>
          </div>

          {/* Carousel Controls */}
          {hasMultiple && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100/50">
               <button onClick={prevSlide} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
                 <ChevronLeft className="w-3 h-3" />
               </button>
               <span className="text-[9px] text-slate-300 font-mono">
                 {slideIndex + 1}/{winGroups.length}
               </span>
               <button onClick={nextSlide} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
                 <ChevronRight className="w-3 h-3" />
               </button>
            </div>
          )}

          {/* Winner Avatars */}
          {winnersForCurrentSlide.length > 0 && (
            <div className="absolute -bottom-1 right-0 flex -space-x-2">
              {winnersForCurrentSlide.map(w => (
                <MemberAvatar 
                  key={w.id} 
                  avatar={w.avatar} 
                  className="w-8 h-8 text-lg border-2 border-white shadow-sm bg-white" 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="mt-auto flex justify-center pb-2 opacity-30">
          <Gift className="w-6 h-6 text-slate-300" />
        </div>
      )}

      {/* Background decoration for winning slides */}
      {isWinningSlide && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 via-transparent to-transparent pointer-events-none z-0" />
      )}
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'groups'>('dashboard');
  const [groups, setGroups] = useState<Group[]>([]);
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'real' | 'simulated' | 'none'>('none');
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Load Data
  useEffect(() => {
    setGroups(StorageService.loadGroups());
    setDayData(StorageService.loadWins());
    
    const lastTime = localStorage.getItem('lions_last_check');
    if (lastTime && lastTime !== 'Invalid Date') {
       try { setLastChecked(new Date(lastTime)); } catch(e) {}
    }
    
    const savedSource = localStorage.getItem('lions_data_source');
    if (savedSource) setDataSource(savedSource as any);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save Data
  useEffect(() => { StorageService.saveGroups(groups); }, [groups]);
  useEffect(() => { StorageService.saveWins(dayData); }, [dayData]);
  useEffect(() => { 
    if(dataSource) localStorage.setItem('lions_data_source', dataSource); 
  }, [dataSource]);

  const requestNotify = useCallback(async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support notifications.");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch (e) {
      console.error("Notification permission error", e);
    }
  }, []);

  const sendNotification = (title: string, body: string) => {
    if (permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/614/614145.png' 
        });
      } catch (e) {
        console.error("Notification send error", e);
      }
    }
  };

  const copyShareLink = () => {
    const serialized = UrlService.serialize(groups);
    const url = `${window.location.origin}${window.location.pathname}#data=${serialized}`;
    
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard! You can share this URL with your family.");
    }).catch(() => {
      prompt("Copy this link to share:", url);
    });
  };

  // --- Scraper Logic ---

  const parseWinsFromHtml = (html: string): DayData[] => {
    const results: DayData[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const dayNodes = doc.querySelectorAll('.gewinntag');
    
    dayNodes.forEach(dayNode => {
      const h2 = dayNode.querySelector('h2');
      if (!h2) return;
      const dateMatch = h2.innerText.match(/(\d+)\./);
      if (!dateMatch) return;
      const day = parseInt(dateMatch[1]);
      
      const dayWinGroups: WinGroup[] = [];
      
      const sponsorDivs = dayNode.querySelectorAll('.bg-primary.row');
      
      sponsorDivs.forEach(sponsorDiv => {
        let sponsorName = 'Unknown Sponsor';
        
        // 1. Try extracting from H4 directly (Best Method)
        const h4 = sponsorDiv.querySelector('h4');
        if (h4 && h4.textContent) {
             const text = h4.textContent;
             const match = text.match(/Sponsor:\s*(.*)/i);
             if (match) {
                 sponsorName = match[1].trim();
             } else {
                 sponsorName = text.trim();
             }
        } 
        // 2. Fallback to div text if H4 fails or structure changes
        else {
             const sponsorText = sponsorDiv.textContent || '';
             const sponsorMatch = sponsorText.match(/Sponsor:\s*(.*?)(Sponsor anzeigen|$)/i);
             if (sponsorMatch) {
                 sponsorName = sponsorMatch[1].trim();
             }
        }
        
        // Cleanup trailing "Sponsor anzeigen" if it leaked in
        if (sponsorName.toLowerCase().endsWith('sponsor anzeigen')) {
             sponsorName = sponsorName.substring(0, sponsorName.length - 'sponsor anzeigen'.length).trim();
        }

        let nextEl = sponsorDiv.nextElementSibling;
        while(nextEl) {
           if (nextEl.tagName === 'TABLE') break;
           if (nextEl.classList.contains('bg-primary')) {
             nextEl = null; 
             break; 
           }
           nextEl = nextEl.nextElementSibling;
        }

        if (nextEl && nextEl.tagName === 'TABLE') {
          const rows = nextEl.querySelectorAll('tbody tr');
          rows.forEach(tr => {
            const nrTd = tr.querySelector('.nr');
            const allTds = tr.querySelectorAll('td');
            
            let prizeTd: Element | null = null;
            allTds.forEach(td => {
              if (!td.classList.contains('nr')) prizeTd = td;
            });

            if (nrTd && prizeTd) {
               const numberRaw = nrTd.textContent?.trim() || '';
               const prizeRaw = prizeTd.textContent?.trim() || '';
               const number = numberRaw.replace(/\s+/g, '');
               const prize = prizeRaw.replace(/\s+/g, ' ');

               if (number && prize) {
                 // Grouping Logic: Check if we already have a group for this sponsor + prize
                 const existingGroup = dayWinGroups.find(
                   g => g.sponsor === sponsorName && g.prize === prize
                 );

                 if (existingGroup) {
                   existingGroup.numbers.push(number);
                 } else {
                   dayWinGroups.push({
                     sponsor: sponsorName,
                     prize: prize,
                     numbers: [number]
                   });
                 }
               }
            }
          });
        }
      });

      if (dayWinGroups.length > 0) {
        results.push({ day, winGroups: dayWinGroups });
      }
    });
    
    return results.sort((a,b) => a.day - b.day);
  };

  const generateSimulationData = () => {
    const newWins: DayData[] = [];
    const today = new Date().getDate(); 
    const isDec = new Date().getMonth() === 11;
    const limit = isDec ? Math.min(today, 24) : 24;
    
    const flatMembers = groups.flatMap(g => g.members);
    const randomMember = flatMembers[Math.floor(Math.random() * flatMembers.length)];
    
    for (let i = 1; i <= limit; i++) {
      const winsForDay: WinGroup[] = [];
      const numPrizes = Math.floor(Math.random() * 2) + 1;

      for (let p=0; p<numPrizes; p++) {
         const numbers = [];
         // Generate multiple winners for this prize
         for(let k=0; k<5; k++) {
            numbers.push(Math.floor(1000 + Math.random() * 9000).toString());
         }

         // Inject user win
         const isUserWin = randomMember && i === limit && p === 0;
         if (isUserWin) {
            numbers.push(randomMember.number);
         }

         winsForDay.push({
            numbers: numbers,
            prize: `(Demo) ${['Wellness Voucher', 'Wine Box', 'Shopping Card', 'Dinner for Two'][p % 4]} €${(i * 5) + 20}`,
            sponsor: ['Local Bakery', 'Wine Estate', 'Grand Hotel', 'Bookstore'][p % 4]
         });
      }
      
      newWins.push({
        day: i,
        winGroups: winsForDay
      });
    }
    return newWins;
  };

  const checkWebsite = async (forceSimulate = false) => {
    setLoading(true);
    setScrapeError(null);
    const newNotifications: NotificationLog[] = [];
    let isSimulating = forceSimulate;
    let newDayData: DayData[] = [];

    try {
      if (!isSimulating) {
        try {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(LIONS_URL)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Failed to fetch via proxy");
          
          const htmlText = await response.text();
          if (!htmlText) throw new Error("Empty response");

          newDayData = parseWinsFromHtml(htmlText);

          if (newDayData.length === 0) {
             throw new Error("No numbers found. HTML structure might have changed.");
          }
          setDataSource('real');
        } catch (err: any) {
          console.warn("Real scrape failed:", err);
          setScrapeError(err.message || "Connection failed");
          isSimulating = true; 
        }
      }

      if (isSimulating) {
        setDataSource('simulated');
        if (!forceSimulate) await new Promise(r => setTimeout(r, 800));
        else await new Promise(r => setTimeout(r, 1000));
        newDayData = generateSimulationData();
      }

      setDayData(newDayData);
      setLastChecked(new Date());
      localStorage.setItem('lions_last_check', new Date().toISOString());

      // Check Matches & Notify
      const allMembers = groups.flatMap(g => g.members);
      newDayData.forEach(day => {
         day.winGroups.forEach(group => {
            const winningNumbers = group.numbers;
            const winners = allMembers.filter(m => winningNumbers.includes(m.number));
            winners.forEach(member => {
               const winId = `${member.id}-${day.day}-${member.number}`;
               const alreadyNotified = notifications.some(n => n.id === winId);
               
               if (!alreadyNotified) {
                 const msg = `🎉 ${member.name} won on Day ${day.day}: ${group.prize}`;
                 newNotifications.push({
                   id: winId,
                   timestamp: Date.now(),
                   type: 'win',
                   message: msg
                 });
                 sendNotification("Lions Club Win!", msg);
               }
            });
         });
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Views ---

  const Dashboard = () => (
    <div className="space-y-8">
      {/* Status Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-christmas-red" />
                Calendar Status
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">
                  Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
                </span>
                {dataSource === 'real' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium border border-green-200">
                    Live Data
                  </span>
                )}
                {dataSource === 'simulated' && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                    Demo Mode
                  </span>
                )}
              </div>
              {scrapeError && dataSource === 'simulated' && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Note: {scrapeError}. Showing demo data.
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {permission !== 'granted' && (
                <button 
                  onClick={requestNotify}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-slate-600 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm"
                >
                  <Bell className="w-4 h-4" /> Enable Alerts
                </button>
              )}
              <button 
                onClick={() => checkWebsite(false)}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Check Now
              </button>
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
             <p className="text-xs text-slate-400">
               <span className="font-semibold text-slate-600">Share your setup:</span> Copy the link below to share your groups.
             </p>
             <button onClick={copyShareLink} className="text-xs flex items-center gap-1 text-christmas-red font-medium hover:underline">
               <Share2 className="w-3 h-3" /> Copy Link
             </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Latest Wins</h3>
          {notifications.slice(0, 3).map(n => (
            <div key={n.id} className="p-4 rounded-lg flex gap-3 bg-amber-50 border border-amber-200 shadow-sm">
              <div className="mt-1 p-1 rounded-full bg-amber-200 text-amber-700">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-800 font-medium text-sm">{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(n.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div>
        <h3 className="text-xl font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-christmas-red" />
          December 2025
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 24 }, (_, i) => i + 1).map(day => {
            const data = dayData.find(d => d.day === day);
            return (
              <DayCard 
                key={day} 
                day={day} 
                data={data} 
                groups={groups} 
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  const GroupsView = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('🎅');

    const addGroup = () => {
      const name = prompt("Enter new group name:");
      if (name) setGroups([...groups, { id: generateId(), name, members: [] }]);
    };

    const deleteGroup = (id: string) => {
      if (confirm("Delete group?")) setGroups(groups.filter(g => g.id !== id));
    };

    const handleAddMember = (groupId: string) => {
      if (!newName || !newNumber) return;
      const member: Member = {
        id: generateId(),
        name: newName,
        number: newNumber,
        avatar: selectedAvatar
      };
      setGroups(groups.map(g => g.id === groupId ? { ...g, members: [...g.members, member] } : g));
      resetForm();
    };

    const resetForm = () => {
      setNewName(''); setNewNumber(''); setEditingId(null);
      setSelectedAvatar('🎅');
    };

    const removeMember = (groupId: string, memberId: string) => {
      setGroups(groups.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g));
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-serif text-slate-800">Managed Groups</h2>
          <button onClick={addGroup} className="flex items-center gap-2 text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>

        {groups.map(group => (
          <Card key={group.id} className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{group.name}</h3>
                  <p className="text-xs text-slate-500">{group.members.length} members</p>
                </div>
              </div>
              <button onClick={() => deleteGroup(group.id)} className="text-slate-300 hover:text-red-500 transition">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition">
                  <MemberAvatar 
                    avatar={member.avatar}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-slate-900 truncate text-sm">{member.name}</p>
                      <button onClick={() => removeMember(group.id, member.id)} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-xs">
                        #{member.number}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className={`rounded-lg border-2 border-dashed border-slate-200 overflow-hidden transition-all ${editingId === group.id ? 'bg-white border-christmas-gold col-span-1 md:col-span-2 lg:col-span-3' : 'hover:border-slate-300 hover:bg-slate-50 min-h-[80px]'}`}>
                {editingId === group.id ? (
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-700">Add New Member</h4>
                      <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <input 
                          placeholder="Name (e.g. Grandma)" 
                          className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-christmas-gold outline-none bg-white text-slate-900 placeholder:text-slate-400"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          autoFocus
                        />
                        <input 
                          placeholder="Ticket Number (e.g. 1234)" 
                          className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-christmas-gold outline-none bg-white text-slate-900 placeholder:text-slate-400"
                          value={newNumber}
                          onChange={e => setNewNumber(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-2 block">Choose Avatar</label>
                          <div className="flex gap-2 flex-wrap">
                            {CHRISTMAS_AVATARS.map(avatar => (
                              <button
                                key={avatar}
                                onClick={() => setSelectedAvatar(avatar)}
                                className={`w-10 h-10 flex items-center justify-center text-xl rounded-full border shadow-sm transition-transform bg-slate-50 hover:bg-white
                                  ${selectedAvatar === avatar ? 'ring-2 ring-christmas-red scale-110 border-christmas-red' : 'border-slate-200'}
                                `}
                              >
                                {avatar}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100 mt-2">
                           <MemberAvatar avatar={selectedAvatar} />
                           <span className="text-xs text-slate-400">Preview</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button onClick={() => handleAddMember(group.id)} className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm">
                        Save Member
                      </button>
                      <button onClick={resetForm} className="flex-1 bg-slate-100 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-200">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEditingId(group.id)} className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 py-4">
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-medium">Add Member</span>
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen snow-bg font-sans pb-20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
           <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-full max-w-sm">
            {[
              { id: 'dashboard', label: 'Calendar', icon: Calendar },
              { id: 'groups', label: 'Members', icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
                  ${activeTab === tab.id 
                    ? 'bg-christmas-red text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'dashboard' ? <Dashboard /> : <GroupsView />}
        </div>
      </main>

      <footer className="text-center text-slate-400 text-xs py-8 border-t border-slate-200 mt-8 mx-4">
        <p>Lions Club Checker Tool • Not affiliated with Lions Club Bad Dürkheim</p>
        <a 
          href={LIONS_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-christmas-red hover:underline font-medium"
        >
          Visit Official Calendar <ExternalLink className="w-3 h-3" />
        </a>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);