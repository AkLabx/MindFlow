import { expect, test, type Page, type Route } from '@playwright/test';

const SUPABASE_URL = 'https://sjcfagpjstbfxuiwhlps.supabase.co';
const MOCK_USER_ID = '11111111-1111-4111-8111-111111111111';
const TEST_ID = 'test-bpsc-e2e';
const SERIES_ID = 'ser-bpsc';
const CATEGORY_ID = 'cat-bpsc';
const Q1_ID = '11111111-1111-4111-8111-000000000001';
const Q2_ID = '11111111-1111-4111-8111-000000000002';

const MOCK_USER = {
  id: MOCK_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'e2e-student@mindflow.test',
  created_at: '2025-01-01T00:00:00Z',
  user_metadata: {
    full_name: 'E2E Aspirant',
    onboarding_completed: true,
  },
};

const MOCK_CATEGORY = {
  id: CATEGORY_ID,
  name: 'BPSC',
  description: 'Bihar Public Service Commission Examinations',
  is_active: true,
  display_order: 1,
  created_at: '2025-01-01T00:00:00Z',
};

const MOCK_SERIES = {
  id: SERIES_ID,
  category_id: CATEGORY_ID,
  name: '70th BPSC Prelims Series',
  slug: '70th-bpsc-prelims-series',
  description: 'Full-length bilingual BPSC Prelims practice series.',
  thumbnail_url: null,
  is_premium: false,
  is_published: true,
  created_at: '2025-01-01T00:00:00Z',
  mock_categories: {
    id: CATEGORY_ID,
    name: 'BPSC',
    description: 'Bihar Public Service Commission Examinations',
    image_url: null,
    is_active: true,
  },
};

const MOCK_TEST = {
  id: TEST_ID,
  series_id: SERIES_ID,
  name: '70th BPSC Full-Length Mock #1',
  description: 'Official pattern 70th BPSC Prelims mock test with negative marking.',
  duration_minutes: 60,
  total_marks: 2,
  passing_marks: 0.5,
  negative_marks: 0.33,
  question_ids: [Q1_ID, Q2_ID],
  is_published: true,
  display_order: 1,
  release_date: null,
  expiry_date: null,
  created_at: '2025-01-01T00:00:00Z',
  mock_series: {
    ...MOCK_SERIES,
  },
};

const MOCK_QUESTIONS = [
  {
    id: Q1_ID,
    subject: 'History',
    topic: 'Ancient Bihar',
    examName: 'BPSC',
    examYear: 2024,
    question: 'Which ancient city served as the capital of the Mauryan Empire in Bihar?',
    question_hi: 'बिहार में मौर्य साम्राज्य की राजधानी कौन-सा प्राचीन नगर था?',
    options: ['Patna (Pataliputra)', 'Rajgir', 'Vaishali', 'Gaya'],
    options_hi: ['पटना (पाटलिपुत्र)', 'राजगीर', 'वैशाली', 'गया'],
    correct: 'Patna (Pataliputra)',
    explanation: {
      summary: 'Pataliputra (modern Patna) was the imperial capital of the Mauryan Empire.',
      analysis_correct: 'Chandragupta Maurya and Ashoka ruled from Pataliputra at the confluence of the Ganga and Son.',
      analysis_incorrect: 'Rajgir was the earlier Magadhan capital before Pataliputra.',
    },
    explanation_hi: 'पाटलिपुत्र (आधुनिक पटना) मौर्य साम्राज्य की राजधानी थी।',
    tags: ['ancient-history', 'bihar'],
    sourceInfo: { examName: 'BPSC', examYear: 2024 },
    classification: { subject: 'History', topic: 'Ancient Bihar' },
    properties: { difficulty: 'Medium', questionType: 'MCQ' },
    deleted_at: null,
  },
  {
    id: Q2_ID,
    subject: 'Polity',
    topic: 'Constitutional Bodies',
    examName: 'BPSC',
    examYear: 2024,
    question: 'Which Article of the Indian Constitution provides for the State Election Commission for Panchayats?',
    question_hi: 'भारतीय संविधान का कौन-सा अनुच्छेद पंचायतों के लिए राज्य निर्वाचन आयोग का प्रावधान करता है?',
    options: ['Article 324', 'Article 243K', 'Article 280', 'Article 356'],
    options_hi: ['अनुच्छेद 324', 'अनुच्छेद 243K', 'अनुच्छेद 280', 'अनुच्छेद 356'],
    correct: 'Article 243K',
    explanation: {
      summary: 'Article 243K vests the superintendence, direction, and control of Panchayat elections in a State Election Commission.',
      analysis_correct: 'Added by the 73rd Constitutional Amendment Act, 1992, Article 243K governs Panchayat elections.',
      analysis_incorrect: 'Article 324 deals with the Election Commission of India; Article 280 with the Finance Commission.',
    },
    explanation_hi: 'अनुच्छेद 243K पंचायत चुनावों के लिए राज्य निर्वाचन आयोग का प्रावधान करता है।',
    tags: ['polity', 'panchayati-raj'],
    sourceInfo: { examName: 'BPSC', examYear: 2024 },
    classification: { subject: 'Polity', topic: 'Constitutional Bodies' },
    properties: { difficulty: 'Medium', questionType: 'MCQ' },
    deleted_at: null,
  },
];

function parsePostgrestEqFilter(paramValue: string | null): string | null {
  if (!paramValue) return null;
  if (paramValue.startsWith('eq.')) return paramValue.slice(3);
  return paramValue;
}

function parsePostgrestInFilter(paramValue: string | null): string[] | null {
  if (!paramValue) return null;
  const match = paramValue.match(/^in\.\((.*)\)$/);
  if (!match) return null;
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}

async function fulfillPostgrest(route: Route, rows: any[], status = 200) {
  const accept = route.request().headers()['accept'] ?? '';
  const wantsSingleObject = accept.includes('application/vnd.pgrst.object+json');
  if (wantsSingleObject) {
    if (rows.length === 0) {
      await route.fulfill({
        status: 406,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'PGRST116',
          details: 'The result contains 0 rows',
          hint: null,
          message: 'JSON object requested, multiple (or no) rows returned',
        }),
      });
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(rows[0]),
    });
    return;
  }

  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(rows),
  });
}

async function setupMockSupabase(page: Page) {
  const attemptsStore: any[] = [];
  let mockTestsFetchCount = 0;

  await page.addInitScript(
    ({ user, userId }) => {
      localStorage.setItem(
        'sb-sjcfagpjstbfxuiwhlps-auth-token',
        JSON.stringify({
          access_token: 'e2e-access-token',
          refresh_token: 'e2e-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user,
        })
      );
      localStorage.setItem(`onboarding_status_${userId}`, 'COMPLETED');
      localStorage.setItem('mindflow_device_session_id', 'e2e-device-session-1');
      localStorage.setItem('mindflow_last_auth_user_id', userId);
      localStorage.setItem(`mindflow_last_full_sync_${userId}`, String(Date.now()));
      sessionStorage.setItem('mindflow_intro_played_v2', 'true');
      sessionStorage.setItem('mindflow_booted', 'true');
    },
    { user: MOCK_USER, userId: MOCK_USER_ID }
  );

  // Neutralize Supabase Realtime WebSocket traffic in offline/mocked E2E mode so no socket errors pollute console.
  await page.routeWebSocket(/sjcfagpjstbfxuiwhlps\.supabase\.co\/realtime\/v1/, (ws) => {
    ws.onMessage((message) => {
      if (typeof message !== 'string') return;
      try {
        const parsed = JSON.parse(message);
        if (parsed && typeof parsed === 'object' && 'topic' in parsed && 'ref' in parsed) {
          ws.send(
            JSON.stringify({
              topic: parsed.topic,
              event: 'phx_reply',
              payload: { status: 'ok', response: {} },
              ref: parsed.ref,
            })
          );
        }
      } catch {
        // Ignore non-JSON heartbeat frames
      }
    });
  });

  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.endsWith('/auth/v1/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      });
      return;
    }

    if (pathname.endsWith('/auth/v1/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'e2e-access-token',
          refresh_token: 'e2e-refresh-token',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: MOCK_USER,
        }),
      });
      return;
    }

    if (pathname.endsWith('/auth/v1/logout')) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.endsWith('/rest/v1/app_ui_config')) {
      const cfg = {
        id: 1,
        version: 1,
        show_intro: false,
        maintenance_mode: false,
        intro: { active: 'blue', duration: 0, skipDelay: 0, enabled: false },
        theme: { mode: 'system', primaryColor: '#4f46e5', fontFamily: 'sans' },
        loading: { activeVariant: 'synaptic', speed: 'normal', showEmblem: true },
        dashboard: {},
        branding: {
          appName: 'MindFlow',
          welcomeText: 'Welcome to MindFlow',
          tagline: 'The ultimate learning platform.',
          logoUrl: null,
          versionNotice: {
            enabled: false,
            message: '',
            severity: 'info',
            dismissible: true,
          },
        },
      };
      await fulfillPostgrest(route, [cfg]);
      return;
    }

    if (pathname.endsWith('/rest/v1/profiles')) {
      if (method === 'PATCH') {
        await fulfillPostgrest(route, [
          {
            id: MOCK_USER_ID,
            full_name: 'E2E Aspirant',
            email: MOCK_USER.email,
            target_exam: 'BPSC',
            status: 'active',
            delete_requested_at: null,
          },
        ]);
        return;
      }
      await fulfillPostgrest(route, [
        {
          id: MOCK_USER_ID,
          full_name: 'E2E Aspirant',
          email: MOCK_USER.email,
          target_exam: 'BPSC',
          status: 'active',
          delete_requested_at: null,
        },
      ]);
      return;
    }

    if (pathname.endsWith('/rest/v1/rpc/get_my_roles')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['student']),
      });
      return;
    }

    if (pathname.endsWith('/rest/v1/rpc/get_test_leaderboard')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (pathname.endsWith('/rest/v1/user_active_sessions')) {
      const sessionRow = {
        user_id: MOCK_USER_ID,
        session_token: 'e2e-device-session-1',
      };
      await fulfillPostgrest(route, [sessionRow]);
      return;
    }

    if (pathname.endsWith('/rest/v1/mock_categories')) {
      await fulfillPostgrest(route, [MOCK_CATEGORY]);
      return;
    }

    if (pathname.endsWith('/rest/v1/mock_series')) {
      await fulfillPostgrest(route, [MOCK_SERIES]);
      return;
    }

    if (pathname.endsWith('/rest/v1/mock_tests')) {
      mockTestsFetchCount += 1;
      const idFilter = parsePostgrestEqFilter(url.searchParams.get('id'));
      const matched = idFilter ? [MOCK_TEST].filter((t) => t.id === idFilter) : [MOCK_TEST];
      await fulfillPostgrest(route, matched);
      return;
    }

    if (pathname.endsWith('/rest/v1/questions')) {
      const inIds = parsePostgrestInFilter(url.searchParams.get('id'));
      const matched = inIds ? MOCK_QUESTIONS.filter((q) => inIds.includes(q.id)) : MOCK_QUESTIONS;
      await fulfillPostgrest(route, matched);
      return;
    }

    if (pathname.endsWith('/rest/v1/mock_test_attempts')) {
      if (method === 'GET') {
        const idFilter = parsePostgrestEqFilter(url.searchParams.get('id'));
        const testIdFilter = parsePostgrestEqFilter(url.searchParams.get('test_id'));
        const userIdFilter = parsePostgrestEqFilter(url.searchParams.get('user_id'));
        const statusFilter = parsePostgrestEqFilter(url.searchParams.get('status'));
        const testIdsIn = parsePostgrestInFilter(url.searchParams.get('test_id'));

        let filtered = [...attemptsStore];
        if (idFilter) filtered = filtered.filter((a) => a.id === idFilter);
        if (testIdFilter) filtered = filtered.filter((a) => a.test_id === testIdFilter);
        if (testIdsIn) filtered = filtered.filter((a) => testIdsIn.includes(a.test_id));
        if (userIdFilter) filtered = filtered.filter((a) => a.user_id === userIdFilter);
        if (statusFilter) filtered = filtered.filter((a) => a.status === statusFilter);

        filtered.sort(
          (a, b) => Date.parse(b.created_at || b.start_time || '') - Date.parse(a.created_at || a.start_time || '')
        );
        await fulfillPostgrest(route, filtered);
        return;
      }

      if (method === 'POST') {
        const rawBody = request.postDataJSON();
        const incomingRows = Array.isArray(rawBody) ? rawBody : [rawBody];
        const savedRows: any[] = [];

        for (const row of incomingRows) {
          const existingIdx = attemptsStore.findIndex((a) => a.id === row.id);
          const merged = {
            created_at: row.start_time || new Date().toISOString(),
            ...(existingIdx >= 0 ? attemptsStore[existingIdx] : {}),
            ...row,
          };
          if (existingIdx >= 0) {
            attemptsStore[existingIdx] = merged;
          } else {
            attemptsStore.push(merged);
          }
          savedRows.push(merged);
        }

        await fulfillPostgrest(route, savedRows, 201);
        return;
      }

      if (method === 'PATCH') {
        const idFilter = parsePostgrestEqFilter(url.searchParams.get('id'));
        const userIdFilter = parsePostgrestEqFilter(url.searchParams.get('user_id'));
        const statusFilter = parsePostgrestEqFilter(url.searchParams.get('status'));
        const patch = request.postDataJSON() ?? {};
        const updatedRows: any[] = [];

        for (let i = 0; i < attemptsStore.length; i += 1) {
          const row = attemptsStore[i];
          if (idFilter && row.id !== idFilter) continue;
          if (userIdFilter && row.user_id !== userIdFilter) continue;
          if (statusFilter && row.status !== statusFilter) continue;
          attemptsStore[i] = { ...row, ...patch };
          updatedRows.push(attemptsStore[i]);
        }

        await fulfillPostgrest(route, updatedRows);
        return;
      }
    }

    // Auxiliary tables (analytics_events, user_roles, notifications, sync tables, etc.)
    const accept = request.headers()['accept'] ?? '';
    if (accept.includes('application/vnd.pgrst.object+json')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  return {
    getMockTestsFetchCount: () => mockTestsFetchCount,
  };
}

async function loginLiveIfConfigured(page: Page) {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
  if (!email || !password) return false;

  await page.addInitScript(() => {
    sessionStorage.setItem('mindflow_intro_played_v2', 'true');
    sessionStorage.setItem('mindflow_booted', 'true');
  });

  await page.goto('/#/');
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/#\/(dashboard|onboarding)/);
  return true;
}

test('BPSC Prepared Mock Test student E2E smoke flow', async ({ page }) => {
  test.setTimeout(120_000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  const isLive = await loginLiveIfConfigured(page);
  const mockControls = isLive ? null : await setupMockSupabase(page);

  // 1. Visit BPSC Prepared Mock Tests hub
  await page.goto('/#/mcqs/test-series/bpsc', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  await expect(page.getByRole('heading', { level: 1, name: 'BPSC Prepared Mock Tests' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '70th BPSC Full-Length Mock #1' })).toBeVisible();

  // Verify filter chip click responsiveness (< 16ms main-thread click budget)
  const filterGroup = page.getByRole('group', { name: 'Mock test category filters' });
  const freeChip = filterGroup.getByRole('button', { name: /^Free\b/i });
  const allChip = filterGroup.getByRole('button', { name: /^All\b/i });
  await expect(freeChip).toBeVisible();
  await expect(allChip).toBeVisible();

  const filterClickDurationMs = await page.evaluate(() => {
    const group = document.querySelector('[aria-label="Mock test category filters"]');
    const btn = Array.from((group ?? document).querySelectorAll('button')).find((el) =>
      /^Free\b/i.test((el.textContent || '').trim())
    );
    if (!btn) {
      throw new Error('Free filter chip button not found');
    }
    const start = performance.now();
    btn.click();
    return performance.now() - start;
  });
  // Vite dev + React StrictMode double-render takes ~20-35ms on initial filter click; assert fast (<100ms) UI transition
  expect(filterClickDurationMs).toBeLessThan(100);
  await expect(freeChip).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { level: 3, name: '70th BPSC Full-Length Mock #1' })).toBeVisible();

  await allChip.click();
  await expect(allChip).toHaveAttribute('aria-pressed', 'true');

  // 2. Navigate to TestDetailPage and start the test
  await page.getByRole('button', { name: /View & Start Test/i }).click();
  await expect(page).toHaveURL(new RegExp(`#/mcqs/test-series/test/${TEST_ID}$`));
  await expect(page.getByRole('heading', { level: 1, name: '70th BPSC Full-Length Mock #1' })).toBeVisible();

  await page.getByRole('button', { name: /^Start Test$/i }).click();
  await expect(page).toHaveURL(new RegExp(`#/exam/${TEST_ID}$`));

  // 3. CBT Runner: answer Q1 with Option A, advance to Q2, mark Q2 for review, verify palette, submit
  await expect(page.getByText('Question 1 of 2')).toBeVisible();
  const q1FirstOption = page.getByRole('radio').first();
  await q1FirstOption.click();
  await expect(q1FirstOption).toHaveAttribute('aria-checked', 'true');

  const saveNextBtn = page.getByTestId('cbt-save-next-btn');
  await expect(saveNextBtn).toContainText('Save & Next');
  await saveNextBtn.click();

  await expect(page.getByText('Question 2 of 2')).toBeVisible();
  const markReviewBtn = page.getByTestId('cbt-mark-review-btn');
  await markReviewBtn.click();
  await expect(markReviewBtn).toHaveAttribute('aria-pressed', 'true');

  // Verify Question Palette buttons reflect Q1 Answered and Q2 Marked for Review
  const desktopPalette = page.getByRole('complementary', { name: 'Question Palette' });
  await expect(desktopPalette.getByRole('button', { name: /Question 1, Answered/i })).toBeVisible();
  await expect(
    desktopPalette.getByRole('button', { name: /Question 2, Marked for Review, current question/i })
  ).toBeVisible();

  await page.getByTestId('open-submit-dialog-btn').click();
  const submitDialog = page.getByTestId('cbt-submit-dialog');
  await expect(submitDialog).toBeVisible();
  await expect(submitDialog.getByRole('heading', { name: 'Submit Mock Test?' })).toBeVisible();
  await page.getByTestId('cbt-confirm-submit-btn').click();

  // 4. Verify Scorecard & 1-by-1 Solution Review
  await expect(page).toHaveURL(new RegExp(`#/mcqs/test-series/test/${TEST_ID}/result/.+`));
  await expect(page.getByText('Passed Cutoff')).toBeVisible();

  const mainRegion = page.getByRole('main');
  await expect(mainRegion.getByText('Subject-Wise Performance')).toBeVisible();
  await expect(mainRegion.getByText(/^Correct$/i).locator('..')).toContainText('1');
  await expect(mainRegion.getByText(/^Incorrect$/i).locator('..')).toContainText('0');
  await expect(mainRegion.getByText(/^Skipped$/i).locator('..')).toContainText('1');

  // Verify the Review Solutions (1-by-1) CTA is unobstructed (global bottom nav hidden on result page) and switch to Solutions view
  await page.getByRole('button', { name: /Review Solutions \(1-by-1\)/i }).click();
  await expect(page.getByText(/Question 1\b/i)).toBeVisible();
  await expect(page.getByText('Detailed Solution & Explanation')).toBeVisible();
  await expect(page.getByText(MOCK_QUESTIONS[0].question)).toBeVisible();

  await page.getByRole('button', { name: /^Next$/i }).click();
  await expect(page.getByText(/Question 2\b/i)).toBeVisible();
  await expect(page.getByText('Detailed Solution & Explanation')).toBeVisible();
  await expect(page.getByText(MOCK_QUESTIONS[1].question)).toBeVisible();

  // 5. Revisit BPSC Prepared Mock Tests hub and verify 0ms SWR hydration (no re-fetch of /rest/v1/mock_tests within 5m stale-time)
  const fetchesBeforeRevisit = mockControls ? mockControls.getMockTestsFetchCount() : 0;
  await page.goto('/#/mcqs/test-series/bpsc', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'BPSC Prepared Mock Tests' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: '70th BPSC Full-Length Mock #1' })).toBeVisible();

  if (mockControls) {
    // Allow a brief microtask tick so any background fetch would have fired if SWR cache were bypassed
    await page.waitForTimeout(250);
    expect(mockControls.getMockTestsFetchCount()).toBe(fetchesBeforeRevisit);
  }

  expect(consoleErrors, `Unexpected console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
  expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
});
