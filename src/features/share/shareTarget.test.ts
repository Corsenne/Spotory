import { describe, expect, it } from 'vitest';
import { candidateQuery } from './shareTarget';

describe('Google Maps share target', () => {
  it('共有タイトルを検索語にする', () => expect(candidateQuery({ title: '喫茶店', text: '', url: '' })).toBe('喫茶店'));
  it('Google Maps URLから店舗名を取り出す', () => expect(candidateQuery({ title: '', text: '', url: 'https://www.google.com/maps/place/Test+Cafe/data=abc' })).toBe('Test Cafe'));
  it('共有本文の最初の非URL行を使う', () => expect(candidateQuery({ title: 'Google Maps', text: '食堂\nhttps://maps.app.goo.gl/test', url: '' })).toBe('食堂'));
});
