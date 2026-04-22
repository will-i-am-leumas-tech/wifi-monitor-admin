# WiFi Traffic Monitor MVP — goal.md

## Project summary

Build a **simple, fast, open-source Node.js WiFi / network traffic monitor** for local use that provides a real-time dashboard similar to the reference UI.

The MVP should focus on:

* lightweight backend
* low-latency live updates
* simple install and run
* reusable SDK functions
* reusable router layer
* test coverage for core logic
* no heavy dependencies unless they clearly reduce complexity

Primary server entry:

* `server.js` running on **port 29183**

---

## Core product goal

Create a local web application that monitors network traffic visible to the host machine and presents it in a clean dashboard with:

* overall traffic overview
* live traffic rate graph
* incoming / outgoing byte stats
* top network hosts
* top services / protocols
* top programs / processes
* inspect table for detailed traffic records
* notifications / alerts feed
* lightweight filtering
* simple favorites / blocklist concepts for local tagging

This is an **MVP monitor**, not a full enterprise IDS. Prioritize speed, clarity, and reliability over deep packet inspection.

---

## Features extracted from the reference images

## 1. Overview dashboard

The dashboard should include:

* current selected network adapter
* data representation toggle:

  * bits
  * bytes
  * packets
* active filters summary
* circular summary meter / donut for total traffic
* totals for:

  * incoming
  * outgoing
  * dropped
* live traffic rate graph with two series:

  * incoming
  * outgoing
* top lists / ranked panels for:

  * network hosts
  * services
  * programs

## 2. Inspect page

A detailed table view for captured / observed traffic records with filters such as:

* country
* domain
* ASN
* program
* source address
* source port
* destination address
* destination port
* protocol
* service

The table should show:

* source address
* source port
* destination address
* destination port
* protocol
* service
* bytes

Also include:

* table filters
* sortable columns
* simple pagination or capped rolling results
* total result count

## 3. Notifications page

An events feed that logs traffic-related alerts such as:

* new data exchanged from favorites
* bytes threshold exceeded
* new data exchanged from a blocklisted IP / domain
* suspicious service spike
* unusual traffic burst

Each notification can include:

* timestamp
* title
* involved host / program / service
* byte count
* small breakdown preview

## 4. UI patterns visible in the references

Implement a simple MVP version of these ideas:

* top navigation tabs

  * overview
  * inspect
  * notifications
* dark HUD-like interface
* compact cards / panels
* accent theme support
* responsive desktop-first layout
* lightweight charts
* footer status strip

## 5. Filters and analysis concepts

MVP should support:

* filtering by adapter
* filtering by program
* filtering by host
* filtering by service
* filtering by protocol
* filter chips for active filters
* favorites tagging
* blocklist tagging
* bytes-per-second threshold alerts

---

## MVP scope

## Included in MVP

* Node.js server
* static frontend from `/public`
* API routes from `/router`
* reusable logic from `/sdk`
* live updates through Server-Sent Events or WebSocket
* host traffic observation from the machine running the app
* process / program association when possible
* top hosts / top services / top programs aggregations
* rolling traffic graph data
* inspect table view
* basic notifications engine
* unit tests for core functions

## Explicitly out of scope for MVP

* deep packet payload inspection
* SSL/TLS interception
* full packet capture UI like Wireshark
* remote multi-device enterprise management
* account system / auth
* kernel drivers
* permanent historical analytics warehouse
* advanced geolocation enrichment beyond optional lightweight lookup

---

## Technical approach

## Backend

Use a simple Node.js server with:

* `express` for HTTP
* native or lightweight real-time transport
* `systeminformation` for network stats where useful
* optional OS commands to associate sockets with processes
* in-memory rolling store for live metrics

Prefer an architecture that separates:

* collection
* normalization
* aggregation
* alert generation
* API response formatting

## Frontend

Use plain HTML, CSS, and vanilla JS for speed and simplicity.

Frontend should:

* load quickly
* render dashboard cards
* draw lightweight charts with canvas
* update live without full refresh
* support simple filtering and sorting

## Data collection strategy

Since true WiFi packet inspection is platform-sensitive, MVP should monitor **host-level network activity** and normalize it into traffic events.

Preferred strategy:

1. collect adapter-level stats on interval
2. collect active connections on interval
3. enrich records with process / program names when available
4. infer service from port / protocol map
5. aggregate rolling totals for UI
6. emit alerts on thresholds and blocklist / favorite matches

Keep the collector pluggable so future versions can support:

* Windows-specific socket / process mapping
* Linux netstat / ss integration
* packet capture adapters later

---

## High-level architecture

```text
Browser UI
  -> fetch /api/*
  -> subscribe /api/stream

server.js
  -> mounts router modules
  -> serves /public
  -> starts collectors

/router
  -> overview routes
  -> inspect routes
  -> notifications routes
  -> settings routes

/sdk
  -> collectors
  -> aggregators
  -> traffic models
  -> alerts
  -> filtering
  -> enrichment
  -> chart shaping
  -> store
  -> utilities

/test
  -> validates main functions and edge cases
```

---

## File tree

```text
wifi-traffic-monitor/
├─ server.js
├─ package.json
├─ .gitignore
├─ README.md
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  ├─ app.js
│  ├─ api.js
│  ├─ state.js
│  ├─ charts.js
│  ├─ render-overview.js
│  ├─ render-inspect.js
│  ├─ render-notifications.js
│  └─ assets/
│     └─ favicon.svg
├─ router/
│  ├─ index.js
│  ├─ overview.router.js
│  ├─ inspect.router.js
│  ├─ notifications.router.js
│  └─ settings.router.js
├─ sdk/
│  ├─ constants.js
│  ├─ models.js
│  ├─ store.js
│  ├─ adapter.service.js
│  ├─ collector.service.js
│  ├─ connection.service.js
│  ├─ process.service.js
│  ├─ enrich.service.js
│  ├─ service-map.js
│  ├─ aggregate.service.js
│  ├─ alert.service.js
│  ├─ filter.service.js
│  ├─ transform.service.js
│  ├─ stream.service.js
│  ├─ formatter.js
│  └─ utils.js
└─ test/
   ├─ aggregate.service.test.js
   ├─ alert.service.test.js
   ├─ filter.service.test.js
   ├─ formatter.test.js
   ├─ service-map.test.js
   └─ transform.service.test.js
```

---

## Per-file responsibilities

## Root

### `server.js`

Main app entry.

Responsibilities:

* create Express server
* serve static files from `/public`
* mount `/api` router
* start live collector loop
* start stream broadcaster
* listen on port `29183`
* handle clean shutdown

### `package.json`

Dependencies and scripts.

Include scripts such as:

* `start`
* `dev`
* `test`

### `.gitignore`

Ignore:

* `node_modules`
* logs
* coverage
* `.env`

### `README.md`

Explain:

* what the project does
* how to install
* how to run
* API overview
* MVP limitations

---

## `/public`

### `public/index.html`

Single-page shell with:

* top nav
* overview section
* inspect section
* notifications section
* footer status area

### `public/styles.css`

Dark HUD-like styling.

Should define:

* layout grid
* cards / panels
* filter chips
  n- tables
* buttons / toggles
* responsive behavior
* accent theme variables

### `public/app.js`

Frontend bootstrap.

Responsibilities:

* initialize app
* set active page
* poll initial data
* subscribe to live stream
* coordinate render modules

### `public/api.js`

Reusable client-side API layer.

Functions such as:

* `getOverview()`
* `getInspect(params)`
* `getNotifications()`
* `connectStream(onMessage)`

### `public/state.js`

Client state container.

Store:

* current tab
* filters
* graph history
* inspect rows
* notifications

### `public/charts.js`

Reusable chart drawing functions using canvas.

Functions such as:

* `drawTrafficAreaChart(canvas, series)`
* `drawDonutChart(canvas, totals)`

### `public/render-overview.js`

Render dashboard cards, top lists, adapter info, donut, and traffic graph.

### `public/render-inspect.js`

Render filter row and detailed inspect table.

### `public/render-notifications.js`

Render notifications feed and alert cards.

### `public/assets/favicon.svg`

Simple project icon.

---

## `/router`

### `router/index.js`

Compose all sub-routers into `/api`.

### `router/overview.router.js`

Routes for overview page.

Example endpoints:

* `GET /api/overview`
* `GET /api/overview/history`
* `GET /api/adapters`

### `router/inspect.router.js`

Routes for inspect page.

Example endpoints:

* `GET /api/inspect`
* accepts filters via query params
* supports sort and pagination

### `router/notifications.router.js`

Routes for notifications.

Example endpoints:

* `GET /api/notifications`
* `POST /api/notifications/read-all` optional

### `router/settings.router.js`

Optional simple settings endpoints.

Example endpoints:

* `GET /api/settings`
* `POST /api/settings`

Use this for threshold values, favorites, and blocklist.

---

## `/sdk`

### `sdk/constants.js`

Shared constants:

* default thresholds
* graph history length
* supported protocols
* default ports to service mappings

### `sdk/models.js`

Document canonical shapes for:

* traffic event
* connection record
* notification item
* filter state
* overview payload

### `sdk/store.js`

In-memory store for rolling app data.

Should store:

* latest adapter stats
* recent traffic history
* recent inspect rows
* notifications
* settings

Functions:

* get / set / append / prune

### `sdk/adapter.service.js`

Detect available adapters and current default adapter.

Functions:

* `listAdapters()`
* `getPrimaryAdapter()`

### `sdk/collector.service.js`

Central collector loop.

Responsibilities:

* schedule collection ticks
* pull adapter stats
* pull active connections
* normalize data
* write to store
* trigger aggregation and alerts

Functions:

* `startCollector()`
* `stopCollector()`
* `collectTick()`

### `sdk/connection.service.js`

Collect active connections from OS-level tools.

Functions may wrap:

* `netstat`
* `ss`
* platform-specific parsers

Responsibilities:

* get local/remote address and ports
* get protocol
* get bytes if available
* associate PID when possible

### `sdk/process.service.js`

Resolve program / process metadata from PID.

Functions:

* `getProcessNameByPid(pid)`
* `safeResolveProcess(pid)`

### `sdk/enrich.service.js`

Enrich raw records with:

* service name from port
* domain when possible
* local vs remote direction hints
* country placeholder / optional lookup hooks

### `sdk/service-map.js`

Port-to-service mapping helpers.

Functions:

* `portToService(port, protocol)`
* custom override map support

### `sdk/aggregate.service.js`

Create overview aggregates.

Functions:

* `computeTotals(events)`
* `buildTopHosts(events)`
* `buildTopServices(events)`
* `buildTopPrograms(events)`
* `buildTrafficSeries(history)`

### `sdk/alert.service.js`

Generate notifications.

Rules such as:

* threshold exceeded
* favorite host activity
* blocklist host activity
* sudden spike

Functions:

* `evaluateAlerts(context)`
* `createNotification(type, payload)`

### `sdk/filter.service.js`

Shared filter helpers for inspect and overview drilldowns.

Functions:

* `applyInspectFilters(rows, filters)`
* `sortRows(rows, sortBy, order)`
* `paginate(rows, page, pageSize)`

### `sdk/transform.service.js`

Convert raw collector output into stable UI payloads.

Functions:

* `toInspectRow(raw)`
* `toOverviewPayload(store)`
* `toNotificationPayload(item)`

### `sdk/stream.service.js`

Live stream broadcast layer.

Use SSE for MVP simplicity.

Functions:

* `attachStream(req, res)`
* `broadcast(event)`

### `sdk/formatter.js`

Formatting helpers.

Functions:

* `formatBytes(value)`
* `formatBits(value)`
* `formatPackets(value)`
* `formatRelativeTime(ts)`

### `sdk/utils.js`

Generic helpers:

* safe parse
* debounce / throttle if needed
* stable sort
* prune arrays
* timestamp helpers

---

## `/test`

Use Node test runner or Jest/Vitest. Keep it simple.

### `test/aggregate.service.test.js`

Test:

* totals calculation
* top list ranking
* graph series output

### `test/alert.service.test.js`

Test:

* threshold alert creation
* favorite / blocklist matching
* spike detection logic

### `test/filter.service.test.js`

Test:

* host / program / service filters
* sorting
* pagination

### `test/formatter.test.js`

Test:

* bytes / bits formatting
* empty / edge values

### `test/service-map.test.js`

Test:

* common port mappings
* unknown port fallback

### `test/transform.service.test.js`

Test:

* raw-to-UI payload conversion
* missing field handling

---

## API design

## `GET /api/overview`

Returns:

* adapter
* active filters
* totals
* donut values
* top hosts
* top services
* top programs
* graph series

## `GET /api/inspect`

Query params:

* `host`
* `program`
* `service`
* `protocol`
* `page`
* `pageSize`
* `sortBy`
* `order`

Returns:

* rows
* total
* page
* pageSize

## `GET /api/notifications`

Returns recent notifications.

## `GET /api/adapters`

Returns available network adapters.

## `GET /api/settings`

Returns local settings such as:

* thresholds
* favorites
* blocklist

## `POST /api/settings`

Updates settings.

## `GET /api/stream`

SSE endpoint for live updates.

Events may include:

* `overview:update`
* `inspect:update`
* `notification:new`

---

## UI behavior requirements

## Overview page

* live traffic graph updates every 1 second or near-real-time
* donut updates with incoming / outgoing totals
* lists show top hosts / services / programs
* user can switch data representation between bits / bytes / packets

## Inspect page

* filters update query state
* rows sortable by bytes and ports
* show destination and source clearly
* cap rows to keep UI fast

## Notifications page

* newest first
* compact card layout
* severity indication
* delete / clear optional for MVP

---

## Performance requirements

* app should boot quickly
* target low memory usage
* keep only rolling recent history in memory
* prune old inspect rows and notifications
* avoid expensive synchronous OS calls in render path
* collector interval should be configurable, default `1000ms`

---

## Security and safety requirements

* bind to localhost by default
* do not inspect packet payload contents in MVP
* do not store sensitive data unless explicitly enabled later
* sanitize all API output
* validate settings input

---

## Suggested implementation phases

## Phase 1 — Project scaffold

Build the file tree, install dependencies, configure scripts, and stand up:

* `server.js`
* static frontend serving
* `/api/health` basic endpoint

## Phase 2 — Live collection foundation

Implement:

* adapter detection
* connection collection
* in-memory store
* rolling history

## Phase 3 — Aggregation and API

Implement:

* totals
* top hosts/services/programs
* inspect row shaping
* overview / inspect / notifications routes

## Phase 4 — Frontend MVP

Implement:

* single page UI
* overview cards
* chart rendering
* inspect table
* notifications feed
* live updates

## Phase 5 — Alerts and filtering

Implement:

* thresholds
* favorites
* blocklist
* filter chips
* settings persistence in memory or JSON file

## Phase 6 — Tests and polish

Implement:

* core tests
* error handling
* README
* cleanup and final MVP pass

---

## Codex build instructions

Codex should generate a working MVP with these priorities:

1. make it runnable immediately
2. keep modules small and reusable
3. keep `/sdk` framework-agnostic where possible
4. keep `/router` thin and dependent on `/sdk`
5. keep frontend simple and fast
6. include tests for all core pure functions
7. do not over-engineer persistence for MVP
8. prefer SSE over WebSocket unless WebSocket becomes clearly simpler

---

## Acceptance criteria

The MVP is complete when:

* `node server.js` starts successfully on port `29183`
* browser loads the dashboard from the server
* overview shows live traffic updates
* inspect page shows detailed rows with filters
* notifications page shows generated alerts
* `/sdk` functions are reusable and not tightly coupled to routes
* `/router` uses `/sdk` cleanly
* tests pass for core logic
* project is simple enough to extend later into a fuller network monitor

---

## Stretch goals after MVP

* adapter switching
* saved settings in JSON
* better country / ASN enrichment
* process icons
* export inspect data to JSON / CSV
* multiple themes
* packet capture plugin mode
* remote agent mode

---

## Final note

This project should feel like a **small open-source network activity monitor**, not a bloated security platform. Prioritize a clean foundation, reusable SDK modules, fast UI rendering, and a working local MVP first.
