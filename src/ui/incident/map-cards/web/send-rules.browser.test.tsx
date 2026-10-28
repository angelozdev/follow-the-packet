import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { openCard, showTheScreen } from '@/testing/browser-play';
import { webSendIncident } from '@/testing/web/web-incident';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const FIREWALL = 'firewall laptop-lucia';
const TYPE = 'TCP · 3000';
const SOURCE = 'tu-laptop';
const incident = webSendIncident();

describe('the rules card of a send incident', () => {
  it('a send incident opens the card of the firewall its rules name and a rule placed there is a rule of that firewall', async () => {
    await showTheScreen(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={() => undefined} />);
    const rules = await openCard(FIREWALL);
    await userEvent.click(rules.getByRole('button', { name: TYPE, exact: true }));
    await userEvent.click(rules.getByRole('button', { name: SOURCE, exact: true }));
    await expect.element(rules.getByRole('listitem')).toMatchTextContent(`${TYPE}`);
    await expect.element(rules.getByRole('listitem')).toMatchTextContent(SOURCE);
    expect(page.getByRole('tab').elements().map((tab) => tab.textContent), 'the panel has its tabs and the rules have no tabs of direction').toEqual(['Estado', 'Tablas']);
  });
});
