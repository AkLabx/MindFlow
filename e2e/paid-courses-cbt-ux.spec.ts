import { expect, test, type Page, type Route } from '@playwright/test';

const SUPABASE_URL = 'https://sjcfagpjstbfxuiwhlps.supabase.co';
const MOCK_USER_ID = '22222222-2222-4222-8222-222222222222';
const STUDENT_ID = 'MIND-100042';

const CAT_BPSC_ID = 'cat-bpsc-383';
const CAT_SSC_ID = 'cat-ssc-383';
const SER_BPSC_ID = 'ser-bpsc-383';
const SER_SSC_PAID_ID = 'ser-ssc-paid-383';

const TEST_BPSC_ID = 'test-bpsc-383';
const TEST_SSC_DEMO_ID = 'test-ssc-demo-383';
const TEST_SSC_LOCKED_ID = 'test-ssc-locked-383';

const Q1_ID = '22222222-2222-4222-8222-000000000001';
const Q2_ID = '22222222-2222-4222-8222-000000000002';

const MOCK_USER = {
  id: MOCK_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'aspirant383@mindflow.test',
  created_at: '2026-01-01T00:00:00Z',
  user_metadata: {
    full_name: 'Rohan Sharma',
    onboarding_completed: true,
  },
};

const CATEGORIES = [
  { id: CAT_BPSC_ID, name: 'BPSC', description: 'BPSC Exams', is_active: true, display_order: 1, created_at: '2026-01-01T00:00:00Z' },
  { id: CAT_SSC_ID, name: 'SSC CGL', description: 'SSC CGL Exams', is_active: true, display_order: 2, created_at: '2026-01-01T00:00:00Z' },
];

const SERIES = [
  {
    id: SER_BPSC_ID,
    category_id: CAT_BPSC_ID,
    name: '71st BPSC Prelims Official PYQ',
    slug: '71st-bpsc-prelims-official-pyq',
    description: 'Free official BPSC previous year papers.',
    series_type: 'PYQ',
    course_type: 'mock_series',
    is_premium: false,
    price_inr: 0,
    mrp_inr: null,
    validity_days: 365,
    free_demo_count: 1,
    is_published: true,
    created_at: '2026-02-01T00:00:00Z',
    mock_categories: CATEGORIES[0],
  },
  {
    id: SER_SSC_PAID_ID,
    category_id: CAT_SSC_ID,
    name: 'SSC CGL Tier 1 Pro Batch',
    slug: 'ssc-cgl-tier-1-pro-batch',
    description: 'Complete SSC CGL PYQ & Expert mocks.',
    series_type: 'MOCK',
    course_type: 'mock_series',
    is_premium: true,
    price_inr: 349,
    mrp_inr: 699,
    validity_days: 365,
    free_demo_count: 1,
    is_published: true,
    created_at: '2026-02-02T00:00:00Z',
    mock_categories: CATEGORIES[1],
  },
];

const TESTS = [
  {
    id: TEST_BPSC_ID,
    series_id: SER_BPSC_ID,
    name: '71st BPSC Mock Paper 1',
    description: 'Standard MindFlow BPSC CBT',
    test_type: 'PYQ',
    display_order: 1,
    duration_minutes: 120,
    total_marks: 150,
    passing_marks: 75,
    negative_marks: 0.33,
    question_ids: [Q1_ID, Q2_ID],
    is_published: true,
    is_free_demo: true,
    is_live: false,
    created_at: '2026-02-03T00:00:00Z',
    mock_series: SERIES[0],
  },
  {
    id: TEST_SSC_DEMO_ID,
    series_id: SER_SSC_PAID_ID,
    name: 'SSC CGL Tier 1 PYQ 2024 Shift 1',
    description: 'Free demo PYQ in paid SSC CGL batch.',
    test_type: 'PYQ',
    display_order: 1,
    duration_minutes: 60,
    total_marks: 200,
    passing_marks: 120,
    negative_marks: 0.5,
    question_ids: [Q1_ID, Q2_ID],
    is_published: true,
    is_free_demo: true,
    is_live: true,
    live_start_at: '2025-01-01T00:00:00Z',
    live_end_at: '2029-12-31T00:00:00Z',
    created_at: '2026-02-04T00:00:00Z',
    mock_series: SERIES[1],
  },
  {
    id: TEST_SSC_LOCKED_ID,
    series_id: SER_SSC_PAID_ID,
    name: 'SSC CGL Expert Challenger #2',
    description: 'Locked paid expert mock.',
    test_type: 'MOCK',
    display_order: 2,
    duration_minutes: 60,
    total_marks: 200,
    passing_marks: 120,
    negative_marks: 0.5,
    question_ids: [Q1_ID, Q2_ID],
    is_published: true,
    is_free_demo: false,
    is_live: false,
    created_at: '2026-02-05T00:00:00Z',
    mock_series: SERIES[1],
  },
];

const QUESTIONS = [
  {
    id: Q1_ID,
    subject: 'Quantitative Aptitude',
    topic: 'Algebra',
    question: 'If x + 1/x = 5, find x^2 + 1/x^2.',
    question_hi: 'यदि x + 1/x = 5, तो x^2 + 1/x^2 ज्ञात कीजिए।',
    options: ['23', '25', '27', '21'],
    options_hi: ['23', '25', '27', '21'],
    correct: '23',
    explanation: { summary: '(5)^2 - 2 = 23' },
  },
  {
    id: Q2_ID,
    subject: 'General Awareness',
    topic: 'Polity',
    question: 'Article 21 of the Indian Constitution guarantees?',
    question_hi: 'भारतीय संविधान का अनुच्छेद 21 किसकी गारंटी देता है?',
    options: ['Protection of life and personal liberty', 'Equality before law', 'Freedom of speech', 'Right to constitutional remedies'],
    options_hi: ['जीवन और व्यक्तिगत स्वतंत्रता की सुरक्षा', 'कानून के समक्ष समानता', 'वाक् स्वतंत्रता', 'संवैधानिक उपचारों का अधिकार'],
    correct: 'Protection of life and personal liberty',
    explanation: { summary: 'Article 21 protects life and personal liberty.' },
  },
];

function parseEq(val: string | null): string | null {
  if (!val) return null;
  const m = val.match(/^eq\.(.*)$/);
  return m ? m[1] : null;
}

function parseIn(val: string | null): string[] | null {
  if (!val) return null;
  const m = val.match(/^in\.\((.*)\)$/);
  if (!m) return null;
  return m[1].split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
}

async function fulfillPostgrest(route: Route, rows: any[], status = 200) {
  const accept = route.request().headers()['accept'] ?? '';
  if (accept.includes('application/vnd.pgrst.object+json')) {
    if (rows.length === 0) {
      await route.fulfill({
        status: 406,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'PGRST116', message: '0 rows' }),
      });
      return;
    }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(rows[0]) });
    return;
  }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(rows) });
}

async function setupMockBackend(page: Page, options: { withPurchase?: boolean } = {}) {
  let questionsFetchCount = 0;

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
      localStorage.setItem('mindflow_device_session_id', 'e2e-device-session-383');
      localStorage.setItem('mindflow_last_auth_user_id', userId);
      localStorage.setItem(`mindflow_last_full_sync_${userId}`, String(Date.now()));
      sessionStorage.setItem('mindflow_intro_played_v2', 'true');
      sessionStorage.setItem('mindflow_booted', 'true');
    },
    { user: MOCK_USER, userId: MOCK_USER_ID }
  );

  await page.routeWebSocket(/sjcfagpjstbfxuiwhlps\.supabase\.co\/realtime\/v1/, (ws) => {
    ws.onMessage((msg) => {
      if (typeof msg !== 'string') return;
      try {
        const parsed = JSON.parse(msg);
        if (parsed && 'topic' in parsed && 'ref' in parsed) {
          ws.send(JSON.stringify({ topic: parsed.topic, event: 'phx_reply', payload: { status: 'ok', response: {} }, ref: parsed.ref }));
        }
      } catch {}
    });
  });

  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/auth/v1/user')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'e2e-access-token',
        refresh_token: 'e2e-refresh-token',
        expires_in: 3600,
        user: MOCK_USER,
      }),
    });
  });

  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.endsWith('/rest/v1/app_ui_config')) {
      await fulfillPostgrest(route, [
        {
          id: 1,
          version: 1,
          show_intro: false,
          maintenance_mode: false,
          intro: { active: 'blue', duration: 0, skipDelay: 0, enabled: false },
          theme: { mode: 'system', primaryColor: '#4f46e5', fontFamily: 'sans' },
          loading: { activeVariant: 'synaptic', speed: 'normal', showEmblem: true },
          dashboard: {},
          branding: { appName: 'MindFlow', upi_id: 'mindflow@upi' },
        },
      ]);
      return;
    }

    if (pathname.endsWith('/rest/v1/profiles')) {
      await fulfillPostgrest(route, [
        {
          id: MOCK_USER_ID,
          full_name: 'Rohan Sharma',
          email: MOCK_USER.email,
          target_exam: 'SSC CGL',
          student_id: STUDENT_ID,
          status: 'active',
          delete_requested_at: null,
        },
      ]);
      return;
    }

    if (pathname.endsWith('/rest/v1/user_active_sessions')) {
      await fulfillPostgrest(route, [{ user_id: MOCK_USER_ID, session_token: 'e2e-device-session-383' }]);
      return;
    }

    if (pathname.endsWith('/rest/v1/mock_categories')) {
      await fulfillPostgrest(route, CATEGORIES);
      return;
    }

    if (pathname.endsWith('/rest/v1/mock_series')) {
      const idFilter = parseEq(url.searchParams.get('id'));
      await fulfillPostgrest(route, idFilter ? SERIES.filter((s) => s.id === idFilter) : SERIES);
      return;
    }

    if (pathname.endsWith('/rest/v1/mock_tests')) {
      const idFilter = parseEq(url.searchParams.get('id'));
      const seriesFilter = parseEq(url.searchParams.get('series_id'));
      const liveFilter = parseEq(url.searchParams.get('is_live'));
      let list = [...TESTS];
      if (idFilter) list = list.filter((t) => t.id === idFilter);
      if (seriesFilter) list = list.filter((t) => t.series_id === seriesFilter);
      if (liveFilter === 'true') list = list.filter((t) => t.is_live);
      await fulfillPostgrest(route, list);
      return;
    }

    if (pathname.endsWith('/rest/v1/questions')) {
      questionsFetchCount += 1;
      const inIds = parseIn(url.searchParams.get('id'));
      await fulfillPostgrest(route, inIds ? QUESTIONS.filter((q) => inIds.includes(q.id)) : QUESTIONS);
      return;
    }

    if (pathname.endsWith('/rest/v1/payments')) {
      if (options.withPurchase) {
        const future = new Date(Date.now() + 90 * 86_400_000).toISOString();
        await fulfillPostgrest(route, [
          {
            id: 'pay-e2e-1',
            user_id: MOCK_USER_ID,
            order_code: 'ORD-261125-PRO01',
            amount: 349,
            currency: 'INR',
            status: 'paid',
            plan_purchased: 'SSC CGL Tier 1 Pro Batch',
            series_id: SER_SSC_PAID_ID,
            course_type: 'mock_series',
            target_route: `/mcqs/test-series/series/${SER_SSC_PAID_ID}`,
            validity_days: 365,
            valid_until: future,
            payment_method: 'upi_manual',
            upi_reference: 'UTR44556677',
            student_id_snapshot: STUDENT_ID,
            created_at: '2026-11-25T10:00:00Z',
            mock_series: { id: SER_SSC_PAID_ID, name: 'SSC CGL Tier 1 Pro Batch', slug: 'ssc-cgl-tier-1-pro-batch' },
          },
        ]);
      } else {
        await fulfillPostgrest(route, []);
      }
      return;
    }

    if (pathname.endsWith('/rest/v1/user_course_entitlements')) {
      if (options.withPurchase) {
        const future = new Date(Date.now() + 90 * 86_400_000).toISOString();
        await fulfillPostgrest(route, [
          {
            id: 'ent-e2e-1',
            user_id: MOCK_USER_ID,
            student_id_snapshot: STUDENT_ID,
            series_id: SER_SSC_PAID_ID,
            series_name: 'SSC CGL Tier 1 Pro Batch',
            course_type: 'mock_series',
            target_route: `/mcqs/test-series/series/${SER_SSC_PAID_ID}`,
            payment_id: 'pay-e2e-1',
            status: 'active',
            starts_at: '2026-11-25T10:00:00Z',
            valid_until: future,
            created_at: '2026-11-25T10:00:00Z',
            updated_at: '2026-11-25T10:00:00Z',
            mock_series: { id: SER_SSC_PAID_ID, name: 'SSC CGL Tier 1 Pro Batch' },
          },
        ]);
      } else {
        await fulfillPostgrest(route, []);
      }
      return;
    }

    if (pathname.endsWith('/rest/v1/rpc/get_my_roles')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['student']) });
      return;
    }

    if (pathname.endsWith('/rest/v1/rpc/get_test_leaderboard')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      return;
    }

    const accept = route.request().headers()['accept'] ?? '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(accept.includes('application/vnd.pgrst.object+json') ? {} : []),
    });
  });

  return {
    getQuestionsFetchCount: () => questionsFetchCount,
    resetQuestionsFetchCount: () => {
      questionsFetchCount = 0;
    },
  };
}

test('Desktop (1280x800) & Mobile (390x844) v1.0.383 E2E UX, Paid Guard & Layout Geometry', async ({ browser }) => {
  test.setTimeout(150_000);

  // --- PART 1: Mobile (390x844) with 0 purchases ---
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const mPage = await mobileCtx.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  mPage.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  mPage.on('pageerror', (e) => pageErrors.push(e.message));

  const mockControls = await setupMockBackend(mPage, { withPurchase: false });

  // 1. /profile -> Student ID MIND-100042 + 44px copy button
  await mPage.goto('http://127.0.0.1:3000/#/profile', { waitUntil: 'domcontentloaded' });
  await expect(mPage.getByTestId('profile-student-id')).toHaveText(STUDENT_ID);
  const copyBtnBox = await mPage.getByTestId('copy-student-id-btn').boundingBox();
  expect(copyBtnBox?.height).toBeGreaterThanOrEqual(44);
  expect(copyBtnBox?.width).toBeGreaterThanOrEqual(44);

  // 2. /purchased -> My Purchase empty state ("No purchase yet", no Saved Mock Tests)
  await mPage.goto('http://127.0.0.1:3000/#/purchased', { waitUntil: 'domcontentloaded' });
  await expect(mPage.getByRole('heading', { level: 1, name: 'My Purchase' })).toBeVisible();
  await expect(mPage.getByTestId('no-purchase-empty-state')).toBeVisible();
  await expect(mPage.getByText('No purchase yet')).toBeVisible();
  await expect(mPage.getByText(/Saved Mock Tests/i)).toHaveCount(0);

  // 3. /mcqs/test-series -> Horizontal rails, bottom strip clearance above AI orb, zero horizontal overflow
  await mPage.goto('http://127.0.0.1:3000/#/mcqs/test-series', { waitUntil: 'domcontentloaded' });
  await expect(mPage.getByText('71st BPSC Prelims Official PYQ')).toBeVisible();
  await expect(mPage.getByText('SSC CGL Tier 1 Pro Batch')).toBeVisible();
  await expect(mPage.getByRole('group', { name: 'Series source type filter' })).toHaveCount(0);

  const mobileStripGeometry = await mPage.evaluate(() => {
    const strip = document.querySelector('[data-testid="test-series-bottom-action-strip"]');
    const stripPill = strip?.querySelector('.mf-h-rail');
    const aiBtn = document.querySelector('button[aria-label="AI Assistant"]');
    const overflowPx = Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const stripRect = stripPill?.getBoundingClientRect();
    const aiRect = aiBtn?.getBoundingClientRect();
    return {
      overflowPx,
      stripBottom: stripRect?.bottom ?? null,
      aiTop: aiRect?.top ?? null,
    };
  });
  expect(mobileStripGeometry.overflowPx).toBe(0);
  if (mobileStripGeometry.aiTop !== null && mobileStripGeometry.stripBottom !== null) {
    expect(
      mobileStripGeometry.stripBottom,
      `Bottom strip bottom (${mobileStripGeometry.stripBottom}) must leave >=6px clearance above AI Assistant orb top (${mobileStripGeometry.aiTop})`
    ).toBeLessThanOrEqual(mobileStripGeometry.aiTop - 6);
  }

  // Open Live Test bottom sheet from bottom strip
  await mPage.getByTestId('bottom-strip-live-test-btn').click();
  await expect(mPage.getByTestId('live-tests-sheet')).toBeVisible();
  await expect(mPage.getByText('SSC CGL Tier 1 PYQ 2024 Shift 1')).toBeVisible();
  await mPage.getByTestId('live-tests-sheet').getByRole('button', { name: /Close/i }).click();

  // 4. Inside Paid Series (/series/:id) -> PYQ/Expert filter & Checkout modal
  await mPage.goto(`http://127.0.0.1:3000/#/mcqs/test-series/series/${SER_SSC_PAID_ID}`, { waitUntil: 'domcontentloaded' });
  const insideFilter = mPage.getByTestId('series-tests-source-filter');
  await expect(insideFilter).toBeVisible();
  await insideFilter.getByRole('tab', { name: 'PYQ Papers' }).click();
  await expect(mPage.getByRole('heading', { level: 3, name: 'SSC CGL Tier 1 PYQ 2024 Shift 1' })).toBeVisible();
  await expect(mPage.getByRole('heading', { level: 3, name: 'SSC CGL Expert Challenger #2' })).toHaveCount(0);
  await insideFilter.getByRole('tab', { name: 'All Types' }).click();

  // 5. Direct #/exam/:lockedId URL guard -> blocked with 0 question fetches
  mockControls.resetQuestionsFetchCount();
  await mPage.goto(`http://127.0.0.1:3000/#/exam/${TEST_SSC_LOCKED_ID}`, { waitUntil: 'domcontentloaded' });
  await expect(mPage.getByTestId('cbt-paid-lock-screen')).toBeVisible();
  expect(mockControls.getQuestionsFetchCount()).toBe(0);

  // 6. Mobile BPSC Exam -> fixed bottom-0 footer fits inside 390x844 viewport with 0px horizontal overflow
  await mPage.goto(`http://127.0.0.1:3000/#/exam/${TEST_BPSC_ID}`, { waitUntil: 'domcontentloaded' });
  await expect(mPage.getByTestId('cbt-save-next-btn')).toBeVisible();
  const bpscMobileMetrics = await mPage.evaluate(() => {
    const saveBtn = document.querySelector('[data-testid="cbt-save-next-btn"]');
    const footer = saveBtn?.closest('footer');
    const r = footer?.getBoundingClientRect();
    const cs = footer ? getComputedStyle(footer) : null;
    return {
      overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      footerBottom: r?.bottom ?? 0,
      footerHeight: r?.height ?? 0,
      position: cs?.position ?? '',
      innerHeight: window.innerHeight,
    };
  });
  expect(bpscMobileMetrics.overflowPx).toBe(0);
  expect(bpscMobileMetrics.position).toBe('fixed');
  expect(bpscMobileMetrics.footerBottom).toBeLessThanOrEqual(845);
  expect(bpscMobileMetrics.footerHeight).toBeGreaterThanOrEqual(52);

  // 7. SSC CGL TCS iON Classic on Mobile (390x844) -> Step 0 pattern popup -> Step 1 -> Step 2 -> fits cleanly without overflow
  await mPage.goto(`http://127.0.0.1:3000/#/mcqs/test-series/test/${TEST_SSC_DEMO_ID}`, { waitUntil: 'domcontentloaded' });
  await expect(mPage.getByTestId('ssc-cgl-cbt-skin-selector')).toBeVisible();
  await mPage.getByTestId('confirm-cbt-pattern-btn').click();
  await mPage.getByTestId('onboarding-next-btn').click();
  await mPage.getByTestId('onboarding-lang-bilingual').click();
  await mPage.getByTestId('onboarding-declaration-checkbox').check();
  await mPage.getByTestId('test-detail-primary-cta').click();
  await expect(mPage.getByTestId('cbt-skin-tcs-ion')).toBeVisible();
  const tcsMobileMetrics = await mPage.evaluate(() => {
    const saveBtn = document.querySelector('[data-testid="cbt-save-next-btn"]');
    const footer = saveBtn?.closest('footer');
    const r = footer?.getBoundingClientRect();
    return {
      overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      footerBottom: r?.bottom ?? 0,
      footerHeight: r?.height ?? 0,
    };
  });
  expect(tcsMobileMetrics.overflowPx).toBe(0);
  expect(tcsMobileMetrics.footerBottom).toBeLessThanOrEqual(845);
  expect(tcsMobileMetrics.footerHeight).toBeGreaterThanOrEqual(52);

  await mobileCtx.close();

  // --- PART 2: Desktop (1280x800) with Active Purchase Receipt & Eduquity Pattern ---
  const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dPage = await desktopCtx.newPage();
  dPage.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  dPage.on('pageerror', (e) => pageErrors.push(e.message));
  await setupMockBackend(dPage, { withPurchase: true });

  await dPage.goto('http://127.0.0.1:3000/#/purchased', { waitUntil: 'domcontentloaded' });
  const card = dPage.getByTestId('purchase-receipt-card').first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('SSC CGL Tier 1 Pro Batch');
  await expect(card).toContainText('ORD-261125-PRO01');
  await expect(card).toContainText('remaining');
  await card.click();
  await expect(dPage).toHaveURL(new RegExp(`#/mcqs/test-series/series/${SER_SSC_PAID_ID}`));

  // Switch SSC CGL CBT Skin to Eduquity New Pattern & verify on Desktop
  await dPage.goto(`http://127.0.0.1:3000/#/mcqs/test-series/test/${TEST_SSC_DEMO_ID}`, { waitUntil: 'domcontentloaded' });
  await expect(dPage.getByTestId('ssc-cgl-cbt-skin-selector')).toBeVisible();
  await dPage.getByTestId('cbt-skin-option-ssc_cgl_eduquity').click();
  await dPage.getByTestId('confirm-cbt-pattern-btn').click();
  await dPage.getByTestId('onboarding-next-btn').click();
  await dPage.getByTestId('onboarding-lang-bilingual').click();
  await dPage.getByTestId('onboarding-declaration-checkbox').check();
  await dPage.getByTestId('test-detail-primary-cta').click();
  await expect(dPage.getByTestId('cbt-skin-eduquity')).toBeVisible();
  await expect(dPage.getByTestId('eduquity-zoom-in-btn')).toBeVisible();

  await desktopCtx.close();

  expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  expect(consoleErrors, `Console errors: ${consoleErrors.join(' | ')}`).toEqual([]);
});
