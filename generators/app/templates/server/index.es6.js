'use strict';

import koa from 'koa';
import hbs from 'koa-hbs';
import logger from 'koa-logger';
import config from './hbsConfig';
import render from './render';

const app = koa();

// logger
app.use(logger());

// koa-hbs is middleware. `use` it before you want to render a view
app.use(hbs.middleware(config));

// response
app.use(render(config.viewPath));

app.listen(6789);
