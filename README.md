# diaBEATes

diaBEATes is a prototype diabetes and prediabetes tracking app built as a class project. It is designed to help a user do more than just record numbers. The app combines logging, analytics, report generation, rule-based insights, question answering, and immediate emotional support into a single product system.

This project is an application-focused AI product prototype built to explore how lightweight intelligence, careful UX, and supportive health design can help people better understand glucose patterns and communicate about them.

## Overview

Many diabetes tools help people log data, but logging by itself is often not enough. A glucose number only becomes useful when the user can place it in context:

- What did I eat?
- Is this part of a trend or a one-off reading?
- What should I pay attention to this week?
- What do I show my doctor?

diaBEATes was built around that gap between raw logging and meaningful understanding. The current prototype helps users:

- record glucose and related health context
- review trends and recent history
- see computed analytics and rule-based insights
- generate a provider-facing summary report
- ask questions about their own data through a local Q&A assistant
- access a calm support flow during concerning glucose moments

## Motivation / Problem

This project is personally meaningful to me because my dad was diagnosed with type 2 diabetes. That experience made the problem feel concrete rather than abstract. Diabetes management is not only about taking readings. It also involves uncertainty, pattern recognition, emotional stress, habit-building, and communication with clinicians.

The real-world problem this project addresses is that diabetes and prediabetes tracking can easily become fragmented and hard to interpret:

- people may log values but struggle to see what is changing over time
- trends are hard to understand without meal, sleep, exercise, and medication context
- concerning moments can feel isolating and emotionally overwhelming
- it is difficult to turn everyday tracking into something useful for a doctor visit

The opportunity here is not just to make another tracker, but to build a more supportive interpretation layer around everyday health data. That is why diaBEATes includes not only logging and analytics, but also reporting, rule-based insights, question answering, and emotional/immediate support.

I wanted the project to be ambitious in a practical way: not a vague AI concept, but a working product system that demonstrates how AI-assisted development and thoughtful product design can be used to build something socially meaningful.

## How the Product Works

The app is a frontend web application built with Next.js, React, TypeScript, and Tailwind CSS.

At a high level, the product works like this:

1. A user enters health-related data such as glucose, meal notes, exercise notes, sleep hours, medication, and general notes.
2. The app stores that data locally in the browser using `localStorage`.
3. A client-side analytics layer computes structured metrics from the saved entries.
4. A deterministic rule-based intelligence layer turns those metrics into:
   - insights
   - report summaries
   - question-answer responses
5. A separate support flow lets users quickly log a concerning moment or save emotional notes, with optional inclusion in the doctor report.

Because the app is local-first right now, it works as a prototype without requiring authentication or a backend database.

## Features

### Landing Page

- branded front page for diaBEATes
- explains the purpose of the app
- presents a calm, health-focused visual identity
- includes clear calls to action into the app experience

### Dashboard

- summary cards for key glucose metrics
- prominent insights panel
- integrated Glucose Q&A assistant
- recent entries table with edit/delete actions
- expandable history view with `Show More` / `Show Less`

### Logging

- full Log Entry form for structured tracking
- fields for:
  - glucose value
  - timestamp
  - reading type
  - meal note
  - exercise note
  - sleep hours
  - medication
  - notes
- local persistence after refresh
- edit and delete flows for existing entries

### Trends

- glucose-over-time chart based on saved entries
- timestamp-aware plotting
- readable axes and labels
- recent glucose history below the chart
- empty-state handling when not enough data exists

### Report Page

- provider-facing summary layout
- report date and covered date range
- overview metrics and key insights
- recent notable entries
- patient-reported thoughts if the user explicitly chose to include them
- copyable report summary
- browser print/PDF workflow
- “Prepare to Send Report” UI scaffold for future doctor-sharing workflows

### Glucose Q&A

- chat-style question box
- rule-based responses grounded in the user’s saved entries
- answers use meal notes, sleep, exercise, reading types, and recent highs/lows when available
- supportive tone without diagnosing or changing medication advice

### Support Now / Emotional Support

- quick support entry point for concerning glucose moments
- quick logging flow that saves into the main history pipeline
- emotional support flow with:
  - guided breathing visual
  - feelings selection
  - thoughts/feelings note
  - optional inclusion in doctor report
- emergency help panel with visible 911 action and placeholders for doctor/emergency contact

## How AI Was Used

I used Codex as my primary development tool while still directing the project myself.

More specifically:

- I came up with the project idea.
- I defined the motivation, product scope, and feature priorities.
- I wrote the prompts and iteratively refined them.
- I made the design decisions, architecture decisions, and UX decisions.
- I tested the product continuously and used those findings to request fixes and refinements.
- I decided what features stayed, what changed, and what the final product should communicate.

Codex was used to build the product. It helped implement the frontend, refactor the code, and iterate quickly on features and interface changes. However, Codex was not the source of the project idea. I used it as a development tool under my direction, similar to an AI-assisted engineering workflow.

## Technical Implementation

### Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- browser `localStorage` for persistence

### Architecture

The system is organized into several layers:

#### 1. Frontend application

- App Router-based Next.js UI
- reusable panels, cards, headers, and navigation
- responsive layouts for landing, dashboard, logging, trends, report, and support flows

#### 2. Local data layer

- entries saved in browser local storage
- separate support-note storage for emotional/support moments
- shared client-side providers keep pages in sync after create/edit/delete

#### 3. Analytics layer

The app computes metrics such as:

- average glucose
- average fasting glucose
- average after-meal glucose
- highest glucose
- lowest glucose
- glucose range
- elevated reading count
- 7-day average glucose
- previous 7-day average glucose
- comparison between recent and previous periods
- average sleep

#### 4. Rule-based intelligence layer

The current prototype uses deterministic logic to produce:

- natural-language insights
- provider summary language
- Glucose Q&A responses
- data-informed discussion points for a doctor report

### Iterative development

The app evolved substantially over time. It started as a very small MVP shell and gradually expanded into a richer product system with:

- persistent logging
- client-safe local storage loading
- trends visualization
- richer analytics
- insights
- provider reports
- entry editing/deleting
- Q&A
- emotional/immediate support tools
- polished product-style UI

That iteration is important to the project because the final result was not built in one step. It improved through repeated testing, failure analysis, redesign, and refinement.

## Evaluation / What I Tested

This project is a prototype, so evaluation focused on product behavior, internal consistency, and iterative refinement.

### What I tested during development

- logging and local persistence after refresh
- dashboard summary cards updating from saved entries
- trends chart behavior across sparse and larger datasets
- report generation and provider-facing summary structure
- edit and delete flows for existing entries
- support-note inclusion vs. privacy in the doctor report
- recent-entry browsing with show more/show less
- Q&A behavior for different question intents
- consistency between analytics, insights, report language, and visible saved data

### Problems I encountered and fixed

During development, I specifically encountered and refined issues such as:

- hydration mismatches caused by localStorage-dependent values rendering differently on server and client
- inconsistent or contradictory insight statements
- analytics and insight wording not matching the displayed metrics
- weak or repetitive Glucose Q&A responses
- incorrect or overly limited recent-entry logic
- edit-entry behavior creating or mishandling duplicate records before the flow was corrected
- the need to better separate emotional support notes from normal entry history

### What this evaluation does and does not prove

What this work does show:

- the product is functional as a local-first prototype
- the analytics and rule-based layers can produce meaningful feedback from structured user-entered data
- the app can support end-to-end flows from logging to reporting to supportive reflection

What this work does not yet prove:

- clinical usefulness
- long-term behavior change outcomes
- usability quality across a broad user population

## Major Decisions

Several decisions shaped the current version of diaBEATes:

### Local-first prototype instead of backend infrastructure

I kept the app local and browser-based so I could focus on the core product experience first:

- logging
- interpretation
- reporting
- support UX

This made the prototype faster to build and easier to test, though it also limits realism.

### Product-system framing instead of model-training framing

This project is best understood as an AI-assisted application/product system rather than an ML research model. The interesting work here is designing a usable product that connects data entry, analytics, interpretation, support, and communication.

### Emotional support as part of diabetes tracking

I chose to include emotional and immediate support because diabetes management is not only physical. Stress, fear, frustration, and uncertainty affect how people experience health tracking, especially during concerning moments. That is why the app includes both reflection tools and calm immediate support patterns.

## Limitations

diaBEATes is still a prototype and has important limitations:

- no real backend or database
- no authentication
- no clinician portal or real report-sending pipeline
- no integration with CGMs, wearables, labs, or pharmacy systems
- no clinical validation
- no user study data yet
- no medical personalization beyond rule-based heuristics
- no comparison yet against existing diabetes products

Most importantly, this app is not a replacement for professional medical advice. It is a prototype interface for logging, interpretation, and support.

## Future Work

If I continued this project, the next steps would include:

- incorporating a voice-to-text feature
- having a chat with physician option
- secure accounts and cloud persistence
- clinician review of report usefulness and support language
- comparison against existing diabetes-tracking apps
- more robust accessibility testing

## How to Use the App

1. Start the development server:

```bash
npm install
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. Use the landing page to enter the app
4. Add entries from `Log Entry`
5. Review patterns in `Dashboard` and `Trends`
6. Open `Report` for a provider-style summary
7. Use `Support Now` for quick logging or emotional support during a concerning moment

## Repository Notes

- the public repo and commit history reflect iterative development over time
- the app was repeatedly refined through feature additions, UI redesigns, debugging, and architecture cleanups
- this README is intended to make the repository understandable to both technical and non-technical readers

## Credits / Disclosure

- Project concept, prompting direction, testing, product decisions, and refinement: Maya Vendhan
- AI-assisted implementation partner: OpenAI Codex
- Frameworks and libraries: Next.js, React, TypeScript, Tailwind CSS

If relevant to future revisions, this project would also benefit from feedback from clinicians, diabetes educators, and people living with diabetes or prediabetes.
