// Minimal jsPDF mock for tests
function jsPDF() {
  return {
    text: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    addImage: jest.fn(),
    line: jest.fn(),
    setDrawColor: jest.fn(),
    setTextColor: jest.fn(),
    rect: jest.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  };
}

module.exports = { jsPDF };
