import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, loginWithGoogle, logout, db, handleFirestoreError, OperationType } from './firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp, orderBy, setDoc } from 'firebase/firestore';
import { Business, Transaction, Category, Employee, Attendance, UserRole, AppSettings } from './types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  LogOut, 
  LogIn,
  ChevronRight,
  Trash2,
  PieChart as PieChartIcon,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  History,
  Settings,
  Menu,
  X,
  Palette
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2', variants[variant], className)} 
      {...props} 
    />
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    className={cn('w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all', className)} 
    {...props} 
  />
);

const Select = ({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select 
    className={cn('w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 transition-all', className)} 
    {...props}
  >
    {children}
  </select>
);

// --- Main App ---

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'businesses' | 'transactions' | 'reports' | 'employees' | 'attendance' | 'roles' | 'settings'>('dashboard');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | 'all'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch Data
  useEffect(() => {
    // Fetch global app settings
    const unsubscribeS = onSnapshot(doc(db, 'appSettings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setAppSettings({ id: snapshot.id, ...snapshot.data() } as AppSettings);
      }
    });

    if (!user) return;

    // Fetch businesses where user is owner OR has a role
    const unsubscribeB = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'businesses'));

    const unsubscribeT = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    const unsubscribeC = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const unsubscribeE = onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'employees'));

    const unsubscribeA = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'attendance'));

    const unsubscribeR = onSnapshot(collection(db, 'userRoles'), (snapshot) => {
      setUserRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRole)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'userRoles'));

    return () => {
      unsubscribeS();
      unsubscribeB();
      unsubscribeT();
      unsubscribeC();
      unsubscribeE();
      unsubscribeA();
      unsubscribeR();
    };
  }, [user]);

  const currentSettings = appSettings || {
    appName: 'BizManager',
    primaryColor: '#000000',
    logoColor: '#ffffff'
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-2">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ backgroundColor: currentSettings.primaryColor, color: currentSettings.logoColor }}
          >
            <Briefcase size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{currentSettings.appName}</h1>
          <p className="text-gray-500">Kelola semua usaha Anda dalam satu dashboard terpadu.</p>
        </div>
        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <Button 
              onClick={loginWithGoogle} 
              className="w-full py-3 text-lg"
              style={{ backgroundColor: currentSettings.primaryColor }}
            >
              <LogIn size={20} />
              Masuk dengan Google
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            M.khoirulirsyad@gmail.com adalah Super Admin default.
          </p>
        </Card>
      </div>
    </div>
  );

  // Helper to check role for a specific business
  const getRoleForBusiness = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business?.ownerUid === user.uid) return 'superadmin';
    const role = userRoles.find(r => r.businessId === businessId && r.userUid === user.uid);
    return role?.role || null;
  };

  const isGlobalAdmin = user.email?.toLowerCase() === 'm.khoirulirsyad@gmail.com' || user.uid === 'muhzsLfYo5bbCxxAEcicWK0HmQs1';

  const isSuperAdmin = (businessId: string) => getRoleForBusiness(businessId) === 'superadmin';
  const isManager = (businessId: string) => {
    const role = getRoleForBusiness(businessId);
    return role === 'manager' || role === 'superadmin';
  };

  // Filter businesses based on access
  const accessibleBusinesses = businesses.filter(b => isManager(b.id));

  const filteredTransactions = selectedBusinessId === 'all' 
    ? transactions.filter(t => isManager(t.businessId))
    : transactions.filter(t => t.businessId === selectedBusinessId);

  const filteredEmployees = selectedBusinessId === 'all'
    ? employees.filter(e => isManager(e.businessId))
    : employees.filter(e => e.businessId === selectedBusinessId);

  const filteredAttendance = selectedBusinessId === 'all'
    ? attendance.filter(a => isManager(a.businessId))
    : attendance.filter(a => a.businessId === selectedBusinessId);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'businesses', icon: <Building2 size={20} />, label: 'Usaha' },
    { id: 'transactions', icon: <History size={20} />, label: 'Transaksi' },
    { id: 'employees', icon: <PlusCircle size={20} />, label: 'Karyawan' },
    { id: 'attendance', icon: <Filter size={20} />, label: 'Absensi' },
    { id: 'reports', icon: <PieChartIcon size={20} />, label: 'Laporan' },
    { id: 'roles', icon: <PlusCircle size={20} />, label: 'Roles' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings', adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: currentSettings.primaryColor, color: currentSettings.logoColor }}
            >
              <Briefcase size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight truncate">{currentSettings.appName}</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            if (item.adminOnly && !isGlobalAdmin) return null;
            return (
              <NavItem 
                key={item.id}
                active={activeTab === item.id} 
                onClick={() => setActiveTab(item.id as any)} 
                icon={item.icon} 
                label={item.label} 
                activeColor={currentSettings.primaryColor}
              />
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-4">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut size={20} />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-100 p-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: currentSettings.primaryColor, color: currentSettings.logoColor }}
          >
            <Briefcase size={16} />
          </div>
          <span className="font-bold text-lg tracking-tight">{currentSettings.appName}</span>
        </div>
        <div className="flex items-center gap-2">
          <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
          <Button variant="ghost" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-64 h-full bg-white flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <span className="font-bold text-xl">{currentSettings.appName}</span>
              <Button variant="ghost" onClick={() => setIsSidebarOpen(false)}><X size={20} /></Button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map(item => {
                if (item.adminOnly && !isGlobalAdmin) return null;
                return (
                  <NavItem 
                    key={item.id}
                    active={activeTab === item.id} 
                    onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
                    icon={item.icon} 
                    label={item.label} 
                    activeColor={currentSettings.primaryColor}
                  />
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-50">
              <Button variant="ghost" onClick={logout} className="w-full justify-start text-red-500">
                <LogOut size={20} />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 capitalize">{activeTab}</h2>
            <p className="text-sm text-gray-500">
              {selectedBusinessId !== 'all' ? `Role: ${getRoleForBusiness(selectedBusinessId)}` : 'Semua Usaha'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              value={selectedBusinessId} 
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full md:w-48"
            >
              <option value="all">Semua Usaha</option>
              {accessibleBusinesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <Dashboard 
            totalIncome={totalIncome} 
            totalExpense={totalExpense} 
            balance={balance} 
            transactions={filteredTransactions}
            businesses={accessibleBusinesses}
            formatCurrency={formatCurrency}
            primaryColor={currentSettings.primaryColor}
          />
        )}

        {activeTab === 'businesses' && (
          <Businesses 
            businesses={accessibleBusinesses} 
            user={user} 
            formatCurrency={formatCurrency}
            transactions={transactions}
            isSuperAdmin={isSuperAdmin}
            primaryColor={currentSettings.primaryColor}
          />
        )}

        {activeTab === 'transactions' && (
          <Transactions 
            transactions={filteredTransactions} 
            businesses={accessibleBusinesses} 
            categories={categories}
            user={user}
            formatCurrency={formatCurrency}
            primaryColor={currentSettings.primaryColor}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesView 
            employees={filteredEmployees}
            businesses={accessibleBusinesses}
            user={user}
            primaryColor={currentSettings.primaryColor}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView 
            attendance={filteredAttendance}
            employees={filteredEmployees}
            businesses={accessibleBusinesses}
            user={user}
            primaryColor={currentSettings.primaryColor}
          />
        )}

        {activeTab === 'reports' && (
          <Reports 
            transactions={filteredTransactions} 
            formatCurrency={formatCurrency}
            primaryColor={currentSettings.primaryColor}
          />
        )}

        {activeTab === 'roles' && (
          <RolesView 
            businesses={businesses.filter(b => b.ownerUid === user.uid)}
            userRoles={userRoles}
            user={user}
            primaryColor={currentSettings.primaryColor}
          />
        )}

        {activeTab === 'settings' && isGlobalAdmin && (
          <SettingsView 
            settings={currentSettings}
            user={user}
          />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center p-2 z-30">
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              'flex flex-col items-center p-2 rounded-xl transition-all',
              activeTab === item.id ? 'text-black' : 'text-gray-400'
            )}
            style={activeTab === item.id ? { color: currentSettings.primaryColor } : {}}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// --- New Sub-Views ---

function EmployeesView({ employees, businesses, user, primaryColor }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', businessId: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.businessId) return;
    try {
      await addDoc(collection(db, 'employees'), {
        ...form,
        ownerUid: user.uid
      });
      setShowAdd(false);
      setForm({ name: '', position: '', businessId: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'employees');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Daftar Karyawan</h3>
        <Button onClick={() => setShowAdd(true)} style={{ backgroundColor: primaryColor }}>Tambah Karyawan</Button>
      </div>

      {showAdd && (
        <Card className="p-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama Karyawan" required />
            <Input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Posisi" />
            <Select value={form.businessId} onChange={e => setForm({...form, businessId: e.target.value})} required>
              <option value="">Pilih Usaha...</option>
              {businesses.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <div className="md:col-span-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button type="submit" style={{ backgroundColor: primaryColor }}>Simpan</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((e: Employee) => (
          <Card key={e.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold">{e.name}</p>
              <p className="text-xs text-gray-500">{e.position || 'Staff'}</p>
              <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">
                {businesses.find((b: any) => b.id === e.businessId)?.name}
              </p>
            </div>
            <Button variant="ghost" onClick={async () => {
              if (confirm('Hapus karyawan?')) await deleteDoc(doc(db, 'employees', e.id));
            }} className="text-red-400">
              <Trash2 size={16} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AttendanceView({ attendance, employees, businesses, user, primaryColor }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employeeId: '', status: 'present' as any, date: format(new Date(), 'yyyy-MM-dd') });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e: any) => e.id === form.employeeId);
    if (!emp) return;
    try {
      await addDoc(collection(db, 'attendance'), {
        ...form,
        businessId: emp.businessId,
        ownerUid: user.uid
      });
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'attendance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Absensi Karyawan</h3>
        <Button onClick={() => setShowAdd(true)} style={{ backgroundColor: primaryColor }}>Input Absensi</Button>
      </div>

      {showAdd && (
        <Card className="p-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required>
              <option value="">Pilih Karyawan...</option>
              {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({businesses.find((b: any) => b.id === e.businessId)?.name})</option>)}
            </Select>
            <Select value={form.status} onChange={e => setForm({...form, status: e.target.value})} required>
              <option value="present">Hadir</option>
              <option value="absent">Alpa</option>
              <option value="late">Terlambat</option>
              <option value="leave">Izin/Sakit</option>
            </Select>
            <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            <div className="md:col-span-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button type="submit" style={{ backgroundColor: primaryColor }}>Simpan Absensi</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-bold uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Karyawan</th>
              <th className="px-6 py-3">Usaha</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {attendance.map((a: Attendance) => (
              <tr key={a.id}>
                <td className="px-6 py-4 text-sm">{a.date}</td>
                <td className="px-6 py-4 text-sm font-bold">{employees.find((e: any) => e.id === a.employeeId)?.name}</td>
                <td className="px-6 py-4 text-xs">{businesses.find((b: any) => b.id === a.businessId)?.name}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    'px-2 py-1 rounded text-[10px] font-bold uppercase',
                    a.status === 'present' ? 'bg-green-100 text-green-700' : 
                    a.status === 'absent' ? 'bg-red-100 text-red-700' :
                    a.status === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                  )}>{a.status}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" onClick={() => deleteDoc(doc(db, 'attendance', a.id))} className="text-red-300">
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function RolesView({ businesses, userRoles, user, primaryColor }: any) {
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [role, setRole] = useState<'superadmin' | 'manager'>('manager');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !businessId) return;
    try {
      // Use userId_businessId as document ID for easy lookup in rules
      const roleId = `${uid}_${businessId}`;
      await setDoc(doc(db, 'userRoles', roleId), {
        businessId,
        userUid: uid,
        userEmail: email,
        role
      });
      setEmail('');
      setUid('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'userRoles');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Manajemen Akses (Super Admin Only)</h3>
      <Card className="p-6">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={uid} onChange={e => setUid(e.target.value)} placeholder="User UID (Dapatkan dari user)" required />
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email User (Opsional)" />
            <Select value={businessId} onChange={e => setBusinessId(e.target.value)} required>
              <option value="">Pilih Usaha...</option>
              {businesses.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Select value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="manager">Manager</option>
              <option value="superadmin">Super Admin</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" style={{ backgroundColor: primaryColor }}>Berikan Akses</Button>
        </form>
      </Card>

      <div className="space-y-4">
        {userRoles.map((r: UserRole) => (
          <Card key={r.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-bold">{r.userEmail || r.userUid}</p>
              <p className="text-xs text-gray-500">Role: <span className="uppercase font-bold text-blue-500">{r.role}</span></p>
              <p className="text-[10px] text-gray-400">Usaha: {businesses.find((b: any) => b.id === r.businessId)?.name}</p>
            </div>
            <Button variant="ghost" onClick={() => deleteDoc(doc(db, 'userRoles', r.id))} className="text-red-400">
              <Trash2 size={16} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, onClick, activeColor = '#000' }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; activeColor?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
        active 
          ? 'bg-gray-50' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-black'
      )}
      style={active ? { color: activeColor } : {}}
    >
      <span className={cn('transition-transform duration-200', active ? 'scale-110' : 'group-hover:scale-110')}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );
}

// --- Sub-Views ---

function Dashboard({ totalIncome, totalExpense, balance, transactions, businesses, formatCurrency, primaryColor }: any) {
  const recentTransactions = transactions.slice(0, 5);
  
  const chartData = businesses.map((b: Business) => {
    const bTransactions = transactions.filter((t: Transaction) => t.businessId === b.id);
    const income = bTransactions.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const expense = bTransactions.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    return { name: b.name, income, expense };
  });

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Saldo" 
          value={formatCurrency(balance)} 
          icon={<Wallet style={{ color: primaryColor }} />} 
          trend={balance >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          label="Total Pendapatan" 
          value={formatCurrency(totalIncome)} 
          icon={<TrendingUp className="text-green-500" />} 
          trend="up"
        />
        <StatCard 
          label="Total Pengeluaran" 
          value={formatCurrency(totalExpense)} 
          icon={<TrendingDown className="text-red-500" />} 
          trend="down"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">Performa per Usaha</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Pendapatan" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Transaksi Terakhir</h3>
            <Button variant="ghost" className="text-sm" style={{ color: primaryColor }}>Lihat Semua</Button>
          </div>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">Belum ada transaksi.</div>
            ) : (
              recentTransactions.map((t: Transaction) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    )}>
                      {t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.category}</p>
                      <p className="text-xs text-gray-500">{format(t.date.toDate(), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <p className={cn('font-bold', t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string; value: string; icon: React.ReactNode; trend: 'up' | 'down' }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <div className={cn(
          'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
          trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          {trend === 'up' ? 'Profit' : 'Loss'}
        </div>
      </div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold tracking-tight mt-1">{value}</p>
    </Card>
  );
}

function Businesses({ businesses, user, formatCurrency, transactions, primaryColor }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await addDoc(collection(db, 'businesses'), {
        name,
        description: desc,
        ownerUid: user.uid,
        createdAt: Timestamp.now()
      });
      setName('');
      setDesc('');
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'businesses');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus usaha ini? Semua data transaksi terkait akan tetap ada namun tidak terhubung.')) return;
    try {
      await deleteDoc(doc(db, 'businesses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'businesses');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Daftar Usaha</h3>
        <Button onClick={() => setShowAdd(true)} style={{ backgroundColor: primaryColor }}>
          <PlusCircle size={20} />
          Tambah Usaha
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 border-2 border-black/5">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nama Usaha</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Kedai Kopi Maju" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Deskripsi</label>
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi singkat..." />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button type="submit" style={{ backgroundColor: primaryColor }}>Simpan Usaha</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((b: Business) => {
          const bTransactions = transactions.filter((t: Transaction) => t.businessId === b.id);
          const income = bTransactions.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
          const expense = bTransactions.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
          const profit = income - expense;

          return (
            <Card key={b.id} className="group hover:border-black/20 transition-all duration-300">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <Button variant="ghost" onClick={() => handleDelete(b.id)} className="text-gray-300 hover:text-red-500 p-2">
                    <Trash2 size={18} />
                  </Button>
                </div>
                <div>
                  <h4 className="text-xl font-bold">{b.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-1">{b.description || 'Tidak ada deskripsi'}</p>
                </div>
                <div className="pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pendapatan</p>
                    <p className="font-bold text-green-600">{formatCurrency(income)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pengeluaran</p>
                    <p className="font-bold text-red-600">{formatCurrency(expense)}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Net Profit</span>
                  <span className={cn('font-bold', profit >= 0 ? 'text-blue-600' : 'text-red-600')}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Transactions({ transactions, businesses, categories, user, formatCurrency, primaryColor }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    businessId: '',
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessId || !form.amount || !form.category) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        ...form,
        amount: parseFloat(form.amount),
        date: Timestamp.fromDate(new Date(form.date)),
        ownerUid: user.uid
      });
      setShowAdd(false);
      setForm({
        businessId: '',
        type: 'income',
        amount: '',
        category: '',
        description: '',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'transactions');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'transactions');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Riwayat Transaksi</h3>
        <Button onClick={() => setShowAdd(true)} style={{ backgroundColor: primaryColor }}>
          <PlusCircle size={20} />
          Catat Transaksi
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6 border-2 border-black/5">
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Pilih Usaha</label>
                <Select value={form.businessId} onChange={(e) => setForm({ ...form, businessId: e.target.value })} required>
                  <option value="">Pilih Usaha...</option>
                  {businesses.map((b: Business) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tipe</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={cn('flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all', form.type === 'income' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-transparent text-gray-400')}
                    style={form.type === 'income' ? { borderColor: 'rgb(34 197 94)', color: 'rgb(21 128 61)' } : {}}
                  >Pendapatan</button>
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={cn('flex-1 py-2 rounded-lg font-bold text-sm border-2 transition-all', form.type === 'expense' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-transparent text-gray-400')}
                    style={form.type === 'expense' ? { borderColor: 'rgb(239 68 68)', color: 'rgb(185 28 28)' } : {}}
                  >Pengeluaran</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Jumlah (IDR)</label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Kategori</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Misal: Penjualan, Sewa, Gaji" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tanggal & Waktu</label>
                <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Keterangan</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Catatan tambahan..." />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button type="submit" style={{ backgroundColor: primaryColor }}>Simpan Transaksi</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Usaha</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Jumlah</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t: Transaction) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm whitespace-nowrap">{format(t.date.toDate(), 'dd/MM/yy HH:mm')}</td>
                  <td className="px-6 py-4 text-sm font-medium">{businesses.find((b: Business) => b.id === t.businessId)?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-semibold text-gray-600">{t.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]">{t.description || '-'}</td>
                  <td className={cn('px-6 py-4 text-sm font-bold text-right whitespace-nowrap', t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" onClick={() => handleDelete(t.id)} className="p-1 text-gray-300 hover:text-red-500">
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Tidak ada data transaksi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Reports({ transactions, formatCurrency, primaryColor }: any) {
  const incomeByCategory = transactions
    .filter((t: Transaction) => t.type === 'income')
    .reduce((acc: any, t: Transaction) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const expenseByCategory = transactions
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((acc: any, t: Transaction) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }));
  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">Distribusi Pendapatan</h3>
          <div className="h-80 w-full">
            {incomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Belum ada data pendapatan.</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">Distribusi Pengeluaran</h3>
          <div className="h-80 w-full">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Belum ada data pengeluaran.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsView({ settings, user }: { settings: any, user: any }) {
  const [form, setForm] = useState({
    appName: settings.appName,
    primaryColor: settings.primaryColor,
    logoColor: settings.logoColor
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'appSettings', 'global'), {
        ...form,
        updatedAt: Timestamp.now(),
        updatedBy: user.uid
      });
      alert('Pengaturan berhasil disimpan!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'appSettings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Palette className="text-gray-400" />
          Branding & Kustomisasi
        </h3>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nama Aplikasi</label>
            <Input 
              value={form.appName} 
              onChange={e => setForm({...form, appName: e.target.value})} 
              placeholder="BizManager" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Warna Utama (Primary)</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={form.primaryColor} 
                  onChange={e => setForm({...form, primaryColor: e.target.value})}
                  className="w-12 h-10 rounded-lg cursor-pointer"
                />
                <Input 
                  value={form.primaryColor} 
                  onChange={e => setForm({...form, primaryColor: e.target.value})} 
                  placeholder="#000000" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Warna Logo/Ikon</label>
              <div className="flex gap-3">
                <input 
                  type="color" 
                  value={form.logoColor} 
                  onChange={e => setForm({...form, logoColor: e.target.value})}
                  className="w-12 h-10 rounded-lg cursor-pointer"
                />
                <Input 
                  value={form.logoColor} 
                  onChange={e => setForm({...form, logoColor: e.target.value})} 
                  placeholder="#FFFFFF" 
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-sm font-semibold mb-4 text-gray-500 uppercase tracking-wider">Preview Branding</p>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: form.primaryColor, color: form.logoColor }}
              >
                <Briefcase size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-bold" style={{ color: form.primaryColor }}>{form.appName}</h4>
                <p className="text-sm text-gray-500">Tampilan aplikasi akan berubah sesuai pilihan Anda.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} style={{ backgroundColor: form.primaryColor }}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
