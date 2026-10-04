LIVE CRICKET SETUP
==================

Files
-----
1. admin.html
   Existing Playbook admin UI. The two API-key fields already call lc_admin_set.

2. live_cricket.sql
   Run in Supabase SQL Editor. It creates the live-cricket config, matches, markets,
   bets read model, RLS, and the RPCs used by admin.html.

3. supabase/functions/live-cricket-sync/index.ts
   Server-side sync worker. It reads the saved API keys from lc_config and calls:
   - The Odds API v4 for cricket odds
   - CricketData.org currentMatches for live scores
   API keys are not placed in admin.html or play.html.

SETUP ORDER
-----------
A) Supabase SQL Editor
   Paste and run live_cricket.sql.

B) Deploy Edge Function
   Put index.ts at:
     supabase/functions/live-cricket-sync/index.ts
   Then deploy:
     supabase functions deploy live-cricket-sync

C) Configure the server secret
   The function needs a Supabase server secret/service key. Use the current
   Supabase Secret Key if your project has migrated to the new key system, or
   SUPABASE_SERVICE_ROLE_KEY on an older project.
   Never put this secret in GitHub or browser code.

D) Admin panel
   Login to admin.html -> Live cricket.
   Paste The Odds API key and CricketData.org key.
   Tap Save live cricket settings.
   The UI will show "key saved" instead of "no key".

E) First sync
   Invoke the Edge Function once with POST/GET from a server/admin tool.
   Example endpoint:
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/live-cricket-sync

F) Automatic sync
   Use Supabase Cron to call the Edge Function. One-minute polling is a good
   starting point. Your API provider's own refresh/quota limits still apply.

LEAGUES
-------
Leave "Leagues to follow" blank to discover all currently active cricket sport
keys. Or use a comma-separated list such as:
  cricket_ipl,cricket_odi,cricket_international_t20

SECURITY
--------
Do not put either provider API key in GitHub, play.html, JavaScript bundles,
URLs visible to players, or browser localStorage. The browser only receives
has_odds_key / has_score_key and public match data.

IMPORTANT
---------
This integration is for live cricket information and a play-money/virtual-
points UI. It is not a real-money wagering/payment system.
