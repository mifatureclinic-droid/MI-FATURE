import React from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { Button } from '@/components/ui/button';

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

/**
 * Botão que exibe animação de carregamento com folha ao ser clicado
 */
export function LoadingButton({
  isLoading: externalIsLoading = false,
  loadingMessage = 'Salvando...',
  children,
  onClick,
  disabled,
  ...props
}: LoadingButtonProps) {
  const { startLoading, stopLoading } = useLoading();
  const [internalLoading, setInternalLoading] = React.useState(false);

  const isLoading = externalIsLoading || internalLoading;
  const isBotaoDeEnvio = props.type === 'submit';

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;

    setInternalLoading(true);
    startLoading(loadingMessage);

    try {
      if (onClick) {
        const result = onClick(e);
        if (result instanceof Promise) {
          await result;
        }
      }
    } finally {
      setInternalLoading(false);
      stopLoading();
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      // Botões submit devem deixar o formulário disparar onSubmit. O estado de
      // carregamento é recebido externamente após a mutation iniciar.
      onClick={isBotaoDeEnvio ? onClick : handleClick}
      className={`relative bg-primary hover:bg-primary/90 ${isLoading ? 'opacity-75' : ''}`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 12 2 Q 14 4 14 6 Q 14 8 12 10 Q 10 8 10 6 Q 10 4 12 2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          {loadingMessage}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
