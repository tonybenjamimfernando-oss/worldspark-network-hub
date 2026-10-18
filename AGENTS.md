<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## GCNM architecture
- Data access uses the browser Cloud client with RLS; signed-in pages live under src/routes/_authenticated (client-only gate). Why: keeps permissions enforced in the database.
- Media bucket is private; images are shown through signed URLs (useSignedUrls), external https image URLs pass through. Why: workspace blocks public buckets.
- External offers are listings with is_external + source_url (unique) and outbound clicks tracked via a security-definer RPC. Why: attribution without exposing private stats.
- Counters (views, clicks, affiliate clicks) change only through security-definer functions, never direct updates. Why: prevents tampering.
