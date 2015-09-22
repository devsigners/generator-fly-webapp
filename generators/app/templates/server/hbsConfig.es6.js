'use strict';

import path from 'path';
import hbs from 'koa-hbs';

const viewPath = path.join(process.cwd(), 'app/views');
const layoutsPath = viewPath + '/layouts';
const partialsPath = viewPath + '/partials';
const extname = '.html';
const defaultLayout = 'index';
const disableCache = true;

// inject some helpers to hbs.

// json
hbs.registerHelper('json', function(arg) {
    return arg == null ? '' : new hbs.SafeString(JSON.stringify(arg));
});

export default {viewPath, extname, partialsPath, layoutsPath, defaultLayout, disableCache};
