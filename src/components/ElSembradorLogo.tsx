import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const ElSembradorLogo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const dimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }[size];

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${dimensions} flex items-center justify-center`}>
        <img
          src={`${import.meta.env.BASE_URL}logo-mark.png`}
          alt="El Sembrador"
          className="w-full h-full object-contain drop-shadow-sm rounded-full"
        />
      </div>

      {showText && (
        <div className="mt-2 text-center">
          <h1 className={`font-black tracking-tight text-orange-600 ${textSizes}`}>
            El Sembrador
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-green-800">
            Recría Avícola
          </p>
        </div>
      )}
    </div>
  );
};
