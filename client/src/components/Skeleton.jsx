const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-[#2A2A35] ${className}`}
    />
  );
};

export default Skeleton;