import { createContext, useContext, useState, ReactNode } from 'react';

interface ProntuarioContextValue {
  pacienteId: number | null;
  atendimentoId: number | null;
  setProntuarioTarget: (pacienteId: number, atendimentoId: number) => void;
  clearProntuarioTarget: () => void;
}

const ProntuarioContext = createContext<ProntuarioContextValue>({
  pacienteId: null,
  atendimentoId: null,
  setProntuarioTarget: () => {},
  clearProntuarioTarget: () => {},
});

export function ProntuarioProvider({ children }: { children: ReactNode }) {
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [atendimentoId, setAtendimentoId] = useState<number | null>(null);

  const setProntuarioTarget = (pid: number, aid: number) => {
    setPacienteId(pid);
    setAtendimentoId(aid);
  };

  const clearProntuarioTarget = () => {
    setPacienteId(null);
    setAtendimentoId(null);
  };

  return (
    <ProntuarioContext.Provider value={{ pacienteId, atendimentoId, setProntuarioTarget, clearProntuarioTarget }}>
      {children}
    </ProntuarioContext.Provider>
  );
}

export function useProntuarioContext() {
  return useContext(ProntuarioContext);
}
