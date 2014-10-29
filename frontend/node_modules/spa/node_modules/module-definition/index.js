var Walker  = require('node-source-walk'),
    types   = require('ast-module-types'),
    fs      = require('fs');

function fromSource(source) {
  if (typeof source === 'undefined') throw new Error('source not supplied');

  var type = 'none',
      walker = new Walker(),
      hasDefine = false,
      hasAMDTopLevelRequire = false,
      hasRequire = false,
      hasExports = false,
      isAMD, isCommonJS;

  walker.walk(source, function (node) {
    if (types.isDefine(node)) {
      hasDefine = true;
    }

    if (types.isRequire(node)) {
      hasRequire = true;
    }

    if (types.isExports(node)) {
      hasExports = true;
    }

    if (types.isAMDDriverScriptRequire(node)) {
      hasAMDTopLevelRequire = true;
    }
  });

  isAMD = hasDefine || hasAMDTopLevelRequire;
  isCommonJS = hasExports || (hasRequire && ! hasDefine);

  if (isAMD) {
    return 'amd';
  }

  if(isCommonJS) {
    return'commonjs';
  }

  return 'none';
}

function sync(file) {
  if (! file) throw new Error('filename missing');

  var data = fs.readFileSync(file);
  return fromSource(data.toString());
}

module.exports = function (file, cb) {
  if (! file) throw new Error('filename missing');
  if (! cb)   throw new Error('callback missing');

  var walker = new Walker();

  fs.readFile(file, function (err, data) {
    if (err) {
      console.log(err);
      return;
    }

    var src = data.toString(),
        type = fromSource(data.toString());

    if (cb) cb(type);
  });
};


module.exports.sync = sync;
module.exports.fromSource = fromSource;
