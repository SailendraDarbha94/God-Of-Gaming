# 0001. Record architecture decisions

Date: 2026-11-04
Status: Accepted

## Context

This repository starts from research, not from code. The research report (see the project README) made recommendations, and the founder has since overridden some of them. Without a written trail, the next person to touch the code, including the founder six months from now, would have to rediscover why things are the way they are.

## Decision

We record every decision that is expensive to reverse, or that a new contributor could not infer from the code, as a short architecture decision record in `docs/adr/`. Records are numbered, dated and written in the Nygard format: context, decision, consequences. Once accepted, a record is not edited except to change its status; a new record supersedes it.

## Consequences

- Decisions are reviewable in pull requests like code.
- The `docs/spec/` documents describe the current target; the ADRs explain why it looks that way. When they disagree, the ADR wins until a new ADR changes it.
- Small, reversible choices (a library for icons, a colour) do not get a record.
