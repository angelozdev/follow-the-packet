import type { AnswerRecord, SoaRecord } from '@/engine';

const HEADER_BYTES = 12;
const QUESTION_TAIL_BYTES = 4;
const RECORD_HEAD_BYTES = 10;
const POINTER_BYTES = 2;
const ROOT_BYTES = 1;
const ADDRESS_BYTES = 4;
const SOA_NUMBERS_BYTES = 20;
export const OPT_RECORD_BYTES = 11;

/** What a reply carries: the name asked, the records of its answer and, for a negative answer, the SOA of the zone. */
export interface ReplyContent {
  question: string;
  answers: AnswerRecord[];
  soa?: SoaRecord;
}

/** Returns how many bytes a name takes when it is written after the ones in `written` (RFC 1035 §4.1.4): each label it has to write costs its length and one byte, and the first suffix already written ends it with a pointer of two bytes; a name with no suffix in common ends with the root. Every suffix it writes joins `written`. */
function nameBytes(name: string, written: Set<string>): number {
  const labels = name.split('.');
  let bytes = 0;
  for (const [index, label] of labels.entries()) {
    const suffix = labels.slice(index).join('.');
    if (written.has(suffix)) return bytes + POINTER_BYTES;
    written.add(suffix);
    bytes += 1 + label.length;
  }
  return bytes + ROOT_BYTES;
}

function answerBytes(record: AnswerRecord, written: Set<string>): number {
  const owner = nameBytes(record.name, written);
  return owner + RECORD_HEAD_BYTES + (record.type === 'A' ? ADDRESS_BYTES : nameBytes(record.value, written));
}

function soaBytes(record: SoaRecord, written: Set<string>): number {
  const owner = nameBytes(record.name, written);
  return owner + RECORD_HEAD_BYTES + nameBytes(record.value.mname, written) + nameBytes(record.value.rname, written) + SOA_NUMBERS_BYTES;
}

/** Returns the bytes of the reply of a resolver as it goes on the wire: the header, the question, the records of the answer and of the authority section with their names compressed as BIND compresses them (the owner and the names inside an alias or a SOA, RFC 1035 §4.1.4), and the OPT record of EDNS (RFC 6891 §6.1.2) with no options. It is the figure `dig` prints as `MSG SIZE  rcvd`. */
export function replySize({ question, answers, soa }: ReplyContent): number {
  const written = new Set<string>();
  const questionBytes = nameBytes(question, written) + QUESTION_TAIL_BYTES;
  const answerTotal = answers.reduce((total, record) => total + answerBytes(record, written), 0);
  const authorityTotal = soa ? soaBytes(soa, written) : 0;
  return HEADER_BYTES + questionBytes + answerTotal + authorityTotal + OPT_RECORD_BYTES;
}
