'use strict';

/// config for server

import { join } from 'path';

// server port
const port = 6789;

// template dir
const templateRoot = join(process.cwd(), 'app/views');

// hbs config
const hbsConfig = {
    viewPath: templateRoot,
    layoutsPath: templateRoot + '/layouts',
    partialsPath: templateRoot + '/partials',
    extname: '.html',
    defaultLayout: 'index',
    disableCache: true
};

// Data for rendering views
// key-value pairs, key is path and value is data for that path.
const data = {
    '/': {
        title: 'Index'
    }
};

// Raw Files(response without rendering, templating, ...)
// key-value pairs, key is path and value is file for that path.
const raw = {
    '/about.html': 'about.html'
};

export default { port, templateRoot, data, raw, hbsConfig };
