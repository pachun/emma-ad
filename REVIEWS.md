# App Store reviews

The homepage includes three selected testimonials sourced from App Store Connect across territories. It does not calculate an overall rating from written reviews: star-only ratings are absent from this endpoint.

`node scripts/refresh-reviews.mjs` fetches all pages from Apple's authenticated customerReviews endpoint and replaces only the `app-store-reviews` section in `index.html`. Credentials remain outside the public site. Review text is HTML-escaped, storefronts are linked, review dates preserve the calendar date returned by Apple, and only public review fields are rendered. Deleted or edited reviews are reconciled on each successful refresh. A failed fetch leaves the previously published HTML intact.

The three featured review IDs are explicitly selected in the refresh script. They are shown only while Apple returns them with a rating of at least four stars. The section does not claim to show every review. Country names use the bundled ISO 3166 alpha-3 to alpha-2 mapping and Node's Intl.DisplayNames.

## Daily refresh setup

The GitHub Actions workflow runs daily at 10:23 UTC and can be run manually. Before enabling it, configure these repository Actions secrets with a key authorized to read this app's reviews:

- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_PRIVATE_KEY_PEM` — the complete PEM private key, including actual newlines

Once committed to the default branch, the workflow refreshes `index.html` and commits updates to `main`. The repository's production hosting must deploy those commits. Verify the hosting integration processes workflow-created commits; the default GitHub token's pushes do not trigger other GitHub Actions workflows. If publishing itself uses Actions, invoke that deployment explicitly in the refresh workflow instead. Branch protection must permit the refresh workflow's update, or the publication step needs the repository's usual PR process.

Never place credentials in HTML, browser JavaScript, or committed files. No credentials are included in this change. The initial HTML snapshot was fetched from the real API using the existing local development credential.

## Local preview

Run `python -m http.server 4178 --bind 127.0.0.1` from the repository and visit `http://127.0.0.1:4178/#app-store-reviews`.

The section works without JavaScript. JavaScript adds previous/next controls on narrow layouts; native horizontal scrolling remains available without it. There is no automatic animation or scrolling.
