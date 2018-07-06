import {
    OnExtensionLoad,
    OnShutdown,
    ExtensionWithConfig,
    CoreModule,
    Extension,
    ExtensionShutdown,
    ExtensionShutdownPriority,
    OnModuleInstantiated
} from '@hapiness/core';
import { Observable } from 'rxjs/Observable';
import { ProxyManager } from './manager';

export interface ProxyConfig {
    host?: string;
    port: number;
}

export class ProxyExt implements OnExtensionLoad, OnShutdown, OnModuleInstantiated {

    public static setConfig(config: ProxyConfig): ExtensionWithConfig {
        return {
            token: ProxyExt,
            config
        };
    }

    /**
     * Initialize Proxy
     *
     * @param  {CoreModule} module
     * @param  {ProxyConfig} config
     * @returns Observable
     */
    onExtensionLoad(module: CoreModule, config: ProxyConfig): Observable<Extension> {
        return Observable
            .of(new ProxyManager(module, config))
            .map(_ => ({
                instance: this,
                token: ProxyExt,
                value: _
            }));
    }

    onModuleInstantiated(module: CoreModule, server: ProxyManager): Observable<void> {
        return server
            .start(module)
            .map(_ => undefined);
    }

    /**
     * Shutdown Proxy extension
     *
     * @param  {CoreModule} module
     * @param  {ProxyManager} server
     * @returns ExtensionShutdown
     */
    onShutdown(module: CoreModule, server: ProxyManager): ExtensionShutdown {
        return {
            priority: ExtensionShutdownPriority.IMPORTANT,
            resolver: server.shutdown()
        }
    }
}
