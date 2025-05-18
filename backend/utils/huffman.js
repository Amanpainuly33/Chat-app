class HuffmanNode {
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

class HuffmanCoding {
  constructor() {
    this.codes = {};
    this.reverseMapping = {};
  }

  buildFrequencyMap(text) {
    const frequency = {};
    for (const char of text) {
      frequency[char] = (frequency[char] || 0) + 1;
    }
    return frequency;
  }

  buildPriorityQueue(frequency) {
    const queue = [];
    for (const [char, freq] of Object.entries(frequency)) {
      queue.push(new HuffmanNode(char, freq));
    }
    queue.sort((a, b) => a.freq - b.freq);
    return queue;
  }

  buildHuffmanTree(queue) {
    while (queue.length > 1) {
      const left = queue.shift();
      const right = queue.shift();
      const node = new HuffmanNode(null, left.freq + right.freq);
      node.left = left;
      node.right = right;
      queue.push(node);
      queue.sort((a, b) => a.freq - b.freq);
    }
    return queue[0];
  }

  buildCodes(node, currentCode = '') {
    if (node.char !== null) {
      this.codes[node.char] = currentCode;
      this.reverseMapping[currentCode] = node.char;
      return;
    }
    this.buildCodes(node.left, currentCode + '0');
    this.buildCodes(node.right, currentCode + '1');
  }

  encode(text) {
    const frequency = this.buildFrequencyMap(text);
    const queue = this.buildPriorityQueue(frequency);
    const root = this.buildHuffmanTree(queue);
    this.buildCodes(root);

    let encodedText = '';
    for (const char of text) {
      encodedText += this.codes[char];
    }

    // Add padding to make the length a multiple of 8
    const padding = 8 - (encodedText.length % 8);
    encodedText = encodedText.padEnd(encodedText.length + padding, '0');

    // Convert binary string to bytes
    const bytes = [];
    for (let i = 0; i < encodedText.length; i += 8) {
      const byte = encodedText.slice(i, i + 8);
      bytes.push(parseInt(byte, 2));
    }

    return {
      encoded: Buffer.from(bytes),
      padding,
      mapping: this.reverseMapping
    };
  }

  decode(encodedData) {
    const { encoded, padding, mapping } = encodedData;
    let binaryString = '';
    
    // Convert bytes back to binary string
    for (const byte of encoded) {
      binaryString += byte.toString(2).padStart(8, '0');
    }
    
    // Remove padding
    binaryString = binaryString.slice(0, -padding);

    let decodedText = '';
    let currentCode = '';
    
    for (const bit of binaryString) {
      currentCode += bit;
      if (mapping[currentCode]) {
        decodedText += mapping[currentCode];
        currentCode = '';
      }
    }

    return decodedText;
  }
}

module.exports = HuffmanCoding; 