function citationSummary(hit, index) {
  return {
    index,
    sourceName: hit.sourceName,
    documentTitle: hit.documentTitle,
    chunkId: hit.chunkId,
    score: Number((hit.fusedScore ?? hit.score ?? 0).toFixed(4))
  };
}

function inferNextActions(query) {
  const q = query.toLowerCase();
  const actions = [];
  if (q.includes('inventory') || q.includes('stock') || q.includes('part')) {
    actions.push({ label: 'Open work order parts', target: 'work_order_parts' });
    actions.push({ label: 'Open inventory issue log', target: 'inventory_issue_log' });
  }
  if (q.includes('compressor') || q.includes('noise') || q.includes('noisy')) {
    actions.push({ label: 'Open equipment history', target: 'equipment_history' });
    actions.push({ label: 'Check recent alarms', target: 'asset_alarms' });
  }
  if (q.includes('reindex')) {
    actions.push({ label: 'Open knowledge source list', target: 'kb_sources' });
  }
  return actions.slice(0, 3);
}

export function buildAnswerPackage({ query, hits }) {
  if (!hits.length) {
    return {
      answer: 'I could not find enough approved knowledge to answer this safely. Add or review the relevant SOP, then reindex the source.',
      confidence: 0.18,
      citations: [],
      nextActions: [{ label: 'Open knowledge sources', target: 'kb_sources' }],
      fallbackReason: 'no_evidence'
    };
  }

  const top = hits[0];
  const confidence = Math.min(0.92, 0.45 + hits.length * 0.08 + (top.score ?? 0) * 0.03);
  const citations = hits.slice(0, 3).map((hit, i) => citationSummary(hit, i + 1));
  const q = query.toLowerCase();

  let answer;
  if (q.includes('inventory') || q.includes('stock')) {
    answer = 'Inventory is not deducted just because a work order is approved. The cited rule says stock changes when a part issue is posted, a reservation is fulfilled, or a configured consumption rule marks the part as used. Review the work order parts tab and inventory issue log before adjusting stock manually.';
  } else if (q.includes('compressor') || q.includes('noise') || q.includes('noisy')) {
    answer = 'For abnormal compressor noise, confirm the equipment tag, recent alarms, vibration readings, lubrication notes, and PM history. If noise is paired with high vibration or overheating, stop and escalate. Confirm required parts before scheduling extended downtime.';
  } else if (q.includes('reindex')) {
    answer = 'Reindexing is an admin action from the knowledge source list. It creates a background job that moves through pending, processing, completed, or failed states. Review failed job errors before retrying.';
  } else if (q.includes('lockout') || q.includes('bypass')) {
    answer = 'Do not bypass lockout when guards are removed or hands may enter a pinch point. If the procedure is unclear, stop and ask a supervisor before continuing.';
  } else {
    answer = `The strongest retrieved source is "${top.documentTitle}". Review the cited evidence before acting, especially if this affects safety, inventory, or work execution.`;
  }

  return {
    answer,
    confidence: Number(confidence.toFixed(2)),
    citations,
    nextActions: inferNextActions(query),
    fallbackReason: confidence < 0.45 ? 'weak_evidence' : null
  };
}
