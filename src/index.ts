import { createDecorator, CoreDecorator, Type } from '@hapiness/core';

export interface Route {
    path: string;
    method: string | string[];
    providers?: Array<Type<any>|any>;
    labels?: string | string[];
}
export const Route: CoreDecorator<Route> = createDecorator<Route>('Route', {
    path: undefined,
    method: undefined,
    config: undefined,
    providers: undefined,
    labels: undefined
});

export interface Lifecycle {
    event: string;
}
export const Lifecycle: CoreDecorator<Lifecycle> = createDecorator<Lifecycle>('Lifecycle', {
    event: undefined
});
