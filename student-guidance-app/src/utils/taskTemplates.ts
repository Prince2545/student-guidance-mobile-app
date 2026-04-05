import type { TaskTemplate } from '../storage/schema';

const templatesByCareer: Record<string, Omit<TaskTemplate, 'id' | 'careerId' | 'dayIndex'>[]> = {
  cybersecurity: [
    {
      title: 'Threat modeling mini-sprint',
      description: 'Identify likely threats to a simple app flow and propose mitigations.',
      why: 'Threat modeling helps you think proactively instead of reacting after incidents.',
      steps: [
        'Pick one app flow (login, payment, or messaging).',
        'List assets (credentials, tokens, data).',
        'For each threat: entry point, impact, and mitigation.',
        'Write a 5-bullet “next improvements” plan.',
      ],
      materials: ['OWASP Top 10 (overview)', 'A simple diagram (paper or notes)'],
      timeEstimateMinutes: 25,
    },
    {
      title: 'Build a detection checklist',
      description: 'Create a short checklist of log events you would alert on.',
      why: 'Detection engineering turns security goals into concrete monitoring signals.',
      steps: [
        'Choose 5 security-relevant events (auth failures, privilege changes, etc.).',
        'For each: what it looks like, severity, and response action.',
        'Add a “tuning” note (what would reduce false positives).',
      ],
      materials: ['Any sample logs (CSV/text) or mock events'],
      timeEstimateMinutes: 20,
    },
    {
      title: 'Incident response tabletop',
      description: 'Run a quick tabletop exercise for a “credential compromise” scenario.',
      why: 'Tabletop practice reduces confusion under real pressure.',
      steps: [
        'Define roles: triage, comms, and remediation.',
        'Timeline: first 30 minutes, first 4 hours, first 24 hours.',
        'Decide what to preserve for forensics.',
      ],
      materials: ['Incident response notes (your own template)'],
      timeEstimateMinutes: 30,
    },
    {
      title: 'Security review: authentication & tokens',
      description: 'Review a hypothetical auth flow and list security improvements.',
      why: 'Many compromises start at authentication and session handling.',
      steps: [
        'Check password handling, rate limiting, and reset flow safety.',
        'Verify token lifetime + refresh behavior.',
        'List at least 3 mitigations (e.g., MFA, safe defaults).',
      ],
      materials: ['Checklist you create while reviewing'],
      timeEstimateMinutes: 25,
    },
    {
      title: 'Publish a 1-page security report',
      description: 'Summarize what you found and how you would iterate.',
      why: 'Clear reporting builds credibility and communicates risk effectively.',
      steps: [
        'Write: summary, key risks, mitigations, and “next steps”.',
        'Include 3 concrete recommendations with impact level.',
      ],
      materials: ['Notes + the templates from earlier tasks'],
      timeEstimateMinutes: 20,
    },
  ],
  designer: [
    {
      title: 'Accessibility + UX first pass',
      description: 'Pick a screen concept and audit it for accessibility and clarity.',
      why: 'Designing for clarity early saves rework later and improves user outcomes.',
      steps: [
        'Choose a screen: onboarding, settings, or checkout.',
        'Check contrast, font sizes, and interaction targets.',
        'List 5 usability improvements.',
        'Add one “accessibility win” you can measure.',
      ],
      materials: ['A simple screen sketch or notes'],
      timeEstimateMinutes: 25,
    },
    {
      title: 'Wireframe to user journey',
      description: 'Translate one user journey into a simple wireframe outline.',
      why: 'Connecting journey and wireframes makes the experience coherent.',
      steps: [
        'Write the user goal in one sentence.',
        'Break the journey into 4–6 steps.',
        'Create a wireframe outline for each step.',
      ],
      materials: ['Paper, Figma, or plain text mockups'],
      timeEstimateMinutes: 30,
    },
    {
      title: 'Microcopy + error states',
      description: 'Define microcopy for success, empty, and error states.',
      why: 'Great microcopy reduces confusion and increases trust.',
      steps: [
        'Pick one form field or action.',
        'Write: success message, empty state, and 2 error messages.',
        'Make each message actionable (what to do next).',
      ],
      materials: ['Your notes + the UI flow'],
      timeEstimateMinutes: 20,
    },
    {
      title: 'Prototype: one interaction loop',
      description: 'Design one interaction loop (tap → feedback → next step).',
      why: 'Prototyping improves feedback speed before you invest heavily.',
      steps: [
        'Choose one key action.',
        'Sketch the screens/frames for the loop.',
        'Add feedback: loading, success, and retry behaviors.',
      ],
      materials: ['Prototype sketch or short screen recording'],
      timeEstimateMinutes: 25,
    },
    {
      title: 'Portfolio case study outline',
      description: 'Write a brief case study structure for your work.',
      why: 'A strong case study helps others understand your decision-making.',
      steps: [
        'Define problem, constraints, and target user.',
        'Summarize your approach + tradeoffs.',
        'List results and what you would iterate next.',
      ],
      materials: ['Any notes/screenshots you already have'],
      timeEstimateMinutes: 20,
    },
  ],
  data_analyst: [
    {
      title: 'Dataset cleanup + summary stats',
      description: 'Clean a small dataset and compute basic summary statistics.',
      why: 'Reliable analysis starts with clean, well-understood data.',
      steps: [
        'List columns, types, and any missing/odd values.',
        'Decide one cleanup strategy per issue.',
        'Compute: mean/median, missing rate, and one grouping insight.',
      ],
      materials: ['A CSV or small sample dataset (any)'],
      timeEstimateMinutes: 30,
    },
    {
      title: 'Visualize distributions + outliers',
      description: 'Create 2 plots and interpret what they reveal.',
      why: 'Visualization turns numbers into decisions.',
      steps: [
        'Pick one distribution plot and one outlier-focused view.',
        'Write 3 insights in plain language.',
        'Propose one next test or follow-up question.',
      ],
      materials: ['Tool of choice: spreadsheet, Python, or notes'],
      timeEstimateMinutes: 25,
    },
    {
      title: 'Cohort-style narrative',
      description: 'Write a short analysis narrative based on a subset of data.',
      why: 'Clear narratives make findings actionable for stakeholders.',
      steps: [
        'Choose a segment (new vs returning, region, etc.).',
        'Compare behavior with at least one metric.',
        'Summarize: what changed, why it might matter, next action.',
      ],
      materials: ['Your computed metric(s)'],
      timeEstimateMinutes: 20,
    },
    {
      title: 'A/B reasoning exercise',
      description: 'Assume an experiment and outline evaluation criteria.',
      why: 'Good experiment design prevents misleading conclusions.',
      steps: [
        'Define hypothesis and primary metric.',
        'List success criteria and guardrail metrics.',
        'Write how you would check data quality and bias.',
      ],
      materials: ['Any example experiment you can model'],
      timeEstimateMinutes: 25,
    },
    {
      title: 'Write a one-page data story',
      description: 'Create a concise story: question, method, findings, next steps.',
      why: 'Stakeholders don’t want raw analysis—they want decisions.',
      steps: [
        'Write the question and context in 2–3 sentences.',
        'List your top 3 findings.',
        'Recommend what to do next and what to measure.',
      ],
      materials: ['Your notes + plots/summary'],
      timeEstimateMinutes: 20,
    },
  ],
  software_engineer: [
    {
      title: 'Small feature build + test',
      description: 'Implement a tiny feature and add at least one automated test.',
      why: 'Small iterations build confidence and improve engineering habits.',
      steps: [
        'Pick a tiny feature (toggle, filter, or validation).',
        'Implement the behavior end-to-end.',
        'Add one test that covers the main scenario.',
      ],
      materials: ['Your repo and any test framework you prefer'],
      timeEstimateMinutes: 35,
    },
    {
      title: 'Refactor for clarity',
      description: 'Refactor a function/module to reduce complexity without changing behavior.',
      why: 'Refactoring improves maintainability and makes future work faster.',
      steps: [
        'Identify one hard-to-read section.',
        'Extract functions and improve naming.',
        'Confirm behavior remains the same (tests/spot checks).',
      ],
      materials: ['Before/after notes (optional)'],
      timeEstimateMinutes: 25,
    },
    {
      title: 'Design a simple API contract',
      description: 'Write endpoint/response examples and error cases.',
      why: 'Clear contracts reduce integration bugs and improve collaboration.',
      steps: [
        'Choose an API use case.',
        'Define request/response shapes and status codes.',
        'List 3 error scenarios with message format.',
      ],
      materials: ['A short written contract (docs/notes)'],
      timeEstimateMinutes: 20,
    },
    {
      title: 'Async workflow checklist',
      description: 'Model a workflow involving async steps and retries.',
      why: 'Async reliability is a major source of production issues.',
      steps: [
        'List each step and the possible failure states.',
        'Define retry policy and idempotency expectations.',
        'Write how you would log/observe it.',
      ],
      materials: ['Notes + your checklist'],
      timeEstimateMinutes: 30,
    },
    {
      title: 'Mini post-mortem',
      description: 'Document what you learned and what you would improve next.',
      why: 'Post-mortems convert experience into repeatable improvement.',
      steps: [
        'Describe what worked and what didn’t.',
        'Identify the root cause(s) of one issue.',
        'Propose one process improvement for the next iteration.',
      ],
      materials: ['Your task notes and what you discovered'],
      timeEstimateMinutes: 20,
    },
  ],
};

export function getTaskTemplatesForCareer(careerId: string): TaskTemplate[] {
  const list = templatesByCareer[careerId];
  if (!list) return [];
  return list.map((t, idx) => ({
    id: `${careerId}_task_${idx}`,
    careerId,
    dayIndex: idx,
    ...t,
  }));
}

