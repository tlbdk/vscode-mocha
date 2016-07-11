'use strict';

const
  Glob = require('glob').Glob,
  Mocha = require('mocha'),
  path = require('path'),
  Promise = require('bluebird'),
  trimArray = require('../utils').trimArray;

const
  args = JSON.parse(process.argv[2]);

createMocha(args.rootPath, args.options, args.files.glob, args.files.ignore)
  .then(mocha => crawlTests(mocha.suite))
  .then(tests => console.error(JSON.stringify(tests, null, 2)))
  .catch(err => {
    console.error(err.stack);

    process.exit(-1);
  });

function createMocha(rootPath, options, glob, ignore) {
  // const requireOptions = options.require || [];

  // if (requireOptions) {
  //   if (typeof requireOptions === 'string') {
  //     global[requireOptions] = require(requireOptions);
  //   } else {
  //     requireOptions.forEach(name => {
  //       global[name] = require(name);
  //     });
  //   }
  // }

  return new Promise((resolve, reject) => {
    new Glob(glob, { cwd: rootPath, ignore }, (err, files) => {
      if (err) { return reject(err); }

      try {
        const mocha = new Mocha(options);

        files.forEach(file => mocha.addFile(path.resolve(rootPath, file)));
        mocha.loadFiles();
        resolve(mocha);
      } catch (ex) {
        reject(ex);
      }
    });
  });
}

function crawlTests(suite) {
  let
    suites = [{ suite, path: [suite.fullTitle()] }],
    tests = [];

  while (suites.length) {
    const
      entry = suites.shift(),
      suite = entry.suite;

    tests = tests.concat(
      (suite.tests || []).map(test => {
        const name = test.title;

        return {
          name,
          fullName: trimArray(entry.path).concat([ name ]).join(' '),
          suitePath: entry.path,
          file: suite.file
        };
      })
    );

    suites = suites.concat(
      (suite.suites || []).map(suite => {
        return {
          suite,
          path: entry.path.concat(suite.fullTitle())
        };
      })
    );
  }

  return tests;
}
