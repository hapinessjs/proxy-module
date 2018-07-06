import { createDecorator, CoreDecorator, makeDecorator } from '@hapiness/core';

export interface ProxyHandler {}
export const ProxyHandler = makeDecorator('ProxyHandler', null);

export interface ProxyResponse {}
export const ProxyResponse = makeDecorator('ProxyResponse', null);

export interface ProxyAuth {
    schemeName: string;
}
export const ProxyAuth: CoreDecorator<ProxyAuth> = createDecorator<ProxyAuth>('ProxyAuth', {
    schemeName: undefined
});
