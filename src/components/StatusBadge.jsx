import React from 'react';

const StatusBadge = ({ status, lastVerified }) => {
  const getDaysSince = () => {
    if (!lastVerified) return 14;
    const lastDate = lastVerified.toDate ? lastVerified.toDate() : new Date(lastVerified);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysSince = getDaysSince();
  
  const getStatusConfig = () => {
    if (status === 'fresh' && daysSince <= 14) {
      return {
        emoji: '🟢',
        text: 'Fresh',
        color: 'bg-green-100 text-green-800',
        daysText: `Last verified ${daysSince} ${daysSince === 1 ? 'day' : 'days'} ago`
      };
    } else {
      return {
        emoji: '🔴',
        text: 'Stale',
        color: 'bg-red-100 text-red-800',
        daysText: `Last verified ${daysSince} days ago`
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`${config.color} justify-center px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1`}>
        <span>{config.emoji}</span>
        <span>{config.text}</span>
      </span>
      <span className="text-xs text-gray-500">{config.daysText}</span>
    </div>
  );
};

export default StatusBadge;