export { ENTITY_REFS, ENTITY_TERMS, TERMS, TERM_ENTITY, entityTerm, isTermId } from './terms';
export type { EntityKind, EntityRef, EntityVariants, PacketMessage, TermId } from './terms';
export { nameTag, parseTermText, termsIn, toPlainText, unofficialNames } from './term-text';
export type { TermSegment, TermText } from './term-text';
export { describeReason } from './reasons';
export { OUTCOME_TEXT, describeOutcome, endpointName, messageLabel, packetLabel, packetMessage, stampLabel } from './packet-labels';
export type { StampState } from './packet-labels';
export { CATALOG_TEXT, INTERFACE_TEXT, NOTICE_TEXT, ROADMAP_TEXT, entityName } from './screens/ui';
export { ACTOR_ROLE_TEXT, EXPLANATION_TEXT, INSPECTION_TEXT, LUCIA_TEXT, MAP_TEXT, RESULT_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT } from './screens/incident-ui';
