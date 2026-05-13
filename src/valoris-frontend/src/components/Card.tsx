import type { ReactNode } from 'react';
import './Card.css';

interface Props {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Card({ title, children, actions }: Props) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
