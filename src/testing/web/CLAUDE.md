# testing/web

Helpers for the tests of the web in chapter 3, apart from `src/testing/` because that folder is full. `web-incident.ts` has `webSendIncident`, a send incident on the office with names that offers what chapter 3 adds to the contract: URL chips (by parts and whole), the messages `curl` (alone, with `-i`, with `-d`, with `-X PUT -d` and with `--connect-timeout 3`) and the browser, a rules card for the host firewall of laptop-lucia, a table of sites on the server of the internet, a clock, and tasks that expect a body and the nth send of their chips. Its start world (`webNet`) gives laptop-lucia an orders app on port 3000 (orders 7 and 8) and an SSH service on 22 that speaks no HTTP, behind a host firewall with no inbound rules, and gives the server of the internet a web service on port 80 with the shop at `www.lucia.example`, the default site.
- Imports files of `src/testing/` through `@/testing/<file>` (a subfolder may not use `../`), and the barrel of `src/testing/` exports from here.
- Production code never imports `@/testing`.
- May import: `@/engine`, `@/copy`, `@/levels`.
