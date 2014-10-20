var Builder, exists, fs, get_config_path, path;

path = require("path");

fs = require("fs");

Builder = require("./").Builder;

exists = function(filepath) {
  var stats;
  console.log("Trying to find " + filepath);
  if (!fs.existsSync(filepath)) {
    return;
  }
  stats = fs.statSync(filepath);
  if (!stats.isFile()) {
    return;
  }
  return filepath;
};

get_config_path = function(arg) {
  var cwd, _ref, _ref1, _ref2, _ref3, _ref4;
  cwd = process.cwd();
  if (arg != null) {
    return (_ref = (_ref1 = (_ref2 = exists(path.resolve(cwd, arg))) != null ? _ref2 : exists(path.resolve(cwd, arg, "spa.json"))) != null ? _ref1 : exists(path.resolve(cwd, arg, "spa.yaml"))) != null ? _ref : exists(path.resolve(cwd, arg, "spa.yml"));
  }
  return (_ref3 = (_ref4 = exists(path.join(cwd, "spa.json"))) != null ? _ref4 : exists(path.join(cwd, "spa.yaml"))) != null ? _ref3 : exists(path.join(cwd, "spa.yml"));
};

exports.run = function() {
  var argv, builder, error, opts;
  opts = require('optimist').usage('Usage: $0 <build-config-file>').options({
    config: {
      describe: "path to build config file"
    },
    help: {
      boolean: true
    },
    debug: {
      boolean: true
    }
  });
  argv = opts.parse(process.argv);
  if (argv.help) {
    console.log(opts.help());
    process.exit();
  }
  path = get_config_path(argv.config);
  if (path == null) {
    console.log("Can't locate config file");
    return;
  }
  builder = Builder.from_config(path);
  try {
    return builder.build();
  } catch (_error) {
    error = _error;
    return console.log(error.toString());
  }
};
