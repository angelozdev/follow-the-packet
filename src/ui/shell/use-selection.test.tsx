// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { describe, expect, it } from 'vitest';
import { PIECE_ID, sessionReducer, startSession } from '@/game';
import { INCIDENTS } from '@/levels';
import { pieceDomId } from '@/scene';
import { gatewayIncident } from '@/testing/incidents';
import { useSelection } from './use-selection';

const WITH_THE_PIECE = '04-01';
const WITHOUT_THE_PIECE = '01-01';
const PIECE = PIECE_ID.device('servidor2');

function clickOn(key: string, button: HTMLElement): MouseEvent<HTMLElement> {
  return { detail: 1, currentTarget: button } as unknown as MouseEvent<HTMLElement>;
}

describe('the selection of the incident screen', () => {
  it('a choice is released when its piece is no longer drawn', () => {
    const button = document.createElement('button');
    const { result, rerender } = renderHook(({ id }) => useSelection(startSession(INCIDENTS, id)), { initialProps: { id: WITH_THE_PIECE } });

    act(() => result.current.trigger(PIECE, {}).onClick?.(clickOn(PIECE, button)));
    expect(result.current.selected).toBe(PIECE);
    expect(result.current.pieceId).toBe(PIECE);

    rerender({ id: WITHOUT_THE_PIECE });
    expect(result.current.selected).toBeNull();
    expect(result.current.inspection).toBeNull();
  });

  it('a hover or a focus is not a choice, and only the chosen key wears the mark', () => {
    const button = document.createElement('button');
    const { result } = renderHook(() => useSelection(startSession(INCIDENTS, WITH_THE_PIECE)));
    const hover = { onPointerEnter: () => undefined };

    expect(result.current.trigger(PIECE, hover).onPointerEnter).toBe(hover.onPointerEnter);
    expect(result.current.selected).toBeNull();

    act(() => result.current.trigger(PIECE, hover).onClick?.(clickOn(PIECE, button)));
    expect(result.current.trigger(PIECE, hover)['data-pinned']).toBe(true);
    expect(result.current.trigger(PIECE_ID.device('servidor1'), hover)['data-pinned']).toBeUndefined();
  });

  it('the send that Ver fila marks is dropped when the history that held it is gone, and the piece stays chosen', () => {
    const incident = gatewayIncident();
    const laptop = PIECE_ID.device('your-laptop');
    const label = document.createElement('button');
    label.id = pieceDomId(laptop);
    document.body.append(label);
    const sent = sessionReducer(startSession([incident], incident.id), { type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' });
    const [{ send }] = sent.history;
    const { result, rerender } = renderHook(({ session }) => useSelection(session), { initialProps: { session: sent } });

    act(() => result.current.showRow(laptop, send));
    expect(result.current.markedSend).toBe(send);

    rerender({ session: sessionReducer(sent, { type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId: 'router' }) });
    expect(result.current.selected).toBe(laptop);
    expect(result.current.markedSend).toBeUndefined();
    label.remove();
  });
});
