import Router from 'koa-router';
import assert from 'assert';
import fs from 'mz/fs';
import {resolve, join} from 'path';

const rootRouter = new Router();

function serve(root, opts) {
    opts = opts || {};

    assert(root, 'root directory is required to serve files');

    root = opts.root = resolve(root);
    let index = opts.index = opts.index || 'index.html';

    rootRouter.get('*', function *(next) {
        let path = this.path;
        let absolutePath = join(root, path);
        let stats;
        try {
            stats = yield fs.stat(absolutePath);
        } catch (err) {
            return yield next;
        }
        let isDir = stats.isDirectory();
        let isFile = stats.isFile();
        if (!isDir && !isFile) {
            return yield next;
        }
        path = (isDir ? join(path, index) : path).replace(/^\//, '');
        return yield this.render(path.replace(/\.\S+$/, ''));
    });

    return rootRouter.routes();
}

export default serve;
