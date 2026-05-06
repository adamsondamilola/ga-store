export default function PageHeader({
  title,
  subtitle,
  rightContent,
}) {
  return (
    <div className="text-start flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-950">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 md:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}