import { Type, extractMetadataByDecorator, CoreModule, DependencyInjection } from '@hapiness/core';
import { ProxyConfig } from './extension';
import { Observable } from 'rxjs';
import { Biim } from '@hapiness/biim';
import * as Hapi from 'hapi';
import * as H2o2 from 'h2o2';
import { ProxyAuth } from './decorators';
// import * as Wreck from 'wreck';

export class ProxyManager {
    private server: Hapi.Server;
    private handler;
    private response;
    private auth;

    constructor(module: CoreModule, config: ProxyConfig) {
        this.server = new Hapi.Server(<any>config);
    }

    start(module: CoreModule): Observable<any> {
        return Observable
            .fromPromise(this.server.register(<any>{ plugin: H2o2 }))
            .flatMap(() => this.server.start())
            .flatMap(() => this.instantiateHandler(module).do(_ => this.handler = _))
            .flatMap(() => this.instantiateProxyResponse(module).do(_ => this.response = _))
            .flatMap(() => this.instantiateProxyAuth(module).do(_ => this.auth = _))
            .do(() => {
                if (this.auth) {
                    const meta = extractMetadataByDecorator<ProxyAuth>(this.auth.token, 'ProxyAuth');
                    const scheme = (server, options) => {
                        return {
                            authenticate: (request, h) => {
                                // const authorization = request.headers.authorization;
                                // if (!authorization) {
                                //     throw Biim.unauthorized(null, 'Custom');
                                // }
                                // return h.authenticated({ credentials: { user: 'john' } });
                                return this.triggerHook('onAuthenticate', this.auth.token, this.auth.instance, [ request, h ]);
                            }
                        };
                    };
                    this.server.auth.scheme(meta.schemeName, scheme);
                    this.server.auth.strategy('default', meta.schemeName);
                    this.server.auth.default('default');
                }
                this.server.route({
                    method: '*',
                    path: '/{p*}',
                    handler: {
                        proxy: {
                            passThrough: true,
                            mapUri: request => this.requestHandler(request),
                            onResponse: (err, res, req, reply) => {
                                if (err) {
                                    return reply.response(Biim.wrap(err));
                                }
                                const result = this.responseHandler(null, res, req, reply);
                                if (result === true) {
                                    return reply.response(res)
                                        .code(res.statusCode)
                                        .passThrough(true);
                                } else {
                                    return result;
                                }
                            }
                        }
                    }
                });
            });
    }

    shutdown(): Observable<void> {
        return Observable.fromPromise(this.server.stop());
    }

    private instantiateHandler(module: CoreModule) {
        const handler = this.getProxyHandler(module.declarations);
        return DependencyInjection
            .instantiateComponent(handler, module.di)
            .map(_ => ({ token: handler, instance: _ }));
    }

    private instantiateProxyResponse(module: CoreModule) {
        const handler = this.getProxyResponse(module.declarations);
        return DependencyInjection
            .instantiateComponent(handler, module.di)
            .map(_ => ({ token: handler, instance: _ }));
    }

    private instantiateProxyAuth(module: CoreModule) {
        const handler = this.getProxyAuth(module.declarations);
        if (handler) {
            return DependencyInjection
                .instantiateComponent(handler, module.di)
                .map(_ => ({ token: handler, instance: _ }));
        } else {
            return Observable.of(null);
        }
    }

    private requestHandler(request: Hapi.Request) {
        const res = this.triggerHook('onMapUri', this.handler.token, this.handler.instance, [ request ]);
        return this.mapUri(res.uri, res.headers)(request);
    }

    private responseHandler(payload, req: Hapi.Request, res, reply) {
        return this.triggerHook('onResponse', this.response.token, this.response.instance, [ payload, req, res, reply ]);
    }

    private getProxyHandler(declarations: Type<any>[]): Type<any> {
        const res = []
            .concat(declarations)
            .filter(_ => !!_ && !!extractMetadataByDecorator(_, 'ProxyHandler'));
        if (res.length !== 1) {
            throw new Error('ProxyHandler need to have one definition');
        }
        return res.shift();
    }

    private getProxyResponse(declarations: Type<any>[]): Type<any> {
        const res = []
            .concat(declarations)
            .filter(_ => !!_ && !!extractMetadataByDecorator(_, 'ProxyResponse'));
        if (res.length !== 1) {
            throw new Error('ProxyResponse need to have one definition');
        }
        return res.shift();
    }

    private getProxyAuth(declarations: Type<any>[]): Type<any> {
        const res = []
            .concat(declarations)
            .filter(_ => !!_ && !!extractMetadataByDecorator(_, 'ProxyAuth'));
        if (res.length > 1) {
            throw new Error('ProxyAuth cannot have more than one definition');
        }
        return res.shift();
    }

    private hasLifecycleHook<T>(hook: string, token: Type<T>): boolean {
        return token instanceof Type && hook in token.prototype;
    }

    private triggerHook<T>(hook: string, token: Type<any>, instance: T, args?: any[]): any {
        if (this.hasLifecycleHook(hook, token)) {
            return Reflect.apply(instance[hook], instance, args || []);
        }
        throw new Error(`${hook} is not implemented on ${token.name}`);
    }

    private mapUri(uri, headers) {
        return function (request) {
            if (uri.indexOf('{') === -1) {
                return { uri };
            }
            let address = uri.replace(/{protocol}/g, request.server.info.protocol)
                .replace(/{host}/g, request.server.info.host)
                .replace(/{port}/g, request.server.info.port)
                .replace(/{path}/g, request.url.path);
            Object.keys(request.params).forEach((key) => {
                const re = new RegExp(`{${key}}`, 'g');
                address = address.replace(re, request.params[key]);
            });
            return {
                uri: address,
                headers
            };
        };
    }
}
