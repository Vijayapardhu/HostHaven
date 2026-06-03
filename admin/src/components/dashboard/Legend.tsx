export function Legend() {
  const items = [
    { label: 'Available', color: 'bg-emerald-500' },
    { label: 'Booked', color: 'bg-rose-500' },
    { label: 'Temporarily locked', color: 'bg-amber-500' },
  ]

  return (
    <div className="flex items-center gap-6 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded ${item.color}`} />
          <span className="text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
