export default function ChatSkeleton() {
  return (
    <div className="flex gap-4 px-4 py-2 opacity-50 animate-pulse select-none pointer-events-none">
      {/* Avatar Circle */}
      <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0" />
      
      {/* Text Lines */}
      <div className="flex-1 space-y-2 py-1">
        <div className="flex items-center gap-2">
           {/* Username */}
           <div className="h-4 w-24 bg-slate-700 rounded" />
           {/* Date */}
           <div className="h-3 w-16 bg-slate-800 rounded" />
        </div>
        {/* Content lines */}
        <div className="h-4 w-3/4 bg-slate-800 rounded opacity-60" />
        <div className="h-4 w-1/2 bg-slate-800 rounded opacity-60" />
      </div>
    </div>
  );
}