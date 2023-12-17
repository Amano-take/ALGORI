/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * @author ManhNV
 * @type {*|Gulp}
 * @version 2020
 * @description Upgrade gulp V4 is compatibility version node >= 12
 */

const gulp = require('gulp');
const shell = require('gulp-shell');
const apidoc = require('gulp-apidoc');
const argv = require('yargs')['argv'];
const browserSync = require('browser-sync').create();

const config = {
  paths: {
    document: {
      src: 'src/api',
      dest: 'dist/public',
      includeFilters: ['.*\\.controller\\.js|ts$'],
      dirWatch: ['src/api/**/*.controller.ts'],
    },
  },
  environment: {
    local: 'local',
    staging: 'staging',
    dev2: 'dev2',
    production: 'production',
  },
};

//#region Pre-build (Document/ Another)
function copyNoneTS() {
  return gulp.src(['src/**/*', '!src/**/*.ts', '!src/types']).pipe(gulp.dest('dist/'));
}

function genDocument(done) {
  apidoc(
    {
      src: config.paths.document.src,
      dest: config.paths.document.dest,
      silent: true,
      verbose: true,
      config: `./document/${argv['env'] || 'local'}`,
      debug: true,
      includeFilters: config.paths.document.includeFilters,
    },
    done,
  );
}

function documentWatch() {
  browserSync.init({
    server: './dist/public',
  });
  gulp.watch(config.paths.document.dirWatch, genDocument);
  gulp.watch('dist/public/*.html').on('change', browserSync.reload);
}

//#endregion

//#region Testing
function executeTest(done) {
  const reports = argv['reports'] !== undefined;
  let files = argv['files'];
  files = files
    ? 'test/scripts/s00.pre.spec.{ts,js} ' + files.trim().replace(',', ' ')
    : 'test/scripts/**/*.spec.{ts,js}';
  // files = files ? 'src/**/*.test.ts' + files.trim().replace(',', ' ') : 'src/**/*.test.ts';

  shell.task([
    `cross-env NODE_ENV=test TS_NODE_FILES=true ${reports ? 'nyc' : ''} mocha ` +
      `--require ts-node/register ${
        reports ? '--opts ./mocha.cfg' : ''
      } --reporter mochawesome ${files} ${!reports ? '--timeout=50000' : ''} --exit`,
  ])(done);
}

function cleanTest(done) {
  shell.task([`rm -rf .nyc_output`])(done);
}

const test = gulp.series(cleanTest, executeTest);
//#endregion

//#region build
function compileTS(done) {
  shell.task(['rm -rf dist', 'yarn lint'])(done);
}

const buildBase = gulp.series(compileTS, copyNoneTS);

function buildEnvironment(done, env = config.environment.local) {
  return shell.task([`gulp buildBase`, `gulp genDocument --env=${env}`])(done);
}

function buildLocal(done) {
  return buildEnvironment(done);
}

function buildStaging(done) {
  return buildEnvironment(done, config.environment.staging);
}

function buildProduction(done) {
  return buildEnvironment(done, config.environment.production);
}

//#endregion

// pre-build
exports.copyNoneTS = copyNoneTS;
exports.genDocument = genDocument;
exports.documentWatch = documentWatch;
// test
exports.test = test;
// build
exports.compileTS = compileTS;
exports.buildBase = buildBase;
exports.buildLocal = buildLocal;
exports.buildStaging = buildStaging;
exports.buildProduction = buildProduction;
