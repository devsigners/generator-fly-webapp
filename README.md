# generator-fly-webapp

> [Yeoman](http://yeoman.io) generator which scaffolds out a front-end web app with gulp.

[![Build Status](https://travis-ci.org/creeperyang/generator-fly-webapp.svg)](https://travis-ci.org/creeperyang/generator-fly-webapp)

## Getting Started

[Yeoman](http://yeoman.io/) is *THE WEB'S SCAFFOLDING TOOL FOR MODERN WEBAPPS*.

> Yeoman helps yo
u to kickstart new projects, prescribing best practices and tools to help you stay productive.

> To do so, we provide a generator ecosystem. A generator is basically a plugin that can be run with the `yo` command to scaffold complete projects or useful parts.

And `generator-fly-webapp` is a generator to help you to scaffold out a front-end web app.

### Installation

To install generator-fly-webapp from npm, run:

```bash
npm install -g yo generator-fly-webapp
```

Then, initiate the generator:

```bash
yo fly-webapp [appName]
```

Finally, start the app:

```bash
# if dependencies were installed, ignore next line
npm install && bower install

gulp serve
```

You can visit `http://0.0.0.0:7000/`.

## Features

&nbsp; &nbsp; ✓ Powerful development server(BrowserSync for static files, Koa for API proxy and template rendering). Automatically restart server by `nodemon`.<br>
&nbsp; &nbsp; ✓ Handlebars templating support. And every view file can use yaml head to specify layout, data file and other settings.<br>
&nbsp; &nbsp; ✓ CSS preprocessor(`sass`), postprocessor(postcss) and sourcemap. Watch `.sass` file and automatically process it.<br>
&nbsp; &nbsp; ✓ Lint scripts automatically(use eslint).<br>
&nbsp; &nbsp; ✓ Automagically wire-up dependencies installed with [Bower](http://bower.io)<br>
&nbsp; &nbsp; ✓ The gulpfile is wrote in [ES2015 features](https://babeljs.io/docs/learn-es2015/).

### Koa Server

Koa is used to render handlebars templates and proxy API currently. But it's easy to enhance it and serve as a product server.

### Handlebars

Handlebars is the default template. And some excited features are supported.

1. Every view file can has a yaml head, just like `github jekyll blog system`. And inside head we can specify its own `layout`, `data file` and so on.
2. The `data file` means data for template rendering. The plugin will load the data file with the same name of view file default.
3. It's ok to set `layout: false` inside yaml head, and this will close layout and render template just like static html file.

### ES2015

Besides gulpfile, the whole server side code is wrote in `ES2015`. Feel ease and embrace it.

### Credits

- `koa-handlebars.es6.js` rewrite based on [`koa-hbs`](https://github.com/jwilm/koa-hbs). Because of `yaml` support, layout dynamic load and other features, rewrite `koa-hbs` instead of depend on it.
- Borrowed base config and some gulp tasks from [`generator-gulp-webapp`](https://github.com/yeoman/generator-gulp-webapp).

Thanks for their great work.

## Release History

**`0.x` is deprecated.**

2015-10-21&nbsp;&nbsp;&nbsp;&nbsp;`v1.0.1`&nbsp;&nbsp;&nbsp;&nbsp;fix render data priority.

2015-10-21&nbsp;&nbsp;&nbsp;&nbsp;`v1.0.0`&nbsp;&nbsp;&nbsp;&nbsp;modify templating and rendering process; other changes.

2015-10-08&nbsp;&nbsp;&nbsp;&nbsp;`v0.3.0`&nbsp;&nbsp;&nbsp;&nbsp;add raw html demo; add gitignore config prompt.

2015-10-08&nbsp;&nbsp;&nbsp;&nbsp;`v0.2.0`&nbsp;&nbsp;&nbsp;&nbsp;serve raw html(no templating); config file change/enhance and others.

2015-09-23&nbsp;&nbsp;&nbsp;&nbsp;`v0.1.1`&nbsp;&nbsp;&nbsp;&nbsp;include normolize.css correctly; other small changes.

2015-09-22&nbsp;&nbsp;&nbsp;&nbsp;`v0.1.0`&nbsp;&nbsp;&nbsp;&nbsp;init

## License

MIT
