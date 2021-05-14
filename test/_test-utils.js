module.exports.argsListHas = function argsListHas(args, field) {
  return (
    args.filter(function(item) {
      return item === field;
    }).length > 0
  );
};

module.exports.getOptionValue = function getOptionValue(args, field) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === field && i < args.length - 1) {
      return args[i + 1];
    }
  }
};
