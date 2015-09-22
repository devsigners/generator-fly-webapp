'use strict';

import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import {stream as wiredep} from 'wiredep';
import del from 'del';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const AUTOPREFIXER_BROWSERS = [
    'Android 2.3',
    'Android >= 4',
    'Chrome >= 20',
    'Firefox >= 24',
    'Explorer >= 8',
    'iOS >= 6',
    'Opera >= 12',
    'Safari >= 6'
];
const paths = {
    srcScripts: ['server/**/*.es6.js'],
    srcDest: '.tmp/server'
};

//
// ------ assets ------
//
gulp.task('images', () => {
    return gulp.src('app/images/**/*')
        .pipe($.if($.if.isFile, $.cache($.imagemin({
            progressive: true,
            interlaced: true,
            // don't remove IDs from SVGs, they are often used
            // as hooks for embedding and styling
            svgoPlugins: [{
                cleanupIDs: false
            }]
        }))
        .on('error', err => {
            console.log(err);
            this.end();
        })))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
    return gulp.src(require('main-bower-files')({
        filter: '**/*.{eot,svg,ttf,woff,woff2}'
    }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
    return gulp.src([
        'app/*.*',
        '!app/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});

gulp.task('styles', function() {<% if (includeSass) { %>
    return gulp.src('app/styles/*.scss')
        .pipe($.sourcemaps.init())
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))<% } else { %>
    return gulp.src('app/styles/*.css')
        .pipe($.sourcemaps.init())<% } %>
        .pipe($.autoprefixer({
            browsers: AUTOPREFIXER_BROWSERS
        }))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('.tmp/styles'))
        .pipe(reload({
            stream: true
        }));
});

// inject bower components
gulp.task('wiredep', function() {<% if (includeSass) { %>
    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            ignorePath: /^(\.\.\/)+/,
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
        }))
        .pipe(gulp.dest('app/styles'));
<% } %>
    gulp.src('app/views/*.html')
        .pipe(wiredep({<% if (includeBootstrap) { if (includeSass) { %>
            exclude: ['bootstrap-sass'],<% } else { %>
            exclude: ['bootstrap.js'],<% }} %>
            ignorePath: /^(\.\.\/)*\.\./
        }))
        .pipe(gulp.dest('app/views'));
});

gulp.task('html', ['styles'], () => {
    const assets = $.useref.assets({
        searchPath: ['.tmp', 'app', '.']
    });

    return gulp.src('app/views/**/*.html')
        .pipe(assets)
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.minifyCss({
            compatibility: '*'
        })))
        .pipe(assets.restore())
        .pipe($.useref())
        // .pipe($.if('*.html', $.minifyHtml({
        //     conditionals: true,
        //     loose: true
        // })))
        .pipe($.if('*.js', gulp.dest('dist')))
        .pipe($.if('*.css', gulp.dest('dist')))
        .pipe($.if('*.html', gulp.dest('dist/views')));
});


//
// ------ lint ------
//
const lint = (files, options) => {
    return () => gulp.src(files)
        .pipe(reload({
            stream: true,
            once: true
        }))
        .pipe($.eslint(options))
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
};
gulp.task('lint', lint('app/scripts/**/*.js'));
gulp.task('lint:server', lint(['server/**/*.es6.js', 'gulpfile.js', 'gulpfile.es6.js']));

//
// ------ proxy server ------
//
gulp.task('compile:server', ['lint:server'], () => {
    return gulp.src(paths.srcScripts)
        .pipe($.rename(path => {
            path.basename = path.basename.replace(/\.es6/, '');
        }))
        .pipe($.babel({
            optional: ['runtime']
        }))
        .pipe(gulp.dest(paths.srcDest));
});

gulp.task('run:proxy', ['compile:server', 'wiredep'], (done) => {
    let started = false;
    let reloaded = false;
    let entryPath = paths.srcDest + '/index.js';
    let nodemon = $.nodemon({
        execMap: {
            // We don't compile koa with babel, so use harmony flag instead.
            // for node v4+, es6 features used by koa are default supported.
            js: 'node --harmony'
        },
        ignore: ['*.*'], // disable nodemon's watch
        ext: 'js',
        script: entryPath
    }).on('start', () => {
        // to avoid nodemon being started multiple times
        if (!started) {
            done();
            started = true;
        }
        if (reloaded) {
            reloaded = false;
            console.log('restart server')
            // restart server will take some time, let browserSync reload next turn and after 300ms?
            // If reload failed (reload before server restarted), set the time more than 300 or just reload manually.
            setTimeout(() => reload(), 300);
        }
    }).on('restart', () => {
        reloaded = true;
    });

    // watch and restart server
    gulp.watch('server/**/*.es6.js', ['compile:server']);
    gulp.watch(entryPath, function() {
        nodemon.emit('restart');
    });
    return nodemon;
});

//
// ------ server ------
//
gulp.task('serve', ['styles', 'run:proxy'], () => {
    browserSync.init(null, {
        proxy: {
            target: 'http://localhost:6789/',
            middleware: function(req, res, next) {
                // do whatever you like
                next();
            }
        },
        serveStatic: ['.tmp', 'app'],
        // browser: ["google chrome", "firefox"],
        logPrefix: 'BS',
        port: 7000,
    });

    gulp.watch([
        'app/views/**/*.html',
        'app/scripts/**/*.js',
        'app/images/**/*',
        '.tmp/css/*'
    ]).on('change', reload);
    gulp.watch('app/scripts/**/*.js', ['lint']);
    gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', ['styles']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep']);
});

//
// ------ build ------
//
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
    return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['build']);
