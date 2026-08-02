import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableItem = ({ id, item, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-xl border ${
        isDragging 
          ? 'bg-[#2A2A35] border-moboxd-accent shadow-2xl scale-[1.02]' 
          : 'bg-[#1A1A21] border-[#2A2A35] hover:border-gray-500'
      } transition-colors cursor-grab active:cursor-grabbing mb-3`}
      {...attributes}
      {...listeners}
    >
      {/* Rank Number Badge */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg shrink-0 ${
        index === 0 ? 'bg-yellow-500 text-black' :
        index === 1 ? 'bg-gray-300 text-black' :
        index === 2 ? 'bg-amber-700 text-white' :
        'bg-[#2A2A35] text-moboxd-muted'
      }`}>
        {index + 1}
      </div>

      {/* Item Name */}
      <div className="flex-1 text-white font-bold text-lg tracking-wide">
        {item.name}
      </div>

      {/* Drag Handle Icon */}
      <div className="text-moboxd-muted opacity-50">
        <i className="bi bi-grip-vertical text-2xl"></i>
      </div>
    </div>
  );
};