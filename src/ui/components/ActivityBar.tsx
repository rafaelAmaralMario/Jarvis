import { ActivityView } from '../types';
import { activityItems } from '../constants';
import jarvisIcon from '../../assets/jarvis-icon.svg';

interface ActivityBarProps {
  activeView: ActivityView;
  onActiveViewChange: (view: ActivityView) => void;
}

export function ActivityBar({ activeView, onActiveViewChange }: ActivityBarProps) {
  return (
    <aside className="activity-bar" aria-label="Navegacao principal">
      <span className="activity-logo">
        <img alt="JARVIS" src={jarvisIcon} />
      </span>
      {activityItems.map((item) => (
        <button
          className={activeView === item.id ? 'activity-button active' : 'activity-button'}
          key={item.id}
          onClick={() => onActiveViewChange(item.id)}
          title={item.label}
          type="button"
        >
          <item.Icon size={17} />
        </button>
      ))}
    </aside>
  );
}
