type Category = { id: string; name: string; color: string };

export default function CategoryChip({
  category,
  selected,
  onClick,
}: {
  category: Category;
  selected?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        backgroundColor: category.color,
        outline: selected ? "2px solid #4A6FA5" : undefined,
        outlineOffset: 1,
      }}
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-[#3A3226]"
    >
      {category.name}
    </Tag>
  );
}
