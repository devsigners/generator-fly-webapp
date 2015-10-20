'use strict';

var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var _s = require('underscore.string');
var mkdirp = require('mkdirp');
var wiredep = require('wiredep');

module.exports = yeoman.generators.Base.extend({
    constructor: function () {
        var testLocal;

        yeoman.generators.Base.apply(this, arguments);

        this.argument('appName', {
            type: 'String',
            optional: true,
            required: false,
            banner: 'app name'
        });

        this.option('skip-welcome-message', {
            desc: 'Skips the welcome message',
            type: Boolean
        });

        this.option('skip-install-message', {
            desc: 'Skips the message after the installation of dependencies',
            type: Boolean
        });

        this.option('test-framework', {
            desc: 'Test framework to be invoked',
            type: String,
            defaults: 'mocha'
        });

        if (this.options['test-framework'] === 'mocha') {
            testLocal = require.resolve('generator-mocha/generators/app/index.js');
        } else if (this.options['test-framework'] === 'jasmine') {
            testLocal = require.resolve('generator-jasmine/generators/app/index.js');
        }

        this.composeWith(this.options['test-framework'] + ':app', {
            options: {
                'skip-install': this.options['skip-install']
            }
        }, {
            local: testLocal
        });

    },
    prompting: function() {
        var done = this.async();

        if (!this.options['skip-welcome-message']) {
            this.log(yosay(
                'Welcome to ' + chalk.red('FlyWebapp') + ' generator!\nThe project includes jQuery, Bootstrap and a gulpfile to build your app.'
            ));
        }

        var prompts = [{
                type: 'input',
                name: 'appVersion',
                message: 'What\'s app\'s version?',
                default: '0.0.0'
        }, {
                type: 'input',
                name: 'appLicense',
                message: 'What\'s app\'s license?',
                default: 'MIT'
        }, {
            type: 'list',
            name: 'uiLib',
            message: 'Which ui lib do you want to include?',
            choices: [{
                name: 'Normalize.css',
                value: 'normalize'
            }, {
                name: 'Bootstrap',
                value: 'bootstrap'
            }, {
                name: 'None',
                value: 'none'
            }]
        }, {
            type: 'checkbox',
            name: 'features',
            message: 'What more would you like?',
            choices: [{
                name: 'Sass',
                value: 'includeSass',
                checked: true
            }, {
                name: 'Modernizr',
                value: 'includeModernizr',
                checked: false
            }]
        }, {
            type: 'confirm',
            name: 'includeJQuery',
            message: 'Would you like to include jQuery?',
            default: true,
            // whether should be asked
            when: function(answers) {
                return answers.uiLib !== 'bootstrap';
            }
        }, {
            type: 'list',
            name: 'gitIgnoreType',
            message: 'Which files upload to repo?',
            choices: [{
                name: 'Default',
                value: 'default'
            }, {
                name: 'Minimal (only focus on source files).',
                value: 'minimal'
            }]
        }];

        if(!this.appName) {
            prompts.unshift({
                type: 'input',
                name: 'appName',
                message: 'What\'s app\'s name?',
                default: path.basename(process.cwd())
            });
        }

        this.prompt(prompts, function(answers) {
            var features = answers.features;
            function hasFeature(feat) {
                return features && features.indexOf(feat) !== -1;
            };

            this.uiLib = answers.uiLib;
            this.includeSass = hasFeature('includeSass');
            this.includeModernizr = hasFeature('includeModernizr');
            this.includeBootstrap = this.uiLib === 'bootstrap';
            // #Inquirer.js Bug here: includeJQuery is undefined, not the default value true, if when function return false.
            this.includeJQuery = answers.includeJQuery || this.includeBootstrap;

            this.appName = this.appName || answers.appName;
            this.appVersion = answers.appVersion;
            this.appLicense = answers.appLicense;

            this.gitIgnoreType = answers.gitIgnoreType;

            done();
        }.bind(this));
    },

    writing: {
        packageJSON: function() {
            this.template(
                this.templatePath('_package.json'),
                this.destinationPath('package.json'), {
                    includeSass: this.includeSass,
                    license: this.appLicense,
                    version: this.appVersion,
                    name: this.appName
                }
            );
        },
        gulpfile: function() {
            this.template(
                this.templatePath('_gulpfile.es6.js'),
                this.destinationPath('gulpfile.es6.js'), {
                    includeSass: this.includeSass,
                    uiLib: this.uiLib,
                    includeBootstrap: this.uiLib === 'bootstrap'
                }
            );
            this.fs.copy(
                this.templatePath('_gulpfile.js'),
                this.destinationPath('gulpfile.js'));
        },
        git: function() {
            this.template(
                this.templatePath('gitignore'),
                this.destinationPath('.gitignore'), {
                    gitIgnoreType: this.gitIgnoreType
                }
            );

            this.fs.copy(
                this.templatePath('gitattributes'),
                this.destinationPath('.gitattributes'));
        },
        bower: function() {
            var bowerJson = {
                name: _s.slugify(this.appName),
                version: this.appVersion,
                license: this.appLicense,
                private: true,
                dependencies: {}
            };

            if (this.includeBootstrap) {
                if (this.includeSass) {
                    bowerJson.dependencies['bootstrap-sass'] = '~3.3.5';
                    bowerJson.overrides = {
                        'bootstrap-sass': {
                            'main': [
                                'assets/stylesheets/_bootstrap.scss',
                                'assets/fonts/bootstrap/*',
                                'assets/javascripts/bootstrap.js'
                            ]
                        }
                    };
                } else {
                    bowerJson.dependencies['bootstrap'] = '~3.3.5';
                    bowerJson.overrides = {
                        'bootstrap': {
                            'main': [
                                'less/bootstrap.less',
                                'dist/css/bootstrap.css',
                                'dist/js/bootstrap.js',
                                'dist/fonts/*'
                            ]
                        }
                    };
                }
            } else if (this.includeJQuery) {
                bowerJson.dependencies['jquery'] = '~1.11.3';
            }

            if (this.includeModernizr) {
                bowerJson.dependencies['modernizr'] = '~2.8.1';
            }
            if (this.uiLib === 'normalize') {
                bowerJson.dependencies['normalize.css'] = '~3.0.3';
            }
            this.fs.writeJSON('bower.json', bowerJson);
            this.fs.copy(
                this.templatePath('bowerrc'),
                this.destinationPath('.bowerrc')
            );
        },
        editorConfig: function() {
            this.fs.copy(
                this.templatePath('editorconfig'),
                this.destinationPath('.editorconfig')
            );
        },
        babelrc: function() {
            this.fs.copy(
                this.templatePath('babelrc'),
                this.destinationPath('.babelrc')
            );
        },
        lint: function() {
            this.fs.copy(
                this.templatePath('eslintrc'),
                this.destinationPath('.eslintrc')
            );
        },
        styles: function() {
            var css = 'app';
            if (this.includeSass) {
                css += '.scss';
            } else {
                css += '.css';
            }
            this.template(
                this.templatePath(css),
                this.destinationPath('app/styles/' + css), {
                    includeBootstrap: this.includeBootstrap
                }
            );
        },
        scripts: function() {
            this.fs.copy(
                this.templatePath('app.js'),
                this.destinationPath('app/scripts/app.js')
            );
        },
        html: function() {
            var bsPath;
            // path prefix for Bootstrap JS files
            if (this.includeBootstrap) {
                bsPath = '/bower_components/';
                if (this.includeSass) {
                    bsPath += 'bootstrap-sass/assets/javascripts/bootstrap/';
                } else {
                    bsPath += 'bootstrap/js/';
                }
            }
            this.fs.copy(this.templatePath('views/partials/footer.html'), this.destinationPath('app/views/partials/footer.html'));
            this.template(
                this.templatePath('views/partials/header.html'),
                this.destinationPath('app/views/partials/header.html'), {
                    appName: this.appName,
                    includeModernizr: this.includeModernizr
                }
            );
            this.directory('views/layouts', 'app/views/layouts');
            this.directory('views/data', 'app/views/data');
            // this.fs.copy(
            //     this.templatePath('views/layouts/index.html'),
            //     this.destinationPath('app/views/layouts/index.html')
            // );
            this.fs.copy(
                this.templatePath('views/about.html'),
                this.destinationPath('app/views/about.html')
            );
            this.fs.copy(
                this.templatePath('views/simple.html'),
                this.destinationPath('app/views/simple.html')
            );
            this.template(
                this.templatePath('views/index.html'),
                this.destinationPath('app/views/index.html'), {
                    //appName: this.appName,
                    //includeSass: this.includeSass,
                    includeBootstrap: this.includeBootstrap,
                    includeModernizr: this.includeModernizr,
                    includeJQuery: this.includeJQuery,
                    bsPath: bsPath,
                    bsPlugins: [
                        'affix',
                        'alert',
                        'dropdown',
                        'tooltip',
                        'modal',
                        'transition',
                        'button',
                        'popover',
                        'carousel',
                        'scrollspy',
                        'collapse',
                        'tab'
                    ]
                }
            );
        },
        server: function() {
            this.directory('server', 'server');
        },
        misc: function() {
            mkdirp('app/images');
            mkdirp('app/fonts');
        }
    },
    install: function() {
        this.installDependencies({
            skipMessage: this.options['skip-install-message'],
            skipInstall: this.options['skip-install']
        });
    },
    end: function() {
        var bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
        var howToInstall =
            '\nAfter running ' +
            chalk.yellow.bold('npm install & bower install') +
            ', inject your' +
            '\nfront end dependencies by running ' +
            chalk.yellow.bold('gulp wiredep') +
            '.';

        if (this.options['skip-install']) {
            this.log(howToInstall);
            return;
        }

        // wire Bower packages to .html
        wiredep({
            bowerJson: bowerJson,
            directory: 'app/bower_components',
            exclude: ['bootstrap-sass', 'bootstrap.js'],
            ignorePath: /^(\.\.\/)*\.\./,
            src: 'app/views/index.html'
        });

        if (this.includeSass) {
            // wire Bower packages to .scss
            wiredep({
                bowerJson: bowerJson,
                directory: 'app/bower_components',
                ignorePath: /^(\.\.\/)+/,
                src: 'app/styles/*.scss',
                fileTypes: {
                    scss: {
                        block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
                        detect: {
                            css: /@import\s['"](.+css)['"]/gi,
                            sass: /@import\s['"](.+sass)['"]/gi,
                            scss: /@import\s['"](.+scss)['"]/gi
                        },
                        replace: {
                            css: '@import "../{{filePath}}";',
                            sass: '@import "../{{filePath}}";',
                            scss: '@import "../{{filePath}}";'
                        }
                    }
                }
            });
        }
    }
});
