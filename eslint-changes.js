#!/usr/bin/env node

'use strict';

var Github = require('@octokit/rest');
var eslint = require('eslint');
var util = require('util');
var exec = util.promisify(require('child_process').exec);

var cli = new eslint.CLIEngine();

// Runs eslint on the array of file pathes and returns the lint results
var runEslint = function runEslint(files) {
  return cli.executeOnFiles(cli.resolveFileGlobPatterns(files));
};

// Get a promise of an array of the paths of *.js files that changed in the commit/PR
var getChangedFilePaths = function getChangedFilePaths() {
  return exec('git diff --name-only ' + process.env.TRAVIS_COMMIT_RANGE + ' -- \'*.js\'').then(function (result) {
    var files = result.stdout.split('\n');
    // Remove the extra "" caused by the last newline
    files.pop();
    return files;
  });
};

// Gets the sha of the commit/pull request
var getCommitTarget = function getCommitTarget(eventType) {
  var sha = void 0;
  if (eventType === 'push') {
    sha = process.env.TRAVIS_COMMIT;
  } else if (eventType === 'pull_request') {
    var travisCommitRange = process.env.TRAVIS_COMMIT_RANGE;
    var parsed = travisCommitRange.split('...');
    if (parsed.length === 1) {
      sha = travisCommitRange;
    } else {
      sha = parsed[1];
    }
  } else {
    console.error('event type \'%s\' not supported', eventType);
    sha = null;
  }

  return sha;
};

// Add status with lint info to GitHub UI
var setGithubStatus = function setGithubStatus(eslintReport) {
  var errors = eslintReport.errorCount;
  var gh = new Github();
  var parsedSlug = process.env.TRAVIS_REPO_SLUG.split('/');
  var sha = getCommitTarget(process.env.TRAVIS_EVENT_TYPE);
  var state = eslintReport.errorCount > 0 ? 'failure' : 'success';
  var warnings = eslintReport.warningCount;

  var description = 'errors: ' + errors + ' warnings: ' + warnings;
  var repo = parsedSlug[1];
  var user = parsedSlug[0];
  var targetUrl = 'https://travis-ci.com/' + process.env.TRAVIS_REPO_SLUG + '/jobs/' + process.env.TRAVIS_JOB_ID;

  gh.authenticate({
    token: process.env.GITHUB_TOKEN,
    type: 'oauth'
  }, function (err) {
    if (err) console.error('Error authenticating GitHub', err);
  });

  gh.repos.createStatus({
    context: 'ESLint Changes',
    owner: user,
    target_url: targetUrl,
    description: description,
    repo: repo,
    sha: sha,
    state: state
  }, function (err) {
    if (err) console.error('Error creating GitHub status', err);
  });
};

var logEslintResults = function logEslintResults(eslintReport) {
  var formatter = cli.getFormatter();
  console.log(formatter(eslintReport.results));
};

getChangedFilePaths().then(function (files) {
  var eslintReport = runEslint(files);
  setGithubStatus(eslintReport);
  logEslintResults(eslintReport);
}).catch(function (err) {
  return console.error('Error: ', err);
});
