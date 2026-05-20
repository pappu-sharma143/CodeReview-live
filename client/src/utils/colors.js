// A pool of distinct colors for remote cursors
// Each user who joins gets the next available color
const CURSOR_COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#96CEB4', // green
  '#FFEAA7', // yellow
  '#DDA0DD', // plum
  '#98D8C8', // mint
];

// Map of username → color so same user always gets same color
const colorMap = {};
let colorIndex = 0;

export const getColorForUser = (username) => {
  if (!colorMap[username]) {
    colorMap[username] = CURSOR_COLORS[colorIndex % CURSOR_COLORS.length];
    colorIndex++;
  }
  return colorMap[username];
};