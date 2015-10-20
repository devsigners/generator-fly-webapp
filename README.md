# generator-fly-webapp [![Build Status](https://travis-ci.org/creeperyang/generator-fly-webapp.svg)](https://travis-ci.org/creeperyang/generator-fly-webapp)

> [Yeoman](http://yeoman.io) generator which scaffolds out a front-end web app with gulp.


## Getting Started

### What is Yeoman?

Trick question. It's not a thing. It's this guy:

![](http://i.imgur.com/JHaAlBJ.png)

Basically, he wears a top hat, lives in your computer, and waits for you to tell him what kind of application you wish to create.

Not every new computer comes with a Yeoman pre-installed. He lives in the [npm](https://npmjs.org) package repository. You only have to ask for him once, then he packs up and moves into your hard drive. *Make sure you clean up, he likes new and shiny things.*

```bash
npm install -g yo
```

### Yeoman Generators

Yeoman travels light. He didn't pack any generators when he moved in. You can think of a generator like a plug-in. You get to choose what type of application you wish to create, such as a Backbone application or even a Chrome extension.

To install generator-fly-webapp from npm, run:

```bash
npm install -g generator-fly-webapp
```

Finally, initiate the generator:

```bash
yo fly-webapp [appName]
```

## Features

- Powerful development server(BrowserSync for static files, Koa for API proxy and template rendering). Automatically restart server by `nodemon`.
- CSS preprocessor(`sass`), postprocessor(postcss) and sourcemap. Watch `.sass` file and automatically process it.
- Lint scripts automatically(use eslint).
- Automagically wire-up dependencies installed with [Bower](http://bower.io)
- The gulpfile is wrote in [ES2015 features](https://babeljs.io/docs/learn-es2015/).

## Release History

**`0.x` is deprecated.**

2015-10-21&nbsp;&nbsp;&nbsp;&nbsp;`v1.0.0`&nbsp;&nbsp;&nbsp;&nbsp;modify templating and rendering process; other changes.

2015-10-08&nbsp;&nbsp;&nbsp;&nbsp;`v0.3.0`&nbsp;&nbsp;&nbsp;&nbsp;add raw html demo; add gitignore config prompt.

2015-10-08&nbsp;&nbsp;&nbsp;&nbsp;`v0.2.0`&nbsp;&nbsp;&nbsp;&nbsp;serve raw html(no templating); config file change/enhance and others.

2015-09-23&nbsp;&nbsp;&nbsp;&nbsp;`v0.1.1`&nbsp;&nbsp;&nbsp;&nbsp;include normolize.css correctly; other small changes.

2015-09-22&nbsp;&nbsp;&nbsp;&nbsp;`v0.1.0`&nbsp;&nbsp;&nbsp;&nbsp;init

## License

MIT
