/* deno global: apenas leitura */

// @ts-nocheck

import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

import typeDetect from '../index.ts';

Deno.test('tipo detect funciona', () => {
    assertEquals(typeDetect('olá'), 'string');
});