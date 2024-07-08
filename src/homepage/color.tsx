export const getRandomColor = () => {
  const colors = [
    '#F44336', // Красный
    '#E91E63', // Розовый
    '#9C27B0', // Фиолетовый
    '#673AB7', // Темно-фиолетовый
    '#3F51B5', // Индиго
    '#2196F3', // Синий
    '#03A9F4', // Голубой
    '#00BCD4', // Бирюзовый
    '#009688', // Зеленый
    '#4CAF50', // Темно-зеленый
    '#8BC34A', // Лайм
    '#CDDC39', // Желтый
    '#FFEB3B', // Ярко-желтый
    '#FFC107', // Оранжевый
    '#FF9800', // Темно-оранжевый
    '#FF5722', // Красно-оранжевый
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
