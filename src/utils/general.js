export const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomColor = () => {
  // Generate random rgb color
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);

  // Convert to hex
  const rgb = b | (g << 8) | (r << 16);
  return '#' + (0x1000000 + rgb).toString(16).slice(1);
};
