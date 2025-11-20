import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, CheckSquare, List, BarChart2, Plus, 
  ArrowUp, ArrowDown, Clock, AlertCircle, CheckCircle, 
  Zap, ChevronRight, ChevronDown, Target,
  RefreshCw, MessageSquare, Trash2, X, Edit2, Save,
  Calendar, Home, Minus, Inbox, Lightbulb, PenTool, Square,
  MoreHorizontal, LayoutGrid, Star, Activity, Battery,
  Database
} from 'lucide-react';

// --- Types & Interfaces ---

type TaskType = 'strategic' | 'normal' | 'routine';
type TaskStatus = 'todo' | 'done';
type Phase = 'plan-strategy' | 'plan-queue' | 'do' | 'check';

interface Kpi {
  id: number;
  title: string;
  isExpanded: boolean;
  progress?: number;
}

interface Kgi {
  id: number;
  title: string;
  deadline: string;
  isExpanded: boolean;
  kpis: Kpi[];
}

interface Task {
  id: number;
  kgiId: number | null;
  kpiId: number | null;
  title: string;
  type: TaskType;
  status: TaskStatus;
  estimate: number;
  isContinuous: boolean;
}

interface Routine {
  id: number | string;
  title: string;
  timing: 'morning' | 'night';
  done: boolean;
}

interface KdiLog {
  taskId: number;
  quality: number;
  focus: number;
  fatigue: number;
}

interface CheckData {
  problemLogs: any[];
  keepLogs: any[];
  kdiLogs: KdiLog[];
}

interface AppData {
  kgis: Kgi[];
  tasks: Task[];
  routines: Routine[];
  todayTasks: Task[];
  checkData: CheckData;
  currentPhase: Phase;
}

// Checkフェーズで使用する拡張タスク型
interface AnalysisItem extends Task {
  issue: string;
  analysisKind: 'problem' | 'success';
  logData?: KdiLog; // オプショナル型として定義
}

// --- Constants ---

const STORAGE_KEY = 'pdca-todo-app-v1';

const TASK_TYPES: Record<string, TaskType> = {
  STRATEGIC: 'strategic',
  NORMAL: 'normal',
  ROUTINE: 'routine',
};

interface Factor {
  id: string;
  label: string;
  detail: string;
}

// --- Empty Data (Reset State) ---

const emptyData: AppData = {
  kgis: [],
  tasks: [],
  routines: [],
  todayTasks: [],
  checkData: {
    problemLogs: [], 
    keepLogs: [],    
    kdiLogs: [],     
  },
  currentPhase: 'plan-strategy', 
};

// --- Components ---

interface SidebarProps {
  currentPhase: Phase;
  setPhase: (phase: Phase) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPhase, setPhase }) => {
  const menuItems: { id: Phase; icon: React.ElementType; label: string }[] = [
    { id: 'plan-strategy', icon: Target, label: 'Strategy Plan' },
    { id: 'plan-queue', icon: List, label: 'Task Queue' },
    { id: 'do', icon: Play, label: 'Do Phase' },
    { id: 'check', icon: CheckSquare, label: 'Check' },
  ];

  return (
    <div className="w-64 bg-gray-50 h-screen border-r border-gray-200 flex flex-col shrink-0 z-20 relative">
      <div className="p-6">
        <h1 className="font-bold text-xl text-gray-800 tracking-tight flex items-center gap-2">
           <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center text-white text-xs">P</div>
           PDCATodo
        </h1>
        <p className="text-xs text-gray-500 mt-1">Minimalist PDCA Cycle</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPhase(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPhase === item.id
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 text-[10px] text-gray-400 text-center border-t border-gray-100">
        Auto-saved to LocalStorage <Database size={10} className="inline ml-1"/>
      </div>
    </div>
  );
};

// --- Phase: Plan Strategy ---

interface PhaseProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  setPhase?: (phase: Phase) => void; // setPhase is optional for some components
}

const PlanStrategy: React.FC<PhaseProps> = ({ data, setData }) => {
  
  const addKgi = () => {
    const newKgi: Kgi = {
      id: Date.now(),
      title: '新しい目標 (KGI)',
      deadline: '',
      isExpanded: true,
      kpis: [{ id: Date.now() + 1, title: '', isExpanded: true }]
    };
    setData({ ...data, kgis: [...data.kgis, newKgi] });
  };

  const toggleKgi = (id: number) => {
    setData({
      ...data,
      kgis: data.kgis.map(k => k.id === id ? { ...k, isExpanded: !k.isExpanded } : k)
    });
  };

  // KPIの開閉トグル
  const toggleKpi = (kgiId: number, kpiId: number) => {
    setData({
      ...data,
      kgis: data.kgis.map(k => 
        k.id === kgiId 
        ? { ...k, kpis: k.kpis.map(kp => kp.id === kpiId ? { ...kp, isExpanded: !kp.isExpanded } : kp) }
        : k
      )
    });
  };

  const updateKgi = (id: number, field: keyof Kgi, value: any) => {
    setData({
      ...data,
      kgis: data.kgis.map(k => k.id === id ? { ...k, [field]: value } : k)
    });
  };

  const addKpi = (kgiId: number) => {
    const newKpi: Kpi = { id: Date.now(), title: '', isExpanded: true };
    setData({
      ...data,
      kgis: data.kgis.map(k => k.id === kgiId ? { ...k, kpis: [...k.kpis, newKpi] } : k)
    });
  };

  const updateKpi = (kgiId: number, kpiId: number, field: keyof Kpi, value: any) => {
    setData({
      ...data,
      kgis: data.kgis.map(k => 
        k.id === kgiId 
        ? { ...k, kpis: k.kpis.map(kp => kp.id === kpiId ? { ...kp, [field]: value } : kp) } 
        : k
      )
    });
  };

  const deleteKpi = (kgiId: number, kpiId: number) => {
    setData({
      ...data,
      kgis: data.kgis.map(k => 
        k.id === kgiId 
        ? { ...k, kpis: k.kpis.filter(kp => kp.id !== kpiId) } 
        : k
      )
    });
  };

  const addStrategyTask = (kgiId: number, kpiId: number | null = null) => {
    const newTask: Task = {
      id: Date.now(),
      kgiId: kgiId,
      kpiId: kpiId,
      title: '',
      type: 'strategic',
      status: 'todo',
      estimate: 60,
      isContinuous: true
    };
    setData({ ...data, tasks: [...data.tasks, newTask] });
  };

  const deleteKgi = (id: number, e: React.MouseEvent) => {
     e.stopPropagation(); 
     if(window.confirm("この目標(KGI)と関連するKPI・タスクをすべて削除しますか？")) {
        setData({
            ...data,
            kgis: data.kgis.filter(k => k.id !== id),
            tasks: data.tasks.filter(t => t.kgiId !== id)
        });
     }
  };

  return (
    // max-w-7xl に拡大して画面全体を活用
    <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-24">
      <header className="mb-8 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Strategic Planning</h2>
          <p className="text-gray-500 mt-1">全体を俯瞰し、ゴール(KGI)と中間目標(KPI)を設計します。</p>
        </div>
        <button onClick={addKgi} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-md transition-transform hover:scale-105">
          <Plus size={16} /> New Goal
        </button>
      </header>

      <div className="space-y-10">
        {data.kgis.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                 <Target size={48} className="mb-4 opacity-20" />
                 <p className="text-lg font-medium">目標が設定されていません</p>
                 <p className="text-sm mb-6">まずは "New Goal" ボタンからKGIを設定しましょう</p>
                 <button onClick={addKgi} className="bg-blue-50 text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                     目標を追加する
                 </button>
             </div>
        )}
        {data.kgis.map((kgi, index) => (
          <div key={kgi.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
            <div onClick={() => toggleKgi(kgi.id)} className="bg-gray-50 px-8 py-5 flex justify-between items-center cursor-pointer hover:bg-gray-100 select-none border-b border-gray-200">
              <div className="flex items-center gap-4">
                 <button className="text-gray-400 hover:text-gray-600">
                    {kgi.isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                 </button>
                 <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        <Target size={14} className="text-blue-600" />
                        <span>Goal #{index + 1}</span>
                    </div>
                    <div className="font-bold text-gray-900 text-xl">{kgi.title || '未設定のゴール'}</div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                {kgi.deadline && <span className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 font-medium shadow-sm">Due: {kgi.deadline}</span>}
                <button onClick={(e) => deleteKgi(kgi.id, e)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {kgi.isExpanded && (
                <div className="p-8 bg-white animate-fade-in-up">
                    {/* KGI Form */}
                    <div className="flex flex-wrap gap-8 mb-10 items-end">
                        <div className="flex-1 min-w-[300px]">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">KGI Title (最終目標)</label>
                            <input type="text" value={kgi.title} onClick={(e) => e.stopPropagation()} onChange={(e) => updateKgi(kgi.id, 'title', e.target.value)} className="w-full text-2xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2 transition-colors placeholder-gray-300" placeholder="最終目標を入力..." />
                        </div>
                        <div className="w-48">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Deadline</label>
                            <input type="date" value={kgi.deadline} onClick={(e) => e.stopPropagation()} onChange={(e) => updateKgi(kgi.id, 'deadline', e.target.value)} className="w-full text-sm text-gray-700 border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2.5 transition-colors" />
                        </div>
                    </div>

                    {/* KPI Section Header */}
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <LayoutGrid size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Structure (KPIs & Tasks)</h3>
                        </div>
                        <button onClick={() => addKpi(kgi.id)} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                            <Plus size={16} /> Add KPI
                        </button>
                    </div>

                    {/* KPI Cards Grid: 横並びに変更して俯瞰しやすく */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                         {kgi.kpis.map((kpi, kIdx) => (
                             <div key={kpi.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col">
                                 
                                 {/* KPI Header (Collapsible) */}
                                 <div 
                                    onClick={() => toggleKpi(kgi.id, kpi.id)}
                                    className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-100"
                                 >
                                     <div className="flex justify-between items-start mb-3">
                                        <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded">KPI #{kIdx+1}</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); deleteKpi(kgi.id, kpi.id); }} className="text-gray-300 hover:text-red-400 p-1 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                            <div className="text-gray-400">
                                                {kpi.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                        </div>
                                     </div>
                                     <input 
                                        type="text" 
                                        value={kpi.title}
                                        onClick={(e) => e.stopPropagation()} 
                                        onChange={(e) => updateKpi(kgi.id, kpi.id, 'title', e.target.value)}
                                        placeholder="KPIを入力..."
                                        className="w-full text-lg font-bold text-gray-800 border-none focus:ring-0 p-0 placeholder-gray-300 outline-none bg-transparent"
                                     />
                                 </div>

                                 {/* Linked Tasks Area (Collapsible Content) */}
                                 {kpi.isExpanded && (
                                    <div className="bg-gray-50 p-4 flex-1 flex flex-col animate-fade-in">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                                            <List size={12} /> Tasks
                                        </div>
                                        <div className="space-y-2 flex-1 min-h-[60px]">
                                            {data.tasks.filter(t => t.kgiId === kgi.id && (!t.kpiId || t.kpiId === kpi.id)).map(task => (
                                                <div key={task.id} className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-all group/task">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></div>
                                                    <input 
                                                        type="text"
                                                        value={task.title}
                                                        onChange={(e) => {
                                                            const newTasks = data.tasks.map(t => t.id === task.id ? {...t, title: e.target.value} : t);
                                                            setData({...data, tasks: newTasks});
                                                        }}
                                                        placeholder="タスク名..."
                                                        className="flex-1 outline-none text-sm font-medium text-gray-800 placeholder-gray-300 bg-transparent min-w-0"
                                                    />
                                                    <div className="flex items-center text-[10px] text-gray-400 gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 shrink-0">
                                                        <input 
                                                            type="number"
                                                            value={task.estimate}
                                                            onChange={(e) => {
                                                                const newTasks = data.tasks.map(t => t.id === task.id ? {...t, estimate: parseInt(e.target.value) || 0} : t);
                                                                setData({...data, tasks: newTasks});
                                                            }}
                                                            className="w-6 text-right outline-none bg-transparent font-mono"
                                                        />
                                                        m
                                                    </div>
                                                    <button 
                                                        onClick={() => setData({...data, tasks: data.tasks.filter(t => t.id !== task.id)})}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-opacity p-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => addStrategyTask(kgi.id, kpi.id)}
                                            className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-xs font-bold hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Add Task
                                        </button>
                                    </div>
                                 )}
                             </div>
                         ))}
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Phase: Task Queue ---

const TaskQueue: React.FC<PhaseProps> = ({ data, setData, setPhase }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...data.tasks];
    if (direction === 'up' && index > 0) {
      [newTasks[index], newTasks[index - 1]] = [newTasks[index - 1], newTasks[index]];
    } else if (direction === 'down' && index < newTasks.length - 1) {
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
    }
    setData({ ...data, tasks: newTasks });
  };

  const addNormalTask = () => {
      const newTask: Task = {
          id: Date.now(),
          kgiId: null,
          kpiId: null,
          title: '新しいタスク',
          type: 'normal',
          status: 'todo',
          estimate: 30,
          isContinuous: false
      };
      setData({ ...data, tasks: [...data.tasks, newTask] });
  };

  const deleteTask = (id: number) => {
      setData({ ...data, tasks: data.tasks.filter(t => t.id !== id) });
  };

  const handleStartDayClick = () => {
      setSelectedTaskIds([]);
      setIsSelectionMode(true);
  };

  const toggleTaskSelection = (taskId: number) => {
      setSelectedTaskIds(prev => 
          prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
      );
  };

  const confirmStartDay = () => {
      // const tasksToMove = data.tasks.filter(t => selectedTaskIds.includes(t.id));
      const remainingTasks = data.tasks.filter(t => !selectedTaskIds.includes(t.id));
      
      const orderedTasksToMove: Task[] = [];
      data.tasks.forEach(t => {
          if (selectedTaskIds.includes(t.id)) orderedTasksToMove.push(t);
      });

      setData({
        ...data,
        tasks: remainingTasks,
        todayTasks: [...data.todayTasks, ...orderedTasksToMove]
      });
      if (setPhase) setPhase('do');
  };

  const getLinkedInfo = (task: Task) => {
      if (!task.kgiId) return null;
      const kgi = data.kgis.find(k => k.id === task.kgiId);
      if (!kgi) return null;
      
      let kpiTitle = '';
      if (task.kpiId) {
          const kpi = kgi.kpis.find(k => k.id === task.kpiId);
          if (kpi) kpiTitle = ` > ${kpi.title}`;
      }

      return { kgiTitle: kgi.title, kpiTitle };
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Task Queue</h2>
          <p className="text-gray-500 mt-1">
              {isSelectionMode 
                ? "今日行うタスクを選択してください。" 
                : "実行順に並び替え。KGI/KPIとの繋がりを確認しながら計画します。"}
          </p>
        </div>
        <div className="flex gap-3">
            {!isSelectionMode && (
                <button 
                    onClick={addNormalTask}
                    className="bg-white text-gray-600 border border-gray-300 px-4 py-3 rounded-lg font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                >
                    <Plus size={18} />
                    Normal Task
                </button>
            )}
            
            {isSelectionMode ? (
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsSelectionMode(false)}
                        className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmStartDay}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 animate-fade-in"
                    >
                        <Play size={18} />
                        Start Do Phase ({selectedTaskIds.length})
                    </button>
                </div>
            ) : (
                <button 
                    onClick={handleStartDayClick}
                    className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black shadow-lg flex items-center gap-2"
                >
                    <Calendar size={18} />
                    Select Today's Tasks
                </button>
            )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        {data.tasks.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
                <List size={48} className="mx-auto mb-4 opacity-20"/>
                <p>キューは空です。タスクを追加してください。</p>
            </div>
        ) : (
            <ul className="divide-y divide-gray-100">
            {data.tasks.map((task, index) => {
                const linkInfo = getLinkedInfo(task);
                const isSelected = selectedTaskIds.includes(task.id);

                return (
                    <li 
                        key={task.id} 
                        className={`p-4 flex items-center hover:bg-gray-50 transition-colors group ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={() => isSelectionMode && toggleTaskSelection(task.id)}
                    >
                        {isSelectionMode ? (
                            <div className={`w-6 h-6 rounded border flex items-center justify-center mr-4 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                {isSelected && <CheckCircle size={16} className="text-white" />}
                            </div>
                        ) : (
                            <div className="text-gray-300 text-xs w-8 font-mono font-bold mr-2">{index + 1}</div>
                        )}
                        
                        <div className={`flex-1 ${task.type === 'strategic' ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold tracking-wider ${
                                    task.type === 'strategic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {task.type}
                                </span>
                                {linkInfo && (
                                    <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                        <Target size={10} />
                                        <span className="truncate max-w-[150px]">{linkInfo.kgiTitle}</span>
                                        {linkInfo.kpiTitle && <span className="opacity-70">{linkInfo.kpiTitle}</span>}
                                    </div>
                                )}
                            </div>
                            <input 
                                className="bg-transparent outline-none w-full cursor-pointer" 
                                value={task.title}
                                readOnly={isSelectionMode}
                                onClick={(e) => !isSelectionMode && e.stopPropagation()}
                                onChange={(e) => {
                                    const newTasks = data.tasks.map(t => t.id === task.id ? {...t, title: e.target.value} : t);
                                    setData({...data, tasks: newTasks});
                                }}
                            />
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-1 mr-6">
                            <Clock size={14} /> 
                            <input 
                                type="number"
                                className="w-8 text-right bg-transparent outline-none"
                                value={task.estimate}
                                readOnly={isSelectionMode}
                                onClick={(e) => !isSelectionMode && e.stopPropagation()}
                                onChange={(e) => {
                                    const newTasks = data.tasks.map(t => t.id === task.id ? {...t, estimate: parseInt(e.target.value) || 0} : t);
                                    setData({...data, tasks: newTasks});
                                }}
                            /> m
                        </div>
                        {!isSelectionMode && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => {e.stopPropagation(); moveTask(index, 'up')}} className="p-2 hover:bg-gray-200 rounded text-gray-500"><ArrowUp size={16} /></button>
                                <button onClick={(e) => {e.stopPropagation(); moveTask(index, 'down')}} className="p-2 hover:bg-gray-200 rounded text-gray-500"><ArrowDown size={16} /></button>
                                <button onClick={(e) => {e.stopPropagation(); deleteTask(task.id)}} className="p-2 hover:bg-red-50 rounded text-red-300 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        )}
                    </li>
                );
            })}
            </ul>
        )}
      </div>
    </div>
  );
};

// --- Phase: Do (Visual Updates) ---

const DoPhase: React.FC<PhaseProps> = ({ data, setData }) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const [showKdiModal, setShowKdiModal] = useState(false);
  const [flashMemoOpen, setFlashMemoOpen] = useState(false);
  const [flashMemoText, setFlashMemoText] = useState("");
  const [kdiRatings, setKdiRatings] = useState({ quality: 3, focus: 3, fatigue: 3 });
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);

  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const adjustTime = (minutes: number) => {
    setTimeLeft((prev) => {
      const newTime = prev + minutes * 60;
      return newTime > 0 ? newTime : 0;
    });
  };

  const handleStartTask = (task: Task) => {
    setActiveTask(task);
    if (task.type === 'strategic') {
      setShowRitualModal(true);
    } else {
      startTimer(task);
    }
  };

  const startTimer = (task: Task | null) => {
    if (!task) return;
    setTimeLeft(task.estimate * 60);
    setIsTimerRunning(true);
    setShowRitualModal(false);
  };

  const handleCompleteTask = () => {
    setIsTimerRunning(false);
    if (activeTask && activeTask.isContinuous) {
      setShowKdiModal(true);
    } else {
      finishTask();
    }
  };

  const finishTask = (kdiData: any = null) => {
    if (!activeTask) return;
    const updatedToday = data.todayTasks.map(t => 
      t.id === activeTask.id ? { ...t, status: 'done' as const } : t
    );
    
    let updatedKdiLogs = data.checkData.kdiLogs;
    if (kdiData) {
      updatedKdiLogs = [...updatedKdiLogs, { taskId: activeTask.id, ...kdiData }];
    }

    setData({ 
      ...data, 
      todayTasks: updatedToday,
      checkData: { ...data.checkData, kdiLogs: updatedKdiLogs }
    });

    setActiveTask(null);
    setShowKdiModal(false);
    setKdiRatings({ quality: 3, focus: 3, fatigue: 3 });
  };

  const addFlashMemo = () => {
    if (!flashMemoText.trim()) return;
    const newTask: Task = {
        id: Date.now(),
        title: flashMemoText,
        type: 'normal',
        status: 'todo',
        estimate: 15,
        isContinuous: false,
        kgiId: null,
        kpiId: null
    };
    setData({ ...data, tasks: [...data.tasks, newTask] });
    setFlashMemoText("");
    setFlashMemoOpen(false);
  };

  const addRoutine = () => {
      if(!newRoutineTitle.trim()) return;
      const newRoutine: Routine = { id: Date.now(), title: newRoutineTitle, timing: 'night', done: false };
      setData({ ...data, routines: [...data.routines, newRoutine] });
      setNewRoutineTitle("");
      setIsAddingRoutine(false);
  };

  const deleteRoutine = (id: number | string) => {
      setData({ ...data, routines: data.routines.filter(r => r.id !== id) });
  };

  const updateRoutine = (id: number | string, title: string) => {
      setData({ ...data, routines: data.routines.map(r => r.id === id ? { ...r, title } : r) });
  };

  const getActiveLinkInfo = () => {
      if(!activeTask || !activeTask.kgiId) return null;
      const kgi = data.kgis.find(k => k.id === activeTask.kgiId);
      if(!kgi) return null;
      
      let kpiTitle = null;
      if(activeTask.kpiId) {
          const kpi = kgi.kpis.find(k => k.id === activeTask.kpiId);
          if(kpi) kpiTitle = kpi.title;
      }
      return { kgi, kpiTitle };
  };

  // --- Modals ---

  const RitualModal = () => {
    const linkInfo = getActiveLinkInfo();
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-scale-in">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Mission Start</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
             このタスクは以下のゴールに直結しています。<br/>
             目的を強く意識してください。
            </p>
            
            {linkInfo ? (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-8 text-left">
                    <div className="mb-2">
                        <div className="text-xs font-bold text-gray-400 uppercase">KGI (Goal)</div>
                        <div className="font-bold text-gray-800 text-sm">{linkInfo.kgi.title}</div>
                    </div>
                    {linkInfo.kpiTitle && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                             <div className="text-xs font-bold text-blue-400 uppercase">KPI (Sub-Goal)</div>
                             <div className="font-bold text-blue-800 text-sm">{linkInfo.kpiTitle}</div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-8 text-gray-400 italic">
                    目標未設定
                </div>
            )}

            <button onClick={() => startTimer(activeTask)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">
                Start Focus
            </button>
        </div>
        </div>
    );
  };

  const KdiModal = () => {
    const metrics = [
        { id: 'quality', label: 'Quality', icon: Star, desc: '成果物の質・出来栄え' },
        { id: 'focus', label: 'Focus', icon: Target, desc: '集中度・フロー状態' },
        { id: 'fatigue', label: 'Fatigue', icon: Battery, desc: '疲労度 (低い=元気)' },
    ] as const;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">Execution Log</h3>
            <p className="text-xs text-gray-400 mb-6 text-center">直感で評価を入力してください</p>
            
            <div className="space-y-6">
                {metrics.map((m) => (
                <div key={m.id}>
                    <div className="flex items-center gap-2 mb-3">
                        <m.icon size={16} className="text-blue-600"/>
                        <span className="text-sm font-bold text-gray-700">{m.label}</span>
                        <span className="text-xs text-gray-400 ml-auto">{m.desc}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                key={score}
                                onClick={() => setKdiRatings({...kdiRatings, [m.id]: score})}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                                    kdiRatings[m.id] === score 
                                    ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {score}
                            </button>
                        ))}
                    </div>
                </div>
                ))}
            </div>

            <button onClick={() => finishTask(kdiRatings)} className="w-full mt-8 bg-gray-900 text-white py-3 rounded-xl hover:bg-black transition-colors font-bold flex items-center justify-center gap-2">
                <CheckCircle size={18} /> Complete & Log
            </button>
        </div>
        </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col relative">
      {showRitualModal && <RitualModal />}
      {showKdiModal && <KdiModal />}

      <header className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
           Do Phase
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            {activeTask && isTimerRunning && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(timeLeft / (activeTask.estimate * 60)) * 100}%` }}></div>
                </div>
            )}
            
            {activeTask ? (
              <>
                <div className={`text-xs font-bold uppercase px-3 py-1 rounded-full mb-6 tracking-wider ${
                   activeTask.type === 'strategic' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {activeTask.type} Task
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 leading-tight">{activeTask.title}</h3>
                <div className="flex items-center justify-center gap-4 mb-8">
                    <button onClick={() => adjustTime(-5)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors" title="-5 min">
                        <Minus size={24} /> <span className="text-xs font-bold block">-5m</span>
                    </button>
                    <div className="text-6xl md:text-7xl font-mono font-bold text-gray-900 tracking-tighter">
                        {formatTime(timeLeft)}
                    </div>
                    <button onClick={() => adjustTime(5)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors" title="+5 min">
                        <Plus size={24} /> <span className="text-xs font-bold block">+5m</span>
                    </button>
                </div>
                <div className="flex justify-center gap-4 mb-2">
                     <button onClick={() => adjustTime(-1)} className="text-xs text-gray-400 hover:text-gray-600 bg-gray-50 px-3 py-1 rounded hover:bg-gray-100">-1m</button>
                     <button onClick={() => adjustTime(1)} className="text-xs text-gray-400 hover:text-gray-600 bg-gray-50 px-3 py-1 rounded hover:bg-gray-100">+1m</button>
                </div>

                <div className="flex gap-4 w-full max-w-md justify-center mt-4">
                    {!isTimerRunning ? (
                         <button onClick={() => setIsTimerRunning(true)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">Resume</button>
                    ) : (
                        <button onClick={() => setIsTimerRunning(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">Pause</button>
                    )}
                  <button onClick={handleCompleteTask} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> Done
                  </button>
                </div>
              </>
            ) : (
              <div className="text-gray-300 flex flex-col items-center py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Zap size={32} className="opacity-20" />
                </div>
                <p className="font-medium">Select a task to start</p>
              </div>
            )}
          </div>

          <div className="relative">
             {flashMemoOpen ? (
                 <div className="bg-white p-4 rounded-xl border border-yellow-300 shadow-lg animate-fade-in-up">
                     <div className="text-xs font-bold text-yellow-600 uppercase mb-2">Quick Capture</div>
                     <input autoFocus type="text" placeholder="アイデア、タスク、メモ..." className="w-full mb-3 p-2 text-lg border-b border-gray-200 outline-none placeholder-gray-300" value={flashMemoText} onChange={(e) => setFlashMemoText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFlashMemo()} />
                     <div className="flex justify-end gap-2">
                         <button onClick={() => setFlashMemoOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1">Cancel</button>
                         <button onClick={addFlashMemo} className="text-sm bg-yellow-400 px-4 py-1.5 rounded-lg text-yellow-900 font-bold hover:bg-yellow-500">Add to Queue</button>
                     </div>
                 </div>
             ) : (
                 <button onClick={() => setFlashMemoOpen(true)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all flex items-center justify-center gap-2 group">
                     <Zap size={18} className="group-hover:text-yellow-500 transition-colors" /> 
                     <span className="font-medium">Flash Memo</span>
                 </button>
             )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 overflow-y-auto flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
            Today's Plan
            <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
                {data.todayTasks.filter(t => t.status === 'done').length}/{data.todayTasks.length}
            </span>
          </h3>
          <div className="space-y-2 flex-1">
            {data.todayTasks.map(task => (
              <div key={task.id} onClick={() => task.status !== 'done' && !activeTask && handleStartTask(task)} className={`p-3 rounded-xl border text-sm transition-all cursor-pointer group relative ${
                  task.status === 'done' ? 'bg-gray-100 border-gray-100 text-gray-400' : activeTask?.id === task.id ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                }`}>
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] px-1.5 rounded font-bold ${
                        task.type === 'strategic' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>{task.type}</span>
                    <span className="text-[10px] text-gray-400">{task.estimate}m</span>
                </div>
                <div className={`font-medium ${task.status === 'done' ? 'line-through' : 'text-gray-800'}`}>
                    {task.title}
                </div>
                {task.status === 'done' && (
                    <div className="absolute right-3 bottom-3 text-green-500">
                        <CheckCircle size={14} />
                    </div>
                )}
              </div>
            ))}
            {data.todayTasks.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8 italic">
                    No tasks for today.<br/>Start from Queue.
                </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
                 <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Habits & Routines</h4>
            </div>
            
            <div className="space-y-3">
                {data.routines.map(routine => (
                    <div key={routine.id} className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all group">
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                routine.done ? 'bg-blue-600 border-blue-600' : 'bg-white border-blue-300'
                            }`}>
                                {routine.done && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <input type="checkbox" checked={routine.done} onChange={() => {
                                    const newRoutines = data.routines.map(r => r.id === routine.id ? {...r, done: !r.done} : r);
                                    setData({ ...data, routines: newRoutines });
                                }} className="hidden" />
                            <input 
                                type="text" 
                                value={routine.title}
                                onClick={(e) => e.preventDefault()} // Checkbox toggle prevent
                                onChange={(e) => updateRoutine(routine.id, e.target.value)}
                                className={`text-base font-bold bg-transparent outline-none w-full ${routine.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}
                            />
                        </label>
                        <button onClick={() => deleteRoutine(routine.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                
                {isAddingRoutine ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg animate-fade-in">
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="New Routine..."
                            value={newRoutineTitle}
                            onChange={(e) => setNewRoutineTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addRoutine()}
                            onBlur={() => { if(!newRoutineTitle) setIsAddingRoutine(false); }}
                            className="flex-1 text-sm bg-transparent border-b border-blue-300 outline-none pb-1"
                        />
                        <button onClick={addRoutine} className="text-blue-600"><CheckCircle size={18} /></button>
                    </div>
                ) : (
                    <button onClick={() => setIsAddingRoutine(true)} className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-blue-600 mt-2 py-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-all">
                        <Plus size={14} /> Add Routine
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Phase: Check (Refined & Fixed) ---

const CheckPhase: React.FC<PhaseProps> = ({ data, setData, setPhase }) => {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({}); 
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [thinkingMemo, setThinkingMemo] = useState("");

  // useMemoでリストを自動計算（State管理をやめることで削除を即時反映）
  // AFTER (変更後)
  const analysisList = useMemo(() => {
      // 1. strategicFailures: logData: undefined を明示的に追加、型を AnalysisItem[] にキャスト
      const strategicFailures: AnalysisItem[] = data.todayTasks.filter(t => t.type === 'strategic' && t.status !== 'done')
          .map(t => ({ 
              ...t, 
              issue: '未完了', 
              analysisKind: 'problem',
              logData: undefined // AnalysisItemのオプショナルプロパティを満たす
          } as AnalysisItem)); // または as AnalysisItem でキャスト

      const seenIds = new Set(strategicFailures.map(f => f.id));
      
      // 2. lowQuality: そのままでOKだが、分析リストに結合するために AnalysisItem[] にキャストするとより安全
      const lowQuality: AnalysisItem[] = data.checkData.kdiLogs
          .filter(log => log.quality <= 2 || log.focus <= 2)
          .map(log => {
               const task = data.todayTasks.find(t => t.id === log.taskId);
               if (!task || seenIds.has(task.id)) return null;
               return { ...task, issue: '質/集中不足', analysisKind: 'problem', logData: log } as AnalysisItem;
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

      lowQuality.forEach(item => seenIds.add(item.id));

      // 3. successes: logDataを正しく結合する
      const successes: AnalysisItem[] = data.todayTasks
          .filter(t => t.status === 'done')
          .filter(t => !seenIds.has(t.id))
          .map(t => {
              // 該当タスクのログを探して結合
              const log = data.checkData.kdiLogs.find(l => l.taskId === t.id);
              return { 
                  ...t, 
                  issue: '完了 (Success)', 
                  analysisKind: 'success',
                  logData: log // 見つかればセット、なければundefined
              } as AnalysisItem;
          });

      // deletedIdsに含まれないものだけを返す
      return [...strategicFailures, ...lowQuality, ...successes].filter(item => !deletedIds.includes(item.id));
  }, [data, deletedIds]);

  const toggleExpand = (taskId: number) => {
      setExpandedItems(prev => ({...prev, [taskId]: !prev[taskId]}));
      setThinkingMemo("");
  };

  const completeAnalysisAndRemove = (taskId: number) => {
      setDeletedIds(prev => [...prev, taskId]);
      setThinkingMemo("");
  };

  // Flash Memo削除: confirmなしで即削除
  const deleteQueueTask = (id: number) => {
      setData(prev => ({...prev, tasks: prev.tasks.filter(t => t.id !== id)}));
  };
  
  const flashMemos = data.tasks.filter(t => t.type === 'normal');

  const getTaskLinkInfo = (task: Task) => {
    if (!task.kgiId) return null;
    const kgi = data.kgis.find(k => k.id === task.kgiId);
    if (!kgi) return null;
    let kpiTitle = '';
    if (task.kpiId) {
        const kpi = kgi.kpis.find(k => k.id === task.kpiId);
        if (kpi) kpiTitle = ` > ${kpi.title}`;
    }
    return { kgiTitle: kgi.title, kpiTitle };
  };

  return (
      <div className="max-w-3xl mx-auto mt-8 animate-fade-in pb-32">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Analysis</h2>
          <p className="text-gray-500 mb-6">完了したタスクを振り返り、次にどう活かすかを言語化してください。</p>
          
          <div className="space-y-4 mb-12">
              {analysisList.length === 0 && (
                  <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                      分析対象のタスクはありません。<br/>すべて完了・削除されました。
                  </div>
              )}

              {analysisList.map((item) => {
                  const linkInfo = getTaskLinkInfo(item);
                  const isExpanded = expandedItems[item.id];
                  const isProblem = item.analysisKind === 'problem';

                  return (
                    <div key={item.id} className={`bg-white border rounded-xl shadow-sm transition-all relative overflow-hidden ${isProblem ? 'border-red-100' : 'border-gray-200'}`}>
                        <div 
                            onClick={() => toggleExpand(item.id)} 
                            className={`p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                        isProblem ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {item.issue}
                                    </span>
                                    {linkInfo && (
                                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Target size={10} /> {linkInfo.kgiTitle}
                                        </span>
                                    )}
                                </div>
                                <div className="font-bold text-gray-900 text-lg">{item.title}</div>
                                
                                {item.logData && (
                                    <div className="flex gap-4 mt-3 text-xs">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                                            Quality: <span className="font-bold text-lg">{item.logData.quality}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Target size={14} className="text-blue-500"/>
                                            Focus: <span className="font-bold text-lg">{item.logData.focus}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Battery size={14} className="text-green-500"/>
                                            Fatigue: <span className="font-bold text-lg">{item.logData.fatigue}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="text-gray-400 flex items-center gap-2 z-10">
                                {isExpanded ? <ChevronDown className="text-gray-400"/> : <ChevronRight className="text-gray-400"/>}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="px-5 pb-5 pt-0 animate-fade-in border-t border-gray-100 mt-2">
                                <div className="py-4 animate-slide-in">
                                    <div className={`text-sm font-bold mb-2 flex items-center gap-2 ${isProblem ? 'text-red-600' : 'text-blue-600'}`}>
                                        <Lightbulb size={16} />
                                        Thinking Guide
                                    </div>
                                    
                                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                        {isProblem 
                                            ? "なぜうまくいかなかったのか？（行動不足？計画ミス？想定外？）。そして、次から具体的にどう行動を変えるか？" 
                                            : "なぜうまくいったのか？（計画通り？集中？環境？）。この成功パターンを次にどう活かすか？（ルーティン化・横展開など）"}
                                    </p>
                                    
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <PenTool size={16} />
                                            Insights & Next Action (自由記述)
                                        </label>
                                        <textarea 
                                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-200 outline-none min-h-[100px]"
                                            placeholder="気づきと次なる一手を入力..."
                                            value={thinkingMemo}
                                            onChange={(e) => setThinkingMemo(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => completeAnalysisAndRemove(item.id)}
                                            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-black flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            思考完了 & リストから削除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                  );
              })}
          </div>

          {/* Flash Memos / Inbox Section */}
          <div className="border-t border-gray-200 pt-8">
               <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Inbox size={20} className="text-gray-500"/>
                   Flash Memos (Inbox)
               </h3>
               <p className="text-sm text-gray-500 mb-4">Doフェーズで追加したメモや、未分類のタスクです。確認後、不要なものは削除してください。</p>
               
               <div className="space-y-2">
                   {flashMemos.length === 0 && (
                       <div className="text-sm text-gray-400 italic pl-2">Inbox is empty.</div>
                   )}
                   {flashMemos.map(memo => (
                       <div key={memo.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                           <div className="flex items-center gap-3">
                               <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                               <span className="text-gray-800 font-medium">{memo.title}</span>
                           </div>
                           <div className="flex items-center gap-2">
                               <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteQueueTask(memo.id);
                                    }}
                                    className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
                               >
                                   <CheckCircle size={14} />
                                   確認・削除
                               </button>
                               <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteQueueTask(memo.id);
                                    }}
                                    className="p-2 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                                    title="ゴミ箱"
                               >
                                   <Trash2 size={16} />
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
          
          <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
              <button 
                onClick={() => setPhase && setPhase('plan-queue')} 
                className="pointer-events-auto bg-gray-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-black transition-transform hover:scale-105 flex items-center gap-2"
              >
                  Finish & Return to Queue <ArrowDown size={16} />
              </button>
          </div>
      </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // LocalStorage Initialization
  const [data, setData] = useState<AppData>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    }
    return emptyData;
  });

  const [phase, setPhase] = useState<Phase>('plan-strategy'); 

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to localStorage', error);
    }
  }, [data]);

  const renderPhase = () => {
    switch (phase) {
      case 'plan-strategy': return <PlanStrategy data={data} setData={setData} />;
      case 'plan-queue': return <TaskQueue data={data} setData={setData} setPhase={setPhase} />;
      case 'do': return <DoPhase data={data} setData={setData} />;
      case 'check': return <CheckPhase data={data} setData={setData} setPhase={setPhase} />;
      default: return <div className="p-10 text-center text-gray-400">Page Not Found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      <Sidebar currentPhase={phase} setPhase={setPhase} />
      <main className="flex-1 overflow-y-auto bg-white scroll-smooth">
        {renderPhase()}
      </main>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-in {
           from { opacity: 0; transform: translateX(10px); }
           to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;