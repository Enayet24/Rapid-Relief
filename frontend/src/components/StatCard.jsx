/**
 * Statistical Summary KPI Card Component
 * Module 1 & 2 - Assigned to: Ariful Islam Bijoy (ID: 22101504)
 */
export default function StatCard({
  title,
  value,
  subtext,
  icon,
  badgeText,
  badgeType = "badge-info",
  variant = "default", // 'default' | 'primary' | 'error' | 'warning' | 'success' | 'info'
  onClick,
}) {
  const getBorderColor = () => {
    switch (variant) {
      case "error":
        return "border-l-4 border-l-error";
      case "warning":
        return "border-l-4 border-l-warning";
      case "success":
        return "border-l-4 border-l-success";
      case "primary":
        return "border-l-4 border-l-primary";
      case "info":
        return "border-l-4 border-l-info";
      default:
        return "border-l-4 border-l-base-300";
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "error":
        return "bg-error/15 text-error";
      case "warning":
        return "bg-warning/15 text-warning";
      case "success":
        return "bg-success/15 text-success";
      case "primary":
        return "bg-primary/15 text-primary";
      case "info":
        return "bg-info/15 text-info";
      default:
        return "bg-base-200 text-base-content";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`card bg-base-100 shadow-sm border border-base-200 ${getBorderColor()} hover:shadow-md transition-all ${
        onClick ? "cursor-pointer hover:scale-[1.01]" : ""
      }`}
    >
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
            {title}
          </span>
          {badgeText && (
            <span className={`badge badge-sm font-semibold ${badgeType}`}>
              {badgeText}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-base-content">
              {value}
            </div>
            {subtext && (
              <p className="text-xs text-base-content/60 mt-1 font-medium">{subtext}</p>
            )}
          </div>
          {icon && (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${getIconBg()}`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
