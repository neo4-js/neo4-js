export class CharGenerator {
  startChar = "a";

  start = (value: string) => (this.startChar = value);

  next = (): string => {
    const char = this.startChar;
    this.startChar = (parseInt(this.startChar, 36) + 1)
      .toString(36)
      .replace(/10/g, "aa")
      .replace(/0/g, "a");
    if (this.startChar === "zzzz") this.startChar = "a";
    return char;
  };
}

export default new CharGenerator();
