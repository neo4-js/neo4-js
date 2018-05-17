let startChar = "a";

export const CharGenerator = {
  start: (value: string) => (startChar = value),
  next: (): string => {
    const char = startChar;
    startChar = (parseInt(startChar, 36) + 1)
      .toString(36)
      .replace(/10/g, "aa")
      .replace(/0/g, "a");
    if (startChar === "zzzz") startChar = "a";
    return char;
  },
};
