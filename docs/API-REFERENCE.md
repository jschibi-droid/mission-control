# Mission Control API Reference

Generated from live route handlers in `src/app/api` and schema refs in `openapi.json`.

- Total route files: 138
- Total endpoint operations: 241
- OpenAPI paths: 75
- Role model: `viewer < operator < admin`
- Auth note: endpoints without `requireRole()` are marked `public` here, but some still enforce auth with custom checks/cookies.

## Coverage summary

- Operations with OpenAPI schema coverage: 122/241
- Operations missing from OpenAPI: 119

### Missing from OpenAPI

- `GET /api/adapters` — role: viewer
- `POST /api/adapters` — role: operator
- `GET /api/agents/{id}/files` — role: viewer
- `PUT /api/agents/{id}/files` — role: operator
- `DELETE /api/agents/{id}/hide` — role: operator
- `POST /api/agents/{id}/hide` — role: operator
- `DELETE /api/agents/{id}/keys` — role: admin
- `GET /api/agents/{id}/keys` — role: admin
- `POST /api/agents/{id}/keys` — role: admin
- `DELETE /api/agents/{id}/memory` — role: operator
- `PATCH /api/agents/{id}/soul` — role: public
- `GET /api/agents/evals` — role: operator
- `POST /api/agents/evals` — role: operator
- `GET /api/agents/optimize` — role: operator
- `POST /api/agents/register` — role: viewer
- `GET /api/agents/sync` — role: admin
- `POST /api/auth/google` — role: public
- `POST /api/auth/google/disconnect` — role: public
- `PATCH /api/auth/me` — role: public
- `DELETE /api/backup` — role: admin
- `GET /api/backup` — role: admin
- `GET /api/channels` — role: viewer
- `POST /api/channels` — role: operator
- `PATCH /api/chat/messages/{id}` — role: operator
- `GET /api/chat/session-prefs` — role: viewer
- `PATCH /api/chat/session-prefs` — role: operator
- `GET /api/claude-tasks` — role: viewer
- `GET /api/cleanup` — role: admin
- `GET /api/debug` — role: admin
- `POST /api/debug` — role: admin
- `GET /api/diagnostics` — role: admin
- `GET /api/docs/content` — role: viewer
- `GET /api/docs/search` — role: viewer
- `GET /api/docs/tree` — role: viewer
- `GET /api/exec-approvals` — role: operator
- `POST /api/exec-approvals` — role: operator
- `PUT /api/exec-approvals` — role: operator
- `PUT /api/gateway-config` — role: admin
- `GET /api/gateways/discover` — role: viewer
- `GET /api/gateways/health/history` — role: public
- `GET /api/github/sync` — role: operator
- `POST /api/github/sync` — role: operator
- `GET /api/gnap` — role: operator
- `POST /api/gnap` — role: operator
- `GET /api/hermes` — role: viewer
- `POST /api/hermes` — role: admin
- `GET /api/hermes/memory` — role: viewer
- `GET /api/hermes/tasks` — role: viewer
- `GET /api/index` — role: public
- `DELETE /api/integrations` — role: admin
- `PUT /api/integrations` — role: admin
- `GET /api/local/agents-doc` — role: viewer
- `GET /api/local/flight-deck` — role: viewer
- `POST /api/local/flight-deck` — role: operator
- `POST /api/local/terminal` — role: operator
- `POST /api/logs` — role: operator
- `DELETE /api/memory` — role: admin
- `GET /api/memory/context` — role: viewer
- `GET /api/memory/graph` — role: viewer
- `GET /api/memory/health` — role: viewer
- `GET /api/memory/links` — role: viewer
- `POST /api/memory/process` — role: operator
- `GET /api/nodes` — role: viewer
- `POST /api/nodes` — role: operator
- `DELETE /api/notifications` — role: admin
- `PUT /api/notifications` — role: operator
- `GET /api/notifications/deliver` — role: viewer
- `GET /api/onboarding` — role: viewer
- `POST /api/onboarding` — role: admin
- `GET /api/openclaw/doctor` — role: admin
- `POST /api/openclaw/doctor` — role: admin
- `POST /api/openclaw/update` — role: admin
- `GET /api/openclaw/version` — role: public
- `GET /api/pipelines/run` — role: viewer
- `DELETE /api/projects/{id}/agents` — role: operator
- `GET /api/projects/{id}/agents` — role: viewer
- `POST /api/projects/{id}/agents` — role: operator
- `POST /api/releases/update` — role: admin
- `GET /api/schedule-parse` — role: public
- `GET /api/security-audit` — role: admin
- `GET /api/security-scan` — role: admin
- `POST /api/security-scan/agent` — role: admin
- `POST /api/security-scan/fix` — role: admin
- `DELETE /api/sessions` — role: operator
- `POST /api/sessions` — role: operator
- `POST /api/sessions/continue` — role: operator
- `GET /api/sessions/transcript` — role: viewer
- `GET /api/sessions/transcript/aggregate` — role: viewer
- `GET /api/sessions/transcript/gateway` — role: viewer
- `DELETE /api/settings` — role: admin
- `PUT /api/settings` — role: admin
- `GET /api/setup` — role: public
- `POST /api/setup` — role: public
- `DELETE /api/skills` — role: operator
- `GET /api/skills` — role: viewer
- `POST /api/skills` — role: operator
- `PUT /api/skills` — role: operator
- `GET /api/skills/registry` — role: viewer
- `POST /api/skills/registry` — role: admin
- `PUT /api/skills/registry` — role: viewer
- `GET /api/spawn` — role: viewer
- `POST /api/standup` — role: operator
- `GET /api/super/os-users` — role: admin
- `POST /api/super/os-users` — role: admin
- `POST /api/super/provision-jobs/{id}` — role: admin
- `GET /api/system-monitor` — role: viewer
- `GET /api/tasks/{id}/branch` — role: viewer
- `POST /api/tasks/{id}/branch` — role: operator
- `GET /api/tasks/outcomes` — role: viewer
- `GET /api/tasks/regression` — role: viewer
- `GET /api/tokens/by-agent` — role: viewer
- `GET /api/tokens/rotate` — role: admin
- `POST /api/tokens/rotate` — role: admin
- `POST /api/webhooks/n8n` — role: admin
- `GET /api/workspaces` — role: viewer
- `POST /api/workspaces` — role: admin
- `DELETE /api/workspaces/{id}` — role: admin
- `GET /api/workspaces/{id}` — role: viewer
- `PUT /api/workspaces/{id}` — role: admin

## Endpoint reference

### activities

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/activities` | viewer | List activities | — | #/components/responses/Unauthorized | yes |

### adapters

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/adapters` | viewer | — | — | — | no |
| POST | `/api/adapters` | operator | — | — | — | no |

### agents

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/agents` | viewer | List agents | — | Agent, #/components/responses/Unauthorized | yes |
| POST | `/api/agents` | operator | Create agent | — | Agent, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, Error, #/components/responses/RateLimited | yes |
| PUT | `/api/agents` | operator | Update agent by name | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound, #/components/responses/RateLimited | yes |
| DELETE | `/api/agents/{id}` | admin | Delete agent | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/agents/{id}` | viewer | Get agent by ID | — | Agent, #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| PUT | `/api/agents/{id}` | operator | Update agent by ID | — | Agent, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound, #/components/responses/RateLimited | yes |
| GET | `/api/agents/{id}/attribution` | viewer | Get attribution report for an agent | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/agents/{id}/diagnostics` | viewer | Get self diagnostics for an agent | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/agents/{id}/files` | viewer | — | — | — | no |
| PUT | `/api/agents/{id}/files` | operator | — | — | — | no |
| GET | `/api/agents/{id}/heartbeat` | viewer | Check agent work items | — | Task, #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| POST | `/api/agents/{id}/heartbeat` | operator | Trigger manual heartbeat | — | #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| DELETE | `/api/agents/{id}/hide` | operator | — | — | — | no |
| POST | `/api/agents/{id}/hide` | operator | — | — | — | no |
| DELETE | `/api/agents/{id}/keys` | admin | — | — | — | no |
| GET | `/api/agents/{id}/keys` | admin | — | — | — | no |
| POST | `/api/agents/{id}/keys` | admin | — | — | — | no |
| DELETE | `/api/agents/{id}/memory` | operator | — | — | — | no |
| GET | `/api/agents/{id}/memory` | viewer | Get agent memory | — | #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| PUT | `/api/agents/{id}/memory` | operator | Update agent memory | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/agents/{id}/soul` | viewer | Get agent soul config | — | #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| PATCH | `/api/agents/{id}/soul` | public | — | — | — | no |
| PUT | `/api/agents/{id}/soul` | operator | Update agent soul config | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| POST | `/api/agents/{id}/wake` | operator | Wake an agent | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/agents/comms` | viewer | Get agent communications | — | #/components/responses/Unauthorized | yes |
| GET | `/api/agents/evals` | operator | — | — | — | no |
| POST | `/api/agents/evals` | operator | — | — | — | no |
| POST | `/api/agents/message` | operator | Send message between agents | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/agents/optimize` | operator | — | — | — | no |
| POST | `/api/agents/register` | viewer | — | — | — | no |
| GET | `/api/agents/sync` | admin | — | — | — | no |
| POST | `/api/agents/sync` | admin | Sync agents from gateway config | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### alerts

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/alerts` | admin | Delete alert rule | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/RateLimited | yes |
| GET | `/api/alerts` | viewer | List alert rules | — | AlertRule, #/components/responses/Unauthorized | yes |
| POST | `/api/alerts` | operator | Create alert rule or evaluate rules | — | AlertRule, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/RateLimited | yes |
| PUT | `/api/alerts` | operator | Update alert rule | — | AlertRule, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound, #/components/responses/RateLimited | yes |

### audit

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/audit` | admin | Get audit log | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### auth

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/auth/access-requests` | viewer | List access requests | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/auth/access-requests` | public | Approve or reject access request | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/auth/google` | public | — | — | — | no |
| POST | `/api/auth/google/disconnect` | public | — | — | — | no |
| POST | `/api/auth/login` | public | Login with credentials | — | User, #/components/responses/BadRequest, Error, #/components/responses/RateLimited | yes |
| POST | `/api/auth/logout` | public | Logout and clear session | — | #/components/responses/Unauthorized | yes |
| GET | `/api/auth/me` | viewer | Get current user info | — | User, #/components/responses/Unauthorized | yes |
| PATCH | `/api/auth/me` | public | — | — | — | no |
| DELETE | `/api/auth/users` | public | Delete user | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/auth/users` | viewer | List users | — | User, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/auth/users` | public | Create user | — | User, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, Error | yes |
| PUT | `/api/auth/users` | public | Update user | — | User, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |

### backup

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/backup` | admin | — | — | — | no |
| GET | `/api/backup` | admin | — | — | — | no |
| POST | `/api/backup` | admin | Trigger backup | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### channels

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/channels` | viewer | — | — | — | no |
| POST | `/api/channels` | operator | — | — | — | no |

### chat

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/chat/conversations` | viewer | List conversations | — | #/components/responses/Unauthorized | yes |
| GET | `/api/chat/messages` | viewer | List messages | — | #/components/responses/Unauthorized | yes |
| POST | `/api/chat/messages` | operator | Send message | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/chat/messages/{id}` | viewer | Get message by ID | — | #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| PATCH | `/api/chat/messages/{id}` | operator | — | — | — | no |
| GET | `/api/chat/session-prefs` | viewer | — | — | — | no |
| PATCH | `/api/chat/session-prefs` | operator | — | — | — | no |

### claude-tasks

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/claude-tasks` | viewer | — | — | — | no |

### claude

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/claude/sessions` | viewer | List Claude CLI sessions | — | — | yes |
| POST | `/api/claude/sessions` | operator | Register a Claude CLI session | — | — | yes |

### cleanup

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/cleanup` | admin | — | — | — | no |
| POST | `/api/cleanup` | admin | Trigger cleanup of old data | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### connect

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/connect` | operator | Disconnect a CLI connection | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| GET | `/api/connect` | viewer | List all direct connections | — | #/components/responses/Unauthorized | yes |
| POST | `/api/connect` | operator | Register a direct CLI connection | — | #/components/responses/BadRequest, #/components/responses/Unauthorized | yes |

### cron

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/cron` | admin | Get cron jobs | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/cron` | admin | Manage cron jobs | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### debug

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/debug` | admin | — | — | — | no |
| POST | `/api/debug` | admin | — | — | — | no |

### diagnostics

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/diagnostics` | admin | — | — | — | no |

### docs

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/docs` | public | Get OpenAPI specification | — | — | yes |
| GET | `/api/docs/content` | viewer | — | — | — | no |
| GET | `/api/docs/search` | viewer | — | — | — | no |
| GET | `/api/docs/tree` | viewer | — | — | — | no |

### events

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/events` | viewer | SSE stream for real-time events | — | #/components/responses/Unauthorized | yes |

### exec-approvals

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/exec-approvals` | operator | — | — | — | no |
| POST | `/api/exec-approvals` | operator | — | — | — | no |
| PUT | `/api/exec-approvals` | operator | — | — | — | no |

### export

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/export` | admin | Export data | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### gateway-config

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/gateway-config` | admin | Read gateway config | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| PUT | `/api/gateway-config` | admin | — | — | — | no |

### gateways

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/gateways` | admin | Delete gateway | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/gateways` | viewer | List gateways | — | #/components/responses/Unauthorized | yes |
| POST | `/api/gateways` | admin | Add gateway | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| PUT | `/api/gateways` | admin | Update gateway | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| POST | `/api/gateways/connect` | viewer | Resolve websocket connect payload for a gateway | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/gateways/discover` | viewer | — | — | — | no |
| POST | `/api/gateways/health` | public | Probe gateway health | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/gateways/health/history` | public | — | — | — | no |

### github

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/github` | operator | Get GitHub integration status | — | — | yes |
| POST | `/api/github` | operator | Sync GitHub issues | — | — | yes |
| GET | `/api/github/sync` | operator | — | — | — | no |
| POST | `/api/github/sync` | operator | — | — | — | no |

### gnap

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/gnap` | operator | — | — | — | no |
| POST | `/api/gnap` | operator | — | — | — | no |

### hermes

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/hermes` | viewer | — | — | — | no |
| POST | `/api/hermes` | admin | — | — | — | no |
| GET | `/api/hermes/memory` | viewer | — | — | — | no |
| GET | `/api/hermes/tasks` | viewer | — | — | — | no |

### index

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/index` | public | — | — | — | no |

### integrations

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/integrations` | admin | — | — | — | no |
| GET | `/api/integrations` | admin | List integrations | — | #/components/responses/Unauthorized | yes |
| POST | `/api/integrations` | admin | Integration actions (enable, disable, test, configure) | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| PUT | `/api/integrations` | admin | — | — | — | no |

### local

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/local/agents-doc` | viewer | — | — | — | no |
| GET | `/api/local/flight-deck` | viewer | — | — | — | no |
| POST | `/api/local/flight-deck` | operator | — | — | — | no |
| POST | `/api/local/terminal` | operator | — | — | — | no |

### logs

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/logs` | viewer | Get system logs | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/logs` | operator | — | — | — | no |

### memory

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/memory` | admin | — | — | — | no |
| GET | `/api/memory` | viewer | Get memory files | — | #/components/responses/Unauthorized | yes |
| POST | `/api/memory` | operator | Update memory file | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/memory/context` | viewer | — | — | — | no |
| GET | `/api/memory/graph` | viewer | — | — | — | no |
| GET | `/api/memory/health` | viewer | — | — | — | no |
| GET | `/api/memory/links` | viewer | — | — | — | no |
| POST | `/api/memory/process` | operator | — | — | — | no |

### mentions

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/mentions` | viewer | Get mention autocomplete targets | — | — | yes |

### nodes

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/nodes` | viewer | — | — | — | no |
| POST | `/api/nodes` | operator | — | — | — | no |

### notifications

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/notifications` | admin | — | — | — | no |
| GET | `/api/notifications` | viewer | List notifications | — | #/components/responses/Unauthorized | yes |
| POST | `/api/notifications` | operator | Notification actions (mark read, dismiss) | — | #/components/responses/BadRequest, #/components/responses/Unauthorized | yes |
| PUT | `/api/notifications` | operator | — | — | — | no |
| GET | `/api/notifications/deliver` | viewer | — | — | — | no |
| POST | `/api/notifications/deliver` | operator | Deliver notification to agent | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### onboarding

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/onboarding` | viewer | — | — | — | no |
| POST | `/api/onboarding` | admin | — | — | — | no |

### openclaw

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/openclaw/doctor` | admin | — | — | — | no |
| POST | `/api/openclaw/doctor` | admin | — | — | — | no |
| POST | `/api/openclaw/update` | admin | — | — | — | no |
| GET | `/api/openclaw/version` | public | — | — | — | no |

### pipelines

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/pipelines` | operator | Delete pipeline | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/pipelines` | viewer | List pipelines | — | #/components/responses/Unauthorized | yes |
| POST | `/api/pipelines` | operator | Create pipeline | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/RateLimited | yes |
| PUT | `/api/pipelines` | operator | Update pipeline | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/pipelines/run` | viewer | — | — | — | no |
| POST | `/api/pipelines/run` | operator | Run a pipeline | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |

### projects

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/projects` | viewer | List all projects | — | — | yes |
| POST | `/api/projects` | operator | Create a new project | — | — | yes |
| DELETE | `/api/projects/{id}` | admin | Delete a project | — | — | yes |
| GET | `/api/projects/{id}` | viewer | Get project by ID | — | — | yes |
| PATCH | `/api/projects/{id}` | operator | Update a project | — | — | yes |
| DELETE | `/api/projects/{id}/agents` | operator | — | — | — | no |
| GET | `/api/projects/{id}/agents` | viewer | — | — | — | no |
| POST | `/api/projects/{id}/agents` | operator | — | — | — | no |
| GET | `/api/projects/{id}/tasks` | viewer | List tasks in a project | — | — | yes |

### quality-review

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/quality-review` | viewer | List quality reviews | — | — | yes |
| POST | `/api/quality-review` | operator | Submit a quality review | — | — | yes |

### releases

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/releases/check` | public | Check for new releases | — | — | yes |
| POST | `/api/releases/update` | admin | — | — | — | no |

### schedule-parse

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/schedule-parse` | public | — | — | — | no |

### scheduler

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/scheduler` | admin | Get scheduler status | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/scheduler` | admin | Trigger scheduled task | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### search

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/search` | viewer | Full-text search | — | #/components/responses/BadRequest, #/components/responses/Unauthorized | yes |

### security-audit

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/security-audit` | admin | — | — | — | no |

### security-scan

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/security-scan` | admin | — | — | — | no |
| POST | `/api/security-scan/agent` | admin | — | — | — | no |
| POST | `/api/security-scan/fix` | admin | — | — | — | no |

### sessions

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/sessions` | operator | — | — | — | no |
| GET | `/api/sessions` | viewer | List gateway sessions | — | #/components/responses/Unauthorized | yes |
| POST | `/api/sessions` | operator | — | — | — | no |
| POST | `/api/sessions/{id}/control` | operator | Control session (pause/resume/kill) | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| POST | `/api/sessions/continue` | operator | — | — | — | no |
| GET | `/api/sessions/transcript` | viewer | — | — | — | no |
| GET | `/api/sessions/transcript/aggregate` | viewer | — | — | — | no |
| GET | `/api/sessions/transcript/gateway` | viewer | — | — | — | no |

### settings

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/settings` | admin | — | — | — | no |
| GET | `/api/settings` | admin | Get application settings | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| PUT | `/api/settings` | admin | — | — | — | no |

### setup

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/setup` | public | — | — | — | no |
| POST | `/api/setup` | public | — | — | — | no |

### skills

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/skills` | operator | — | — | — | no |
| GET | `/api/skills` | viewer | — | — | — | no |
| POST | `/api/skills` | operator | — | — | — | no |
| PUT | `/api/skills` | operator | — | — | — | no |
| GET | `/api/skills/registry` | viewer | — | — | — | no |
| POST | `/api/skills/registry` | admin | — | — | — | no |
| PUT | `/api/skills/registry` | viewer | — | — | — | no |

### spawn

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/spawn` | viewer | — | — | — | no |
| POST | `/api/spawn` | operator | Spawn agent process | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |

### standup

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/standup` | viewer | Get standup report | — | #/components/responses/Unauthorized | yes |
| POST | `/api/standup` | operator | — | — | — | no |

### status

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/status` | viewer | Get system status | — | — | yes |

### super

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/super/os-users` | admin | — | — | — | no |
| POST | `/api/super/os-users` | admin | — | — | — | no |
| GET | `/api/super/provision-jobs` | admin | List provision jobs | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/super/provision-jobs` | admin | Create provision job | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/super/provision-jobs/{id}` | admin | Get provision job details | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| POST | `/api/super/provision-jobs/{id}` | admin | — | — | — | no |
| POST | `/api/super/provision-jobs/{id}/run` | admin | Run provision job | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/super/tenants` | admin | List tenants | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/super/tenants` | admin | Create tenant and bootstrap job | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, Error | yes |
| POST | `/api/super/tenants/{id}/decommission` | admin | Decommission tenant | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |

### system-monitor

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/system-monitor` | viewer | — | — | — | no |

### tasks

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/tasks` | viewer | List tasks | — | Task, #/components/responses/Unauthorized | yes |
| POST | `/api/tasks` | operator | Create task | — | Task, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, Error, #/components/responses/RateLimited | yes |
| PUT | `/api/tasks` | operator | Bulk update task statuses | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/RateLimited | yes |
| DELETE | `/api/tasks/{id}` | operator | Delete task | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/tasks/{id}` | viewer | Get task by ID | — | Task, #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| PUT | `/api/tasks/{id}` | operator | Update task | — | Task, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound, #/components/responses/RateLimited | yes |
| GET | `/api/tasks/{id}/branch` | viewer | — | — | — | no |
| POST | `/api/tasks/{id}/branch` | operator | — | — | — | no |
| POST | `/api/tasks/{id}/broadcast` | operator | Broadcast task to agents | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/tasks/{id}/comments` | viewer | List task comments | — | #/components/responses/Unauthorized, #/components/responses/NotFound | yes |
| POST | `/api/tasks/{id}/comments` | operator | Add comment to task | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/tasks/outcomes` | viewer | — | — | — | no |
| GET | `/api/tasks/queue` | operator | Poll next task for an agent | — | Task, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/tasks/regression` | viewer | — | — | — | no |

### tokens

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/tokens` | viewer | Query token usage | — | TokenUsageRecord, TokenStats, #/components/responses/BadRequest, #/components/responses/Unauthorized | yes |
| POST | `/api/tokens` | operator | Record token usage | — | TokenUsageRecord, #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| GET | `/api/tokens/by-agent` | viewer | — | — | — | no |
| GET | `/api/tokens/rotate` | admin | — | — | — | no |
| POST | `/api/tokens/rotate` | admin | — | — | — | no |

### webhooks

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/webhooks` | admin | Delete webhook | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound, #/components/responses/RateLimited | yes |
| GET | `/api/webhooks` | admin | List webhooks | — | Webhook, #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/webhooks` | admin | Create webhook | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/RateLimited | yes |
| PUT | `/api/webhooks` | admin | Update webhook | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound, #/components/responses/RateLimited | yes |
| GET | `/api/webhooks/deliveries` | admin | Get webhook delivery history | — | #/components/responses/Unauthorized, #/components/responses/Forbidden | yes |
| POST | `/api/webhooks/n8n` | admin | — | — | — | no |
| POST | `/api/webhooks/retry` | admin | Retry a failed webhook delivery | — | — | yes |
| POST | `/api/webhooks/test` | admin | Test webhook | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/webhooks/verify-docs` | viewer | Get webhook verification documentation | — | — | yes |

### workflows

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| DELETE | `/api/workflows` | operator | Delete workflow template | — | #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |
| GET | `/api/workflows` | viewer | List workflow templates | — | #/components/responses/Unauthorized | yes |
| POST | `/api/workflows` | operator | Create workflow template | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/RateLimited | yes |
| PUT | `/api/workflows` | operator | Update workflow template | — | #/components/responses/BadRequest, #/components/responses/Unauthorized, #/components/responses/Forbidden, #/components/responses/NotFound | yes |

### workload

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/workload` | viewer | Get real-time workload recommendation | — | #/components/responses/Unauthorized | yes |

### workspaces

| Method | Path | Role | Summary | Request schema refs | Response schema refs | OpenAPI |
|---|---|---:|---|---|---|---|
| GET | `/api/workspaces` | viewer | — | — | — | no |
| POST | `/api/workspaces` | admin | — | — | — | no |
| DELETE | `/api/workspaces/{id}` | admin | — | — | — | no |
| GET | `/api/workspaces/{id}` | viewer | — | — | — | no |
| PUT | `/api/workspaces/{id}` | admin | — | — | — | no |

