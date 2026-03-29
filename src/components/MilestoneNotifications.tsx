type NotificationItem = {
  projectName: string;
  milestoneType: string;
  date: string;
  daysLeft: number;
};

type Props = {
  notifications: NotificationItem[];
};

export default function MilestoneNotifications({ notifications }: Props) {
  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2">
      {notifications.map((n, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-xl text-sm shadow-sm"
        >
          <span className="text-amber-500 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          <span className="flex-1 text-amber-800">
            <span className="font-semibold">{n.projectName}</span>
            <span className="mx-1.5 text-amber-400">—</span>
            <span>{n.milestoneType}</span>
            <span className="mx-1.5 text-amber-400">·</span>
            <span>{n.date}</span>
          </span>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
            n.daysLeft === 0
              ? "bg-red-100 text-red-600"
              : n.daysLeft <= 1
              ? "bg-orange-100 text-orange-600"
              : "bg-amber-100 text-amber-600"
          }`}>
            {n.daysLeft === 0 ? "今日" : `あと${n.daysLeft}日`}
          </span>
        </div>
      ))}
    </div>
  );
}
