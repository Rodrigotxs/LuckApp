interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

function obterIniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-[#BDBDBD]`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full
        bg-[#1A3A6B] text-white
        flex items-center justify-center
        font-bold border-2 border-[#1A3A6B]/30
      `}
    >
      {obterIniciais(name)}
    </div>
  );
}
