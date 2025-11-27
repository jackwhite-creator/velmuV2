interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const getStrength = () => {
    if (password.length === 0) return { level: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, text: 'Faible', color: 'bg-red-500' };
    if (strength <= 4) return { level: 2, text: 'Moyen', color: 'bg-yellow-500' };
    return { level: 3, text: 'Fort', color: 'bg-green-500' };
  };

  const strength = getStrength();
  
  if (password.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        <div className={`h-1 flex-1 rounded ${strength.level >= 1 ? strength.color : 'bg-slate-700'}`}></div>
        <div className={`h-1 flex-1 rounded ${strength.level >=2 ? strength.color : 'bg-slate-700'}`}></div>
        <div className={`h-1 flex-1 rounded ${strength.level >= 3 ? strength.color : 'bg-slate-700'}`}></div>
      </div>
      <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>Force : {strength.text}</p>
    </div>
  );
}
