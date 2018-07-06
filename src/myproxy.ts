import { Hapiness, HapinessModule } from '@hapiness/core';
import { ProxyExt } from './extension';
import { ProxyHandler, ProxyResponse, ProxyAuth } from './decorators';
// import { Biim } from '@hapiness/biim';

@ProxyAuth({ schemeName: 'tdw' })
class MyAuth {
    onAuthenticate(request, reply) {
        return reply.redirect('connard').takeover()
        // return reply.authenticated({credentials: {}});
    }
}

@ProxyHandler()
class MyHandler {
    onMapUri(request) {
        return {
            uri: 'http://blog.tdg.ch{path}'
        }
    }
}

@ProxyResponse()
class MyProxyResponse {
    onResponse(payload, res, req, reply) {
        // throw Biim.forbidden();
        return true;
    }
}

@HapinessModule({
    version: 'x.x.x',
    declarations: [ MyHandler, MyProxyResponse, MyAuth ]
})
class ProxyModule {
    onStart() {
        console.log('Started!');
    }
}

Hapiness.bootstrap(ProxyModule, [ ProxyExt.setConfig({ port: 8880 }) ])
.catch(err => console.log(err));
