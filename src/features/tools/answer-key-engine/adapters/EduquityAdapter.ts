import { CandidateCategory, CandidateDetails, ExamConfig, ExamParserAdapter, ParsedExamResult, ParsedQuestion, SectionMetric } from '../types';
import { inferStateFromVenue } from '../utils/format';

/**
 * Eduquity CBT Response Sheet Adapter (SSC 2026+ Vendor)
 * Parses high-resolution image questions, ASP.NET postback response sheets,
 * and watermark-encoded candidate identifiers.
 */
export class EduquityAdapter implements ExamParserAdapter {
  readonly id = 'eduquity';
  readonly name = 'Eduquity CBT Response Sheet Adapter';
  readonly version = '1.0.0';

  canParse(html: string, url?: string): boolean {
    if (url && url.includes('cbexams.com')) {
      return true;
    }
    return (
      html.includes('edu_style.css') ||
      html.includes('ViewCandResponse.aspx') ||
      html.includes('watermark-text') ||
      (html.includes('bgcolor="green"') && html.includes('qimg/')) ||
      (html.includes("bgcolor='green'") && html.includes('qimg/')) ||
      html.includes('Click Here to Challenge Question No')
    );
  }

  parse(
    html: string,
    config: ExamConfig,
    selectedCategory: CandidateCategory = 'UR',
    userMeta?: { gender?: string; state?: string }
  ): ParsedExamResult {
    const candidateDetails: CandidateDetails = this.extractDetails(html);
    candidateDetails.category = selectedCategory;
    candidateDetails.gender = userMeta?.gender || 'Male';
    candidateDetails.state = userMeta?.state || inferStateFromVenue(candidateDetails.venueName) || 'Bihar';
    candidateDetails.examName = config.examName || 'Combined Graduate Level Examination, 2026';
    candidateDetails.examTime = '10:00 AM (Shift-1)';
    const questions = this.extractQuestions(html, config);

    // Initialize Section Metrics
    const sectionDetails: Record<string, SectionMetric> = {};
    for (const sec of config.sections) {
      sectionDetails[sec.id] = {
        id: sec.id,
        name: sec.name,
        score: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
        accuracy: 0,
      };
    }

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnattempted = 0;
    let rawScore = 0;

    for (const q of questions) {
      const sec = sectionDetails[q.sectionId] || {
        id: q.sectionId,
        name: q.sectionId,
        score: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
        accuracy: 0,
      };

      if (q.status === 'unattempted') {
        sec.unattempted += 1;
        totalUnattempted += 1;
      } else if (q.isCorrect) {
        sec.correct += 1;
        sec.score += config.positiveMarks;
        totalCorrect += 1;
        rawScore += config.positiveMarks;
      } else {
        sec.wrong += 1;
        sec.score -= config.negativeMarks;
        totalWrong += 1;
        rawScore -= config.negativeMarks;
      }

      sectionDetails[q.sectionId] = sec;
    }

    // Compute Section Accuracies
    for (const key of Object.keys(sectionDetails)) {
      const s = sectionDetails[key];
      const attempted = s.correct + s.wrong;
      s.accuracy = attempted > 0 ? Number(((s.correct / attempted) * 100).toFixed(1)) : 0;
      s.score = Number(s.score.toFixed(2));
    }

    const totalAttempted = totalCorrect + totalWrong;
    const overallAccuracy = totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;

    return {
      candidateDetails,
      category: selectedCategory,
      metrics: {
        rawScore: Number(rawScore.toFixed(2)),
        scoreReasoning: sectionDetails['reasoning']?.score ?? 0,
        scoreGk: sectionDetails['gk']?.score ?? 0,
        scoreMath: sectionDetails['math']?.score ?? 0,
        scoreEnglish: sectionDetails['english']?.score ?? 0,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        overallAccuracy,
      },
      sectionDetails,
      questionResponses: questions,
      adapterVersion: this.version,
      parseStatus: questions.length > 0 ? 'SUCCESS' : 'FAILED',
    };
  }

  private extractDetails(html: string) {
    // Watermark holds the unique Roll / Registration Number in Eduquity sheets
    const watermarkMatch = html.match(/class=['"]?watermark-text['"]?[^>]*>([0-9]+)<\/div>/i);
    const rollNumber = watermarkMatch ? watermarkMatch[1].trim() : '326' + Math.floor(100000000 + Math.random() * 900000000);

    // Exam Date from URL / path / header if present
    let examDate = new Date().toISOString().split('T')[0];
    const dateMatch = html.match(/Test\s*Date\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i) ||
                      html.match(/Oct\s*([0-9]{1,2})/i);
    if (dateMatch) {
      if (dateMatch[1].includes('-') || dateMatch[1].includes('/')) {
        examDate = dateMatch[1].replace(/\//g, '-').trim();
      } else {
        examDate = `2026-10-${dateMatch[1].padStart(2, '0')}`;
      }
    }

    return {
      rollNumber,
      candidateName: 'Eduquity Candidate',
      examDate,
      shiftName: 'Shift 1',
      shiftCode: `${examDate.replace(/\//g, '-')}_S1`,
      venueName: 'Eduquity CBT Center',
    };
  }

  private extractQuestions(html: string, config: ExamConfig): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const qMatches = html.match(/<table width=["']100%["'][^>]*margin-bottom:\s*15px[\s\S]*?<\/table>/gi) || [];

    if (qMatches.length > 0) {
      for (let i = 0; i < qMatches.length; i++) {
        const block = qMatches[i];
        const qNoMatch = block.match(/Q\.No:\s*(?:&nbsp;)?([0-9]+)/i);
        const qIndex = qNoMatch ? parseInt(qNoMatch[1], 10) : (i + 1);

        const itemCodeMatch = block.match(/itemcode=([^&"']+)/i);
        const qId = itemCodeMatch ? decodeURIComponent(itemCodeMatch[1]) : `EDQ_${qIndex}`;

        let chosenOption: string | null = null;
        let correctOption: string | null = null;
        let isCorrect = false;

        const rows = block.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        let optIdx = 0;
        for (const row of rows) {
          if (/Q\.No:/i.test(row) || /switch-btn/i.test(row) || /Challenge/i.test(row)) {
            continue;
          }

          if (row.includes('qimg/')) {
            optIdx++;
            if (/bgcolor=['"]?green['"]?/i.test(row) || /background-color:\s*green/i.test(row)) {
              chosenOption = String(optIdx);
              correctOption = String(optIdx);
              isCorrect = true;
            } else if (/bgcolor=['"]?red['"]?/i.test(row) || /background-color:\s*red/i.test(row)) {
              chosenOption = String(optIdx);
            } else if (/bgcolor=['"]?yellow['"]?/i.test(row) || /background-color:\s*yellow/i.test(row)) {
              correctOption = String(optIdx);
            }
          }
        }

        const isUnattempted = /bgcolor=['"]?gray['"]?/i.test(block) ||
                              /background-color:\s*gray/i.test(block) ||
                              /Not Answered/i.test(block);

        let status: 'answered' | 'unattempted' = 'answered';
        if (isUnattempted || (!chosenOption && !isCorrect)) {
          status = 'unattempted';
          chosenOption = null;
          isCorrect = false;
        }

        const secId = this.resolveSectionId(qIndex, config);

        questions.push({
          questionId: qId,
          questionIndex: qIndex,
          sectionId: secId,
          chosenOptionId: chosenOption,
          correctOptionId: correctOption || (isCorrect ? chosenOption : '1'),
          isCorrect,
          status,
          marks: status === 'unattempted' ? 0 : (isCorrect ? config.positiveMarks : -config.negativeMarks),
        });

        if (qIndex >= config.totalQuestions) break;
      }
    }

    return questions;
  }

  private resolveSectionId(qIndex: number, config: ExamConfig): string {
    let accumulated = 0;
    for (const sec of config.sections) {
      accumulated += sec.qCount;
      if (qIndex <= accumulated) {
        return sec.id;
      }
    }
    return config.sections[config.sections.length - 1]?.id || 'reasoning';
  }
}
