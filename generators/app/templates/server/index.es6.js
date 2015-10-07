'use strict';

import koa from 'koa';
import hbs from 'koa-hbs';
import logger from 'koa-logger';
import { hbsConfig, templateRoot, port } from './config';
import render from './render';
import extendHbs from './hbsExtend';

const app = koa();

// logger
app.use(logger());

// koa-hbs is middleware. `use` it before you want to render a view
extendHbs(hbs);
app.use(hbs.middleware(hbsConfig));

// response
app.use(render(templateRoot));

app.listen(port);
