export default class CharGenerator {
  constructor(startChar) {
    this.startChar = startChar || 'a';
  }

  get next() {
    const char = this.startChar;
    this.startChar = ((parseInt(this.startChar, 36) + 1).toString(36)).replace(/0/g, 'a');
    return char;
  }
}
