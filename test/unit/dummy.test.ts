import { suite, test } from 'mocha-typescript';

@suite('Unit')
export class DummyService {

    @test('dummy')
    test(done) {
        done();
    }
}
