# copy/web

The Spanish text of what a web service does with a request: `web-reasons.ts` turns the reasons `web-site-chosen`, `web-default-site` and `web-answered` into sentences, and `describeReason` (`src/copy/reasons.ts`) hands them over; `site-problems.ts` has `SITE_PROBLEM_TEXT`, the sentence for each code `siteProblem` gives when the player places a site the engine does not take (`no-web-service`, `name-has-site`), which the card of a table of sites writes under the table (`problemOf` in `src/game/view/cards/table-card.ts`). They tag no term and name no code.

- A sentence tags a term only once the player knows it (`known`). Before `host-header`, the request is only «dirigida a» the name it carries; after, «La cabecera Host de la petición indica» that name. The sentence of an answer says the code of the response and nothing about why a response comes back, and it never says that a firewall or a rule lets the reply through.
- The choice of a site says whether the service has a site with that name or answers with its site by default. It never says the server knows the site by the IP or by the CNAME: the name is the one the request carries.
- Not here: the logic that chooses a site or an answer (`src/engine/web/`).
- Text follows `.claude/rules/rigorous-plain-copy.md`.
- May import: `@/engine`.
