# WiFi Traffic Monitor MVP

A simple local Node.js network traffic monitor with a live web dashboard, inspect table, and notifications feed.

## What it does

- watches host network activity on the machine running the app
- shows real-time incoming/outgoing graph
- shows top hosts, services, and programs
- exposes an inspect table for active connections
- emits lightweight alerts for thresholds, favorites, and blocklist matches
- streams live updates to the browser using Server-Sent Events

## Run

```bash
npm install
npm start
```

Open:

```text
http://localhost:29183
```

## Test

```bash
npm test
```

## Notes

This is an MVP. It is a host-level traffic monitor, not a full deep packet inspection suite.

Process / program mapping depends on what the host OS makes available through tools like `netstat` or `ss`.
