# Deal Check

**Is this brand deal fair?** Creators paste a brand's DM, email or contract
(or upload a PDF) and, in about a minute, get:

- a verdict (take it, negotiate or walk away) and a score out of 100
- scam warning signs
- red flags quoted from the deal, each with what to ask for instead
- terms the deal is missing
- a fair fee range for their numbers, in their currency
- a reply they can copy and send

It works for any platform, any country and 24 currencies.

Every check saves the result (never the deal text). Those results feed a rate
benchmark: once at least five creators of a similar size on the same platform
have checked deals in the same currency, Deal Check shows Claude what they were
actually offered. The more people use it, the better the rates get.

## How it's built

| Part | What |
| --- | --- |
| Frontend | React + Vite, deployed as a static site (Netlify config included) |
| Database and sign-in | Supabase (Postgres, email magic links) |
| AI | Claude (`claude-opus-5-5`) via a Supabase Edge Function, with structured JSON output |

```
src/
  pages/Home.jsx          landing page with the checker built in
  pages/Login.jsx         email magic-link sign-in
  pages/History.jsx       a signed-in user's saved checks
  components/DealForm.jsx the checker form
  components/DealResult.jsx the report
supabase/
  migrations/             tables, security rules, benchmark function
  functions/deal-check/   the AI check (Claude)
```

## Plans and limits

| Who | Checks |
| --- | --- |
| Visitor, no account | 1 every 30 days (tracked by a salted hash of their IP, never the IP itself) |
| Free account | 3 every 30 days |
| Pro | Unlimited |

Change the numbers with the `DEAL_CHECK_GUEST_LIMIT` and `DEAL_CHECK_FREE_LIMIT`
secrets.

## Set up

You need a [Supabase](https://supabase.com) project and an
[Anthropic API key](https://platform.claude.com).

### 1. Database

In the Supabase dashboard, open SQL Editor, paste
`supabase/migrations/20261111000000_init.sql` and run it. Or, with the CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 2. The AI function

```bash
supabase secrets set ANTHROPIC_API_KEY=<your Anthropic API key>
supabase secrets set DEAL_CHECK_IP_SALT=<any long random string>
supabase functions deploy deal-check
```

`DEAL_CHECK_IP_SALT` is required for checks without an account. To use a
different model, also set `DEAL_CHECK_MODEL`.

### 3. Sign-in links

In Supabase, go to Authentication → URL Configuration. Set **Site URL** to
your live site (for example `https://dealcheck.netlify.app`) and add
`http://localhost:5173/**` to **Redirect URLs** for local testing.

### 4. The website

```bash
cp .env.example .env    # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

To deploy on Netlify, connect this repo and add the same `VITE_` variables
under Site settings → Environment variables. `netlify.toml` already has the
build command and the single-page-app redirect.

## Taking payments

Set `VITE_PRO_CHECKOUT_URL` to a payment link (for example a Stripe Payment
Link) and the Pro buttons will point to it. Until payments are wired to the
database automatically, move a paying customer to Pro by hand in SQL Editor:

```sql
update public.profiles
set plan = 'pro'
where id = (select id from auth.users where email = 'customer@example.com');
```

## Privacy

- The deal text and PDFs are sent to Claude to make the report and are never
  stored.
- Rows in `deal_checks` are written only by the Edge Function, so nobody can
  fake data or reset their free checks. Signed-in users can read only their
  own checks.
- The benchmark only ever returns totals across at least five deals.
