'use strict';

import Router from 'koa-router';
import send from 'koa-send';
import Debug from 'debug';
import assert from 'assert';
import fs from 'mz/fs';
import {basename, dirname, resolve, join} from 'path';

const debug = Debug('koa-static');
const rootRouter = new Router();

function serve(root, opts) {
    opts = opts || {};

    assert(root, 'root directory is required to serve files');
    debug('static "%s" %j', root, opts);

    root = opts.root = resolve(root);
    let index = opts.index = opts.index || 'index.html';

    rootRouter.get('*', function* (next) {
        let path = this.path;
        let stats;
        try {
            stats = yield fs.stat(join(root, path));
        } catch (err) {
            return yield next;
        }
        let isDir = stats.isDirectory();
        let isFile = !isDir && stats.isFile();
        if (isDir || isFile) {
            path = (isDir ? join(path, index) : path).replace(/^\//, '').replace(/\.\S+$/, '');
            return yield this.render(path);
        }
        yield next;
    });

    if (!opts.static) {
        return rootRouter.routes();
    }

    return function* serve(next) {
        yield * next;

        if (this.method !== 'HEAD' && this.method !== 'GET') return;
        // response is already handled
        if (this.body != null || this.status !== 404) return;

        yield send(this, this.path, opts);
    };
}

export default serve;
