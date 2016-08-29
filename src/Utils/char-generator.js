let startChar = 'a';

const CharGenerator = {
  start: (value) => startChar = value,
  next: () => {
    const char = startChar;
    startChar = ((parseInt(startChar, 36) + 1).toString(36)).replace(/0/g, 'a');
    if (startChar === 'zzzz') startChar = 'a';
    return char;
  }
};

export default CharGenerator;
