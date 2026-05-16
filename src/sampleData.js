export const sampleDocuments = [
  {
    id: 'doc_compressor_noise',
    tenantId: 'tenant_demo',
    sourceName: 'Maintenance SOPs',
    title: 'Compressor Abnormal Noise Triage SOP',
    roles: ['technician', 'planner', 'supervisor'],
    text: `When a compressor is reported as noisy, confirm the equipment tag and review recent alarms, vibration readings, lubrication notes, and PM history. If abnormal noise is paired with high vibration or overheating, stop work and escalate to the supervisor. Before scheduling extended downtime, confirm bearing kit and filter availability. Do not bypass lockout or guarding requirements.`
  },
  {
    id: 'doc_inventory_issue',
    tenantId: 'tenant_demo',
    sourceName: 'Inventory Rules',
    title: 'Inventory Issue and Approval Rules',
    roles: ['planner', 'inventory', 'admin'],
    text: `Approving a work order does not automatically deduct stock. Inventory changes when a part issue is posted, a reservation is fulfilled, or a configured consumption rule marks the part as used. Review the work order parts tab and the inventory issue log before making manual stock adjustments.`
  },
  {
    id: 'doc_waiting_parts',
    tenantId: 'tenant_demo',
    sourceName: 'Work Order Help',
    title: 'Waiting Parts Status Guide',
    roles: ['technician', 'planner', 'supervisor'],
    text: `Use waiting parts status when work cannot continue because required parts are unavailable or not issued. Add the missing part, expected date, and supplier note when known. Do not close the work order until the work has been completed and reviewed.`
  },
  {
    id: 'doc_reindex_help',
    tenantId: 'tenant_demo',
    sourceName: 'Knowledge Base Admin Help',
    title: 'How to Reindex a Knowledge Source',
    roles: ['admin'],
    text: `Admins can reindex a knowledge source from the source list. Reindexing creates a background job that moves from pending to processing and then completed or failed. If a job fails, review the error message and retry after fixing the source content.`
  },
  {
    id: 'doc_lockout',
    tenantId: 'tenant_demo',
    sourceName: 'Safety Procedures',
    title: 'Belt Conveyor Lockout Guide',
    roles: ['technician', 'supervisor'],
    text: `Lockout is required before belt conveyor inspection when guards are removed or hands may enter a pinch point. Never bypass lockout for a quick inspection. If the procedure is unclear, stop and ask a supervisor before continuing.`
  },
  {
    id: 'doc_other_tenant',
    tenantId: 'tenant_other',
    sourceName: 'Other Tenant SOPs',
    title: 'Other Tenant Private Procedure',
    roles: ['admin'],
    text: `This document belongs to a different tenant and must never appear in tenant_demo retrieval results.`
  }
];
