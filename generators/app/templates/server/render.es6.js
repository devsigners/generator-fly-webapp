'use strict';

import Router from 'koa-router';
import send from 'koa-send';
import Debug from 'debug';
import assert from 'assert';
import fs from 'mz/fs';
import { basename, dirname, resolve, join, isAbsolute } from 'path';
import { data as pageData, raw } from './config';

const debug = Debug('koa-fly-render');
const rootRouter = new Router();

function serve(root, opts) {
    opts = opts || {};

    assert(root, 'root directory is required to serve files');
    debug('static "%s" %j', root, opts);

    root = opts.root = resolve(root);
    let index = opts.index = opts.index || 'index.html';

    rootRouter.get('*', function* (next) {
        let path = this.path;
        let data = pageData[path];
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
        let rawPath = raw[path];
        path = (isDir ? join(path, index) : path).replace(/^\//, '');
        if (rawPath !== undefined) {
            if (rawPath === '') {
                rawPath = path;
            }
            if (!isAbsolute(rawPath)) {
                rawPath = join(root, path);
            }
            return yield send(this, rawPath);
        }
        return yield this.render(path.replace(/\.\S+$/, ''), data);
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
