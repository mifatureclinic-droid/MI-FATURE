import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarioAgendaProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
}

export function CalendarioAgenda({ selectedDate, onSelectDate, minDate }: CalendarioAgendaProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  
  // Definir minDate como hoje se não fornecido
  const min = minDate || new Date();
  min.setHours(0, 0, 0, 0);

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  
  // Ajustar para segunda-feira ser o primeiro dia (0 = segunda)
  const firstDayAdjusted = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  
  // Adicionar dias vazios do mês anterior
  for (let i = 0; i < firstDayAdjusted; i++) {
    days.push(null);
  }
  
  // Adicionar dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSelectDay = (day: number) => {
    if (!day) return;
    
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Verificar se a data está antes da data mínima
    if (selectedDate < min) {
      return;
    }
    
    onSelectDate(selectedDate);
  };

  const isDateDisabled = (day: number | null) => {
    if (!day) return true;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < min;
  };

  const isDateSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return isSameDay(date, selectedDate);
  };

  const isDateToday = (day: number | null) => {
    if (!day) return false;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return isSameDay(date, today);
  };

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      {/* Cabeçalho do mês */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isDisabled = isDateDisabled(day);
          const isSelected = isDateSelected(day);
          const isToday = isDateToday(day);

          return (
            <button
              key={index}
              onClick={() => handleSelectDay(day || 0)}
              disabled={isDisabled}
              className={`
                aspect-square rounded text-sm font-medium transition
                ${!day ? 'bg-transparent cursor-default' : ''}
                ${isDisabled && day ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                ${!isSelected && !isDisabled && day ? 'bg-gray-50 hover:bg-gray-200 text-gray-900' : ''}
                ${isToday && !isSelected ? 'border-2 border-blue-400' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 pt-4 border-t space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span className="text-gray-600">Data selecionada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border-2 border-blue-400 rounded"></div>
          <span className="text-gray-600">Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-600">Data indisponível</span>
        </div>
      </div>
    </div>
  );
}
