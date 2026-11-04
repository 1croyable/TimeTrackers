export function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return [year, month, day].join('-');
}

export function formatDuration(seconds: number, showSeconds: boolean = false): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsRemaining = seconds % 60;

  if (showSeconds) {
    return hours + ' h ' + minutes + ' m ' + secondsRemaining.toFixed(1) + ' s';
  }
  else {
    return hours + ' h ' + minutes + ' m';
  }
}

export function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(1);
}

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
