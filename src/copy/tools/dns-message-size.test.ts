import { describe, expect, it } from 'vitest';
import type { AnswerRecord, SoaRecord } from '@/engine';
import { OPT_RECORD_BYTES, replySize } from './dns-message-size';

const address = (name: string, value: string): AnswerRecord => ({ name, type: 'A', value, ttl: 300 });
const alias = (name: string, value: string): AnswerRecord => ({ name, type: 'CNAME', value, ttl: 300 });
const soa = (name: string, mname: string, rname: string): SoaRecord => ({
  name,
  type: 'SOA',
  ttl: 300,
  value: { mname, rname, serial: 2026101101, refresh: 1800, retry: 900, expire: 1209600, minimum: 1200 },
});

describe('replySize', () => {
  it('counts the header, the question, each record with its names compressed against the ones written before, and the OPT record', () => {
    expect(replySize({ question: 'www.lucia.example', answers: [address('www.lucia.example', '198.51.100.50')] })).toBe(12 + (19 + 4) + (2 + 10 + 4) + OPT_RECORD_BYTES);
  });

  it('compresses the target of an alias against the question and the owner of the next record against the target', () => {
    const answers = [alias('blog.lucia.example', 'www.lucia.example'), address('www.lucia.example', '198.51.100.50')];
    expect(replySize({ question: 'blog.lucia.example', answers })).toBe(12 + (20 + 4) + (2 + 10 + (4 + 2)) + (2 + 10 + 4) + OPT_RECORD_BYTES);
  });

  it('counts the SOA of an answer with no data with its two names compressed against the zone', () => {
    const answer = { question: 'noexiste.lucia.example', answers: [], soa: soa('lucia.example', 'ns1.lucia.example', 'hostmaster.lucia.example') };
    expect(replySize(answer)).toBe(12 + (24 + 4) + (2 + 10 + (4 + 2) + (11 + 2) + 20) + OPT_RECORD_BYTES);
  });

  it('gives the MSG SIZE that dig 9.10.6 printed for two real answers of 1.1.1.1 asked without EDNS, on this Mac, on 2026-10-11 [local]', () => {
    const twoAddresses = [address('example.com', '172.66.147.243'), address('example.com', '104.20.23.154')];
    expect(replySize({ question: 'example.com', answers: twoAddresses }) - OPT_RECORD_BYTES).toBe(61);
    const noData = soa('example.com', 'elliott.ns.cloudflare.com', 'dns.cloudflare.com');
    expect(replySize({ question: 'nope-xyz.example.com', answers: [], soa: noData }) - OPT_RECORD_BYTES).toBe(100);
  });
});
