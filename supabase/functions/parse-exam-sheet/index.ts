import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Domain Allowlist & SSRF Safeguards
function isSafeUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname.toLowerCase();

    // Block private/internal networks (SSRF prevention)
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      /^127\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^169\.254\./.test(hostname) // AWS/Cloud metadata
    ) {
      return false;
    }

    // Allowlist: only official TCS iON / SSC domains
    return hostname.endsWith('digialm.com') || hostname.endsWith('ssc.nic.in');
  } catch {
    return false;
  }
}

async function sha256(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { url, examId = 'ssc_cgl_tier1', category = 'UR' } = body;

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isSafeUrl(url)) {
      return new Response(
        JSON.stringify({ error: 'URL domain is not allowed or is potentially unsafe. Only official digialm.com links are supported.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urlHash = await sha256(url);

    // Fetch response sheet with strict timeout and no redirect follow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    let html = '';
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'error',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TCS server returned HTTP status ${response.status}`);
      }

      html = await response.text();
    } finally {
      clearTimeout(timeoutId);
    }

    if (!html || html.length < 500) {
      return new Response(
        JSON.stringify({ error: 'Empty or invalid response received from source server.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic Regex Parsing
    const rollMatch = html.match(/Roll\s*Number\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i) ||
                      html.match(/Roll\s*No\.?\s*[:\-]?\s*([0-9]{8,12})/i);
    const nameMatch = html.match(/Candidate\s*Name\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
    const venueMatch = html.match(/(?:Venue|Test\s*Center)\s*Name\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
    const dateMatch = html.match(/Test\s*Date\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
    const timeMatch = html.match(/Test\s*Time\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);

    const rollNumber = rollMatch ? rollMatch[1].trim() : '220' + Math.floor(1000000 + Math.random() * 9000000);
    const candidateName = nameMatch ? nameMatch[1].trim() : 'Candidate';
    const venueName = venueMatch ? venueMatch[1].trim() : 'Exam Center';
    const examDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];
    const shiftName = timeMatch ? timeMatch[1].trim() : 'Shift 1';

    const datePart = examDate.replace(/\//g, '-').trim();
    let shiftNum = 'S1';
    if (shiftName.includes('12:') || shiftName.includes('1:')) shiftNum = 'S2';
    else if (shiftName.includes('2:') || shiftName.includes('3:')) shiftNum = 'S3';
    else if (shiftName.includes('4:') || shiftName.includes('5:')) shiftNum = 'S4';
    const shiftCode = `${datePart}_${shiftNum}`;

    // Extract questions
    const questionBlocks = html.split(/<table[^>]*class=["']menu-tbl["']/i);
    const questions: any[] = [];
    const sectionDetails: Record<string, any> = {
      reasoning: { id: 'reasoning', name: 'General Intelligence & Reasoning', score: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 },
      gk: { id: 'gk', name: 'General Awareness', score: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 },
      math: { id: 'math', name: 'Quantitative Aptitude', score: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 },
      english: { id: 'english', name: 'English Comprehension', score: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 },
    };

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnattempted = 0;
    let rawScore = 0;

    for (let i = 1; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      const qIndex = i;

      const qIdMatch = block.match(/Question\s*ID\s*:\s*([0-9]+)/i);
      const qId = qIdMatch ? qIdMatch[1] : `Q_${qIndex}`;

      const chosenMatch = block.match(/Chosen\s*Option\s*:\s*([1-4]|--)/i);
      const chosenOpt = chosenMatch && chosenMatch[1] !== '--' ? chosenMatch[1] : null;

      const statusMatch = block.match(/Status\s*:\s*([^<]+)/i);
      const isAnswered = statusMatch && !statusMatch[1].toLowerCase().includes('not') && chosenOpt !== null;

      let correctOpt = '1';
      const rightAnsMatch = block.match(/class=["'][^"']*rightAns[^"']*["']/i);
      if (rightAnsMatch) {
        const optPos = block.substring(0, block.indexOf(rightAnsMatch[0])).match(/<tr/gi);
        if (optPos && optPos.length > 0) correctOpt = String(Math.min(optPos.length, 4));
      }

      const secId = qIndex <= 25 ? 'reasoning' : qIndex <= 50 ? 'gk' : qIndex <= 75 ? 'math' : 'english';
      const isCorrect = isAnswered && chosenOpt === correctOpt;
      const status = isAnswered ? 'answered' : 'unattempted';

      const sec = sectionDetails[secId];
      if (status === 'unattempted') {
        sec.unattempted++;
        totalUnattempted++;
      } else if (isCorrect) {
        sec.correct++;
        sec.score += 2.0;
        totalCorrect++;
        rawScore += 2.0;
      } else {
        sec.wrong++;
        sec.score -= 0.5;
        totalWrong++;
        rawScore -= 0.5;
      }

      questions.push({
        questionId: qId,
        questionIndex: qIndex,
        sectionId: secId,
        chosenOptionId: chosenOpt,
        correctOptionId: correctOpt,
        isCorrect,
        status,
        marks: status === 'unattempted' ? 0 : (isCorrect ? 2.0 : -0.5),
      });

      if (qIndex >= 100) break;
    }

    for (const key of Object.keys(sectionDetails)) {
      const s = sectionDetails[key];
      const att = s.correct + s.wrong;
      s.accuracy = att > 0 ? Number(((s.correct / att) * 100).toFixed(1)) : 0;
      s.score = Number(s.score.toFixed(2));
    }

    const totalAttempted = totalCorrect + totalWrong;
    const overallAccuracy = totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;

    const parsedResult = {
      candidateDetails: {
        rollNumber,
        candidateName,
        examDate,
        shiftName,
        shiftCode,
        venueName,
      },
      category,
      metrics: {
        rawScore: Number(rawScore.toFixed(2)),
        scoreReasoning: sectionDetails['reasoning'].score,
        scoreGk: sectionDetails['gk'].score,
        scoreMath: sectionDetails['math'].score,
        scoreEnglish: sectionDetails['english'].score,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        overallAccuracy,
      },
      sectionDetails,
      questionResponses: questions,
      adapterVersion: '1.0.0',
      parseStatus: questions.length > 0 ? 'SUCCESS' : 'FAILED',
    };

    // Save to Database using Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let submissionId: string | null = null;

    try {
      const { data: dbData, error: dbError } = await supabaseAdmin
        .from('exam_submissions')
        .upsert({
          exam_id: examId,
          user_id: user.id,
          roll_number: rollNumber,
          candidate_name: candidateName,
          exam_date: examDate,
          shift_name: shiftName,
          shift_code: shiftCode,
          venue_name: venueName,
          category,
          raw_score: parsedResult.metrics.rawScore,
          score_reasoning: parsedResult.metrics.scoreReasoning,
          score_gk: parsedResult.metrics.scoreGk,
          score_math: parsedResult.metrics.scoreMath,
          score_english: parsedResult.metrics.scoreEnglish,
          total_correct: totalCorrect,
          total_wrong: totalWrong,
          total_unattempted: totalUnattempted,
          section_details: sectionDetails,
          question_responses: questions,
          url_hash: urlHash,
          parse_status: parsedResult.parseStatus,
        }, { onConflict: 'exam_id,roll_number' })
        .select('id')
        .single();

      if (!dbError && dbData) {
        submissionId = dbData.id;
      }
    } catch (saveErr) {
      console.warn('Database save warning (table may not be deployed yet):', saveErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        result: parsedResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error in answer key engine' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
