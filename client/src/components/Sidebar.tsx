import { Link, useLocation } from "wouter";
import { CalendarDays, Users, Calendar, Settings } from "lucide-react";

interface SidebarProps {
  activeEmployees: number;
  weekendShifts: number;
  holidaysThisMonth: number;
  onAddEmployee: () => void;
}

export default function Sidebar({ 
  activeEmployees, 
  weekendShifts, 
  holidaysThisMonth, 
  onAddEmployee 
}: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    { path: "/", icon: CalendarDays, label: "Escala Semanal" },
    { path: "/employees", icon: Users, label: "Funcionários" },
    { path: "/holidays", icon: Calendar, label: "Feriados" },
  ];

  return (
    <aside className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Menu</h2>
        <nav className="space-y-2">
          {navigationItems.map(({ path, icon: Icon, label }) => (
            <Link key={path} href={path}>
              <div 
                className={`flex items-center p-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  location === path 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {label}
              </div>
            </Link>
          ))}
          <button className="flex items-center p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors w-full text-left">
            <Settings className="mr-3 h-4 w-4" />
            Configurações
          </button>
        </nav>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Funcionários Ativos</span>
            <span className="font-semibold text-blue-600">{activeEmployees}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Plantões Fim de Semana</span>
            <span className="font-semibold text-orange-500">{weekendShifts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Feriados este Mês</span>
            <span className="font-semibold text-red-600">{holidaysThisMonth}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
