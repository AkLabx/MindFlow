import { CandidateCategory, ExamConfig, ExamParserAdapter, ParsedExamResult, ParsedQuestion, SectionMetric } from '../types';



/**
 * Robust TCS iON Answer Key Parser Adapter
 * Compatible with Browser DOMParser and Regex fallback for multi-tier SSC/Railways exams.
 */
export class TcsIonAdapter implements ExamParserAdapter {
  readonly id = 'tcs_ion';
  readonly name = 'TCS iON Response Sheet Adapter';
  readonly version = '1.0.0';

  canParse(html: string, url?: string): boolean {
    if (url && (url.includes('digialm.com') || url.includes('ssc.nic.in'))) {
      return true;
    }
    return (
      html.includes('menu-tbl') ||
      html.includes('question-pnl') ||
      html.includes('rightAns') ||
      html.includes('Chosen Option') ||
      html.includes('Candidate Roll No') ||
      html.includes('Test Center Name')
    );
  }

  parse(html: string, config: ExamConfig, selectedCategory: CandidateCategory = 'UR'): ParsedExamResult {
    const isBrowser = typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined';
    let candidateDetails = {
      rollNumber: 'Unknown',
      candidateName: 'Candidate',
      examDate: new Date().toISOString().split('T')[0],
      shiftName: 'Shift 1',
      shiftCode: 'DEFAULT_S1',
      venueName: 'Exam Center',
    };

    let questions: ParsedQuestion[] = [];

    if (isBrowser) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        candidateDetails = this.extractDetailsFromDOM(doc);
        questions = this.extractQuestionsFromDOM(doc, config);
      } catch (err) {
        console.warn('DOM parsing failed, falling back to regex parser:', err);
        candidateDetails = this.extractDetailsViaRegex(html);
        questions = this.extractQuestionsViaRegex(html, config);
      }
    } else {
      candidateDetails = this.extractDetailsViaRegex(html);
      questions = this.extractQuestionsViaRegex(html, config);
    }

    // Calculate Section-wise Metrics
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

    // Calculate accuracies
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

  private extractDetailsFromDOM(doc: Document) {
    const textOf = (selector: string): string => {
      const el = doc.querySelector(selector);
      return el ? el.textContent?.trim() || '' : '';
    };

    // Scan all table cells for keys
    const details = {
      rollNumber: '',
      candidateName: '',
      examDate: '',
      shiftName: '',
      shiftCode: '',
      venueName: '',
    };

    const tds = Array.from(doc.querySelectorAll('td'));
    for (let i = 0; i < tds.length; i++) {
      const txt = tds[i].textContent?.trim() || '';
      const nextTxt = tds[i + 1]?.textContent?.trim() || '';

      if (txt.includes('Roll Number') || txt.includes('Roll No')) {
        details.rollNumber = nextTxt;
      } else if (txt.includes('Candidate Name')) {
        details.candidateName = nextTxt;
      } else if (txt.includes('Venue Name') || txt.includes('Test Center Name')) {
        details.venueName = nextTxt;
      } else if (txt.includes('Test Date')) {
        details.examDate = nextTxt;
      } else if (txt.includes('Test Time')) {
        details.shiftName = nextTxt;
      }
    }

    // Clean and normalize shift code
    const datePart = details.examDate.replace(/\//g, '-').trim() || new Date().toISOString().split('T')[0];
    let shiftNum = 'S1';
    if (details.shiftName.includes('12:') || details.shiftName.includes('01:') || details.shiftName.includes('1:')) {
      shiftNum = 'S2';
    } else if (details.shiftName.includes('02:') || details.shiftName.includes('2:') || details.shiftName.includes('03:') || details.shiftName.includes('3:')) {
      shiftNum = 'S3';
    } else if (details.shiftName.includes('04:') || details.shiftName.includes('4:') || details.shiftName.includes('05:') || details.shiftName.includes('5:')) {
      shiftNum = 'S4';
    }
    details.shiftCode = `${datePart}_${shiftNum}`;

    if (!details.rollNumber) details.rollNumber = '220' + Math.floor(1000000 + Math.random() * 9000000);
    if (!details.candidateName) details.candidateName = 'Aspirant';

    return details;
  }

  private extractQuestionsFromDOM(doc: Document, config: ExamConfig): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const questionPanels = Array.from(doc.querySelectorAll('.question-pnl, .grp-cntnr, table.menu-tbl'));

    // If .question-pnl panels found
    const panels = doc.querySelectorAll('.question-pnl').length > 0 
      ? Array.from(doc.querySelectorAll('.question-pnl'))
      : Array.from(doc.querySelectorAll('table.menu-tbl')).map(t => t.closest('div') || t);

    // Filter unique valid panels
    const validPanels = panels.length > 0 ? panels : Array.from(doc.querySelectorAll('table.menu-tbl'));

    let qIndex = 1;
    for (const panel of validPanels) {
      const panelText = panel.textContent || '';
      
      // Determine Question ID
      let qId = `Q_${qIndex}`;
      const qIdMatch = panelText.match(/Question\s*ID\s*:\s*(\d+)/i);
      if (qIdMatch && qIdMatch[1]) {
        qId = qIdMatch[1];
      }

      // Determine Chosen Option
      let chosenOpt: string | null = null;
      const statusMatch = panelText.match(/Status\s*:\s*([^\n\r]+)/i);
      const isAnswered = statusMatch && !statusMatch[1].toLowerCase().includes('not');

      const chosenMatch = panelText.match(/Chosen\s*Option\s*:\s*(\d+|--)/i);
      if (chosenMatch && chosenMatch[1] && chosenMatch[1] !== '--') {
        chosenOpt = chosenMatch[1];
      }

      // Determine Correct Option: Check for class="rightAns" on td or tick image
      let correctOpt = '1';
      const rightAnsCell = panel.querySelector('td.rightAns');
      if (rightAnsCell) {
        // Find which option index it corresponds to (1, 2, 3, or 4)
        const parentTable = rightAnsCell.closest('table');
        if (parentTable) {
          const rows = Array.from(parentTable.querySelectorAll('tr, td.bold'));
          const optIdx = rows.findIndex(r => r.contains(rightAnsCell) || r === rightAnsCell);
          if (optIdx > 0) correctOpt = String(optIdx);
        }
      } else {
        // Fallback: check if option table has rightAns text or image
        const imgTick = panel.querySelector('img[src*="tick"], img[src*="right"], img[src*="correct"]');
        if (imgTick) {
          const row = imgTick.closest('tr');
          if (row && row.parentElement) {
            const rowIdx = Array.from(row.parentElement.children).indexOf(row);
            if (rowIdx >= 0) correctOpt = String(rowIdx + 1);
          }
        }
      }

      // Determine section based on question index (1-25 Reasoning, 26-50 GK, 51-75 Math, 76-100 English)
      const secId = this.resolveSectionId(qIndex, config);

      const isCorrect = isAnswered && chosenOpt !== null && String(chosenOpt) === String(correctOpt);
      const status: 'answered' | 'unattempted' = chosenOpt !== null && isAnswered ? 'answered' : 'unattempted';

      questions.push({
        questionId: qId,
        questionIndex: qIndex,
        sectionId: secId,
        chosenOptionId: chosenOpt,
        correctOptionId: correctOpt,
        isCorrect: isCorrect || false,
        status,
        marks: status === 'unattempted' ? 0 : (isCorrect ? config.positiveMarks : -config.negativeMarks),
      });

      qIndex++;
      if (qIndex > config.totalQuestions) break;
    }

    return questions;
  }

  private extractDetailsViaRegex(html: string) {
    const rollMatch = html.match(/Roll\s*Number\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i) ||
                      html.match(/Roll\s*No\.?\s*[:\-]?\s*([0-9]{8,12})/i);
    const nameMatch = html.match(/Candidate\s*Name\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
    const venueMatch = html.match(/(?:Venue|Test\s*Center)\s*Name\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
    const dateMatch = html.match(/Test\s*Date\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
    const timeMatch = html.match(/Test\s*Time\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);

    const rollNumber = rollMatch ? rollMatch[1].trim() : '220' + Math.floor(1000000 + Math.random() * 9000000);
    const candidateName = nameMatch ? nameMatch[1].trim() : 'Aspirant';
    const venueName = venueMatch ? venueMatch[1].trim() : 'Exam Center';
    const examDate = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];
    const shiftName = timeMatch ? timeMatch[1].trim() : 'Shift 1';

    const datePart = examDate.replace(/\//g, '-').trim();
    let shiftNum = 'S1';
    if (shiftName.includes('12:') || shiftName.includes('1:')) shiftNum = 'S2';
    else if (shiftName.includes('2:') || shiftName.includes('3:')) shiftNum = 'S3';
    else if (shiftName.includes('4:') || shiftName.includes('5:')) shiftNum = 'S4';

    return {
      rollNumber,
      candidateName,
      examDate,
      shiftName,
      shiftCode: `${datePart}_${shiftNum}`,
      venueName,
    };
  }

  private extractQuestionsViaRegex(html: string, config: ExamConfig): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const questionBlocks = html.split(/<table[^>]*class=["']menu-tbl["']/i);

    // Skip the first split since it precedes the first question
    for (let i = 1; i < questionBlocks.length; i++) {
      const block = questionBlocks[i];
      const qIndex = i;

      const qIdMatch = block.match(/Question\s*ID\s*:\s*([0-9]+)/i);
      const qId = qIdMatch ? qIdMatch[1] : `Q_${qIndex}`;

      const chosenMatch = block.match(/Chosen\s*Option\s*:\s*([1-4]|--)/i);
      const chosenOpt = chosenMatch && chosenMatch[1] !== '--' ? chosenMatch[1] : null;

      const statusMatch = block.match(/Status\s*:\s*([^<]+)/i);
      const isAnswered = statusMatch && !statusMatch[1].toLowerCase().includes('not') && chosenOpt !== null;

      // Detect rightAns class
      let correctOpt = '1';
      const rightAnsMatch = block.match(/class=["'][^"']*rightAns[^"']*["']/i);
      if (rightAnsMatch) {
        // Approximate option position by looking ahead
        const optPositionMatch = block.substring(0, block.indexOf(rightAnsMatch[0])).match(/<tr/gi);
        if (optPositionMatch && optPositionMatch.length > 0) {
          correctOpt = String(Math.min(optPositionMatch.length, 4));
        }
      }

      const secId = this.resolveSectionId(qIndex, config);
      const isCorrect = isAnswered && chosenOpt === correctOpt;
      const status: 'answered' | 'unattempted' = isAnswered ? 'answered' : 'unattempted';

      questions.push({
        questionId: qId,
        questionIndex: qIndex,
        sectionId: secId,
        chosenOptionId: chosenOpt,
        correctOptionId: correctOpt,
        isCorrect: isCorrect || false,
        status,
        marks: status === 'unattempted' ? 0 : (isCorrect ? config.positiveMarks : -config.negativeMarks),
      });

      if (qIndex >= config.totalQuestions) break;
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

export { EduquityAdapter } from './EduquityAdapter';
