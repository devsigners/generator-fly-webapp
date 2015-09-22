'use strict';

var path = require('path');
var helpers = require('yeoman-generator').test;
var assert = require('yeoman-generator').assert;

describe('temp:app', function() {
    before(function(done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withArguments('Test')
            .withOptions({
                'skip-install': true,
                'test-framework': 'mocha'
            })
            .withPrompts({
                features: [],
                uiLib: 'bootstrap',
                appVersion: '1.0.0',
                appLicense: 'MIT'
            })
            .on('end', done);
    });

    it('creates files', function() {
        assert.file([
            'bower.json',
            'package.json',
            'gulpfile.es6.js',
            'gulpfile.js',
            '.editorconfig',
            '.bowerrc',
            '.eslintrc',
            '.gitignore',
            '.gitattributes',
            'app/views/index.html',
            'app/scripts/app.js',
            'app/styles/app.css',
            'app/images',
            'app/fonts',
            'server',
            'test'
        ]);
    });
});
