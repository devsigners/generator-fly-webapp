import {join} from 'path';

// server port
const port = 6789;

// template dir
const templateRoot = join(process.cwd(), 'app/views');

// hbs config
const hbsConfig = {
    viewPath: templateRoot,
    dataPath: templateRoot + '/data',
    layoutsPath: templateRoot + '/layouts',
    partialsPath: templateRoot + '/partials',
    extname: '.html',
    defaultLayout: 'index',
    disableCache: true
};

export default {port, templateRoot, hbsConfig};
