# n8n Automation Workflows for SiteFlow

This document describes recommended n8n workflows to automate common tasks in SiteFlow.

## Prerequisites

- [n8n](https://n8n.io) instance (self-hosted or cloud)
- Supabase credentials (Project URL, Service Role Key)
- Twilio credentials (for SMS workflows)
- SMTP credentials (for email workflows)

---

## Workflow 1: Daily Compliance Reminders

**Purpose**: Check for upcoming compliance deadlines and send reminders to site managers

**Trigger**: Schedule (Daily at 8:00 AM)

### Nodes

1. **Schedule Trigger**
   - Cron: `0 8 * * *` (8:00 AM daily)

2. **Supabase Node** - Query compliance logs
   ```sql
   SELECT
     cl.*,
     j.site_name,
     p.full_name,
     p.phone_number,
     p.email
   FROM compliance_logs cl
   JOIN jobs j ON cl.job_id = j.id
   JOIN profiles p ON j.created_by = p.id
   WHERE cl.status IN ('pending', 'flagged')
     AND cl.due_date <= CURRENT_DATE + INTERVAL '7 days'
     AND cl.due_date >= CURRENT_DATE
   ORDER BY cl.due_date ASC
   ```

3. **Split In Batches**
   - Batch Size: 1

4. **IF Node** - Check if due date is within 3 days
   - Condition: `{{ $json.due_date <= new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0] }}`

5. **Twilio SMS** (for urgent reminders)
   - To: `{{ $json.phone_number }}`
   - Message:
     ```
     ⚠️ Urgent: Compliance check "{{ $json.title }}" for {{ $json.site_name }}
     is due in {{ Math.ceil((new Date($json.due_date) - new Date()) / (1000*60*60*24)) }} days.
     Please complete ASAP. - SiteFlow
     ```

6. **Send Email** (for all reminders)
   - To: `{{ $json.email }}`
   - Subject: `Compliance Reminder: {{ $json.title }}`
   - Body:
     ```html
     <h2>Compliance Reminder</h2>
     <p>Hello {{ $json.full_name }},</p>
     <p>The following compliance check requires attention:</p>
     <ul>
       <li><strong>Site:</strong> {{ $json.site_name }}</li>
       <li><strong>Item:</strong> {{ $json.title }}</li>
       <li><strong>Type:</strong> {{ $json.compliance_type }}</li>
       <li><strong>Due Date:</strong> {{ $json.due_date }}</li>
       <li><strong>Status:</strong> {{ $json.status }}</li>
     </ul>
     <p>Please log in to SiteFlow to complete this check.</p>
     ```

### Workflow JSON
Save this workflow and import to n8n:

```json
{
  "name": "SiteFlow - Daily Compliance Reminders",
  "nodes": [...],
  "connections": {...},
  "active": true
}
```

---

## Workflow 2: Overdue Task Alerts

**Purpose**: Notify site managers of overdue tasks every morning

**Trigger**: Schedule (Daily at 9:00 AM)

### Nodes

1. **Schedule Trigger**
   - Cron: `0 9 * * 1-5` (9:00 AM, Monday-Friday)

2. **Supabase Node** - Query overdue tasks
   ```sql
   SELECT
     t.*,
     j.site_name,
     p_assigned.full_name as assigned_to_name,
     p_assigned.phone_number as assigned_phone,
     p_manager.email as manager_email,
     p_manager.full_name as manager_name
   FROM tasks t
   JOIN jobs j ON t.job_id = j.id
   LEFT JOIN profiles p_assigned ON t.assigned_to = p_assigned.id
   JOIN profiles p_manager ON j.created_by = p_manager.id
   WHERE t.status != 'completed'
     AND t.due_date < CURRENT_DATE
   ORDER BY t.due_date ASC
   ```

3. **Function Node** - Group by manager
   ```javascript
   const grouped = {};
   for (const item of items) {
     const email = item.json.manager_email;
     if (!grouped[email]) {
       grouped[email] = {
         manager_name: item.json.manager_name,
         manager_email: email,
         tasks: []
       };
     }
     grouped[email].tasks.push(item.json);
   }
   return Object.values(grouped).map(g => ({ json: g }));
   ```

4. **Send Email**
   - To: `{{ $json.manager_email }}`
   - Subject: `Overdue Tasks Report - {{ new Date().toLocaleDateString() }}`
   - Body:
     ```html
     <h2>Overdue Tasks Report</h2>
     <p>Hello {{ $json.manager_name }},</p>
     <p>You have {{ $json.tasks.length }} overdue tasks:</p>
     <table>
       <tr>
         <th>Site</th>
         <th>Task</th>
         <th>Assigned To</th>
         <th>Due Date</th>
         <th>Days Overdue</th>
       </tr>
       {{#each tasks}}
       <tr>
         <td>{{ site_name }}</td>
         <td>{{ title }}</td>
         <td>{{ assigned_to_name }}</td>
         <td>{{ due_date }}</td>
         <td>{{ Math.ceil((new Date() - new Date(due_date)) / (1000*60*60*24)) }}</td>
       </tr>
       {{/each}}
     </table>
     ```

---

## Workflow 3: Weekly Client Summary

**Purpose**: Generate weekly progress reports for clients

**Trigger**: Schedule (Every Friday at 5:00 PM)

### Nodes

1. **Schedule Trigger**
   - Cron: `0 17 * * 5` (5:00 PM Friday)

2. **Supabase Node** - Get active jobs with clients
   ```sql
   SELECT
     j.*,
     p.email as client_email,
     p.full_name as client_name
   FROM jobs j
   JOIN profiles p ON j.client_id = p.id
   WHERE j.status IN ('planning', 'in_progress')
     AND j.client_id IS NOT NULL
   ```

3. **Split In Batches**

4. **Supabase Node** - Get job progress
   ```sql
   SELECT
     COUNT(*) as total_tasks,
     COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
     COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks
   FROM tasks
   WHERE job_id = '{{ $json.id }}'
   ```

5. **Supabase Node** - Get recent updates
   ```sql
   SELECT *
   FROM job_updates
   WHERE job_id = '{{ $json.id }}'
     AND created_at >= CURRENT_DATE - INTERVAL '7 days'
   ORDER BY created_at DESC
   LIMIT 10
   ```

6. **Send Email**
   - To: `{{ $json.client_email }}`
   - Subject: `Weekly Progress Report: {{ $json.site_name }}`
   - Body: See template below

---

## Workflow 4: Safety Check Reminders

**Purpose**: Prompt site managers to complete daily safety checks

**Trigger**: Schedule (Every workday at 7:00 AM)

### Nodes

1. **Schedule Trigger**
   - Cron: `0 7 * * 1-5`

2. **Supabase Node** - Get active jobs with managers
   ```sql
   SELECT DISTINCT
     j.id as job_id,
     j.site_name,
     p.id as manager_id,
     p.full_name,
     p.phone_number,
     p.email
   FROM jobs j
   JOIN profiles p ON j.created_by = p.id
   WHERE j.status = 'in_progress'
     AND p.role IN ('admin', 'site_manager')
   ```

3. **Supabase Node** - Check if diary entry exists for today
   ```sql
   SELECT id
   FROM site_diary_entries
   WHERE job_id = '{{ $json.job_id }}'
     AND entry_date = CURRENT_DATE
   LIMIT 1
   ```

4. **IF Node** - Only send if no diary entry
   - Condition: `{{ $json.id === undefined }}`

5. **Twilio SMS**
   - To: `{{ $node["Get active jobs"].json.phone_number }}`
   - Message:
     ```
     Good morning! Reminder to complete your site diary entry for
     {{ $node["Get active jobs"].json.site_name }} today. - SiteFlow
     ```

---

## Workflow 5: CSCS Card Expiry Alerts

**Purpose**: Alert workers when their CSCS cards are expiring

**Trigger**: Schedule (Weekly on Monday at 10:00 AM)

### Nodes

1. **Schedule Trigger**
   - Cron: `0 10 * * 1`

2. **Supabase Node** - Find expiring CSCS compliance items
   ```sql
   SELECT
     ci.*,
     cl.due_date,
     cl.job_id,
     j.site_name,
     p.full_name,
     p.phone_number,
     p.email
   FROM compliance_items ci
   JOIN compliance_logs cl ON ci.compliance_log_id = cl.id
   JOIN jobs j ON cl.job_id = j.id
   JOIN profiles p ON ci.worker_id = p.id
   WHERE cl.compliance_type = 'cscs_card'
     AND cl.due_date <= CURRENT_DATE + INTERVAL '30 days'
     AND cl.due_date >= CURRENT_DATE
     AND ci.status != 'completed'
   ```

3. **Twilio SMS**
   - To: `{{ $json.phone_number }}`
   - Message:
     ```
     Hi {{ $json.full_name }}, your CSCS card expires on {{ $json.due_date }}.
     Please arrange renewal to continue working on {{ $json.site_name }}. - SiteFlow
     ```

4. **Send Email**
   - Similar reminder via email with more details

---

## Setup Instructions

### 1. Install n8n

**Self-hosted (Docker):**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=yourpassword \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Cloud:** Sign up at https://n8n.cloud

### 2. Configure Credentials

In n8n, add the following credentials:

1. **Supabase**
   - Host: Your Supabase URL
   - Service Role Key: From Supabase dashboard

2. **Twilio**
   - Account SID
   - Auth Token
   - From Phone Number

3. **SMTP (for emails)**
   - Host: smtp.gmail.com (or your provider)
   - Port: 587
   - User: your@email.com
   - Password: your app password

### 3. Import Workflows

1. Copy workflow JSON from this document
2. In n8n, click "Import from File" or "Import from URL"
3. Paste the workflow
4. Configure credentials for each node
5. Test the workflow
6. Activate the workflow

### 4. Configure Webhooks (Optional)

For real-time triggers, set up webhooks in your Next.js app:

```typescript
// app/api/webhooks/n8n/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  // Send to n8n webhook
  await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return Response.json({ success: true });
}
```

---

## Best Practices

1. **Test workflows** in n8n's manual execution mode before activating
2. **Use error handling** nodes to catch and log failures
3. **Set up monitoring** to track workflow execution
4. **Rate limit SMS** to avoid excessive costs
5. **Respect timezones** when scheduling workflows
6. **Keep logs** of all sent notifications
7. **Allow opt-out** for non-critical notifications

---

## Troubleshooting

### Workflow not triggering
- Check schedule cron syntax
- Verify workflow is activated
- Check n8n logs for errors

### Supabase queries failing
- Verify Service Role Key permissions
- Check SQL syntax in Supabase SQL editor first
- Ensure RLS policies don't block service role

### SMS not sending
- Verify Twilio credentials
- Check phone number format (+44...)
- Ensure Twilio account has sufficient balance
- Check Twilio logs for delivery status

---

## Cost Estimation

### Twilio SMS Costs (UK)
- £0.04 per SMS
- 100 SMS/day = £4/day = £120/month
- Use sparingly for urgent notifications only

### n8n Cloud Pricing
- Starter: $20/month (5 active workflows)
- Pro: $50/month (unlimited workflows)
- Self-hosted: Free (requires server)

### Optimization Tips
1. Group multiple items into one SMS/email
2. Use email for non-urgent notifications
3. Allow users to configure notification preferences
4. Batch process weekly reports instead of daily

---

## Additional Workflow Ideas

- Photo upload notifications for clients
- End-of-day summary for site managers
- Budget tracking alerts
- Weather-based work scheduling
- Equipment maintenance reminders
- Subcontractor invoicing reminders
- Training certification expiry alerts

---

For more n8n resources, visit [n8n.io/docs](https://docs.n8n.io/)
