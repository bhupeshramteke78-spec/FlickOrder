export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-transparent">
      <div className="h-full w-1/3 animate-[route-progress_900ms_ease-in-out_infinite] rounded-r-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.65)]" />
    </div>
  );
}
