expect.extend({
  toEndWith(received, actual) {
    const pass = endsWith(received, actual);
    const message = () =>
      `expected ${received} ${pass ? 'not ' : ''} to end with ${actual}`;
    return { message, pass };
  }
});

function endsWith(subjectString, searchString, position) {
  if (
    typeof position !== 'number' ||
    !isFinite(position) ||
    Math.floor(position) !== position ||
    position > subjectString.length
  ) {
    position = subjectString.length;
  }
  position -= searchString.length;
  var lastIndex = subjectString.lastIndexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}
