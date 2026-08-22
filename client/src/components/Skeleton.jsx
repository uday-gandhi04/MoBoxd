const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`relative overflow-hidden bg-[#2A2A35] ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full skeleton-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
};

export default Skeleton;