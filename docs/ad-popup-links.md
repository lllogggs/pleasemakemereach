# Ad Guide Popup Links

Use these URLs to trigger the ad onboarding popup for users arriving from paid campaigns.

## Production domain
- `https://tripdotdot.com/?utm_source=google&utm_medium=cpc` (Korean default)
- `https://tripdotdot.com/ja/?utm_source=google&utm_medium=cpc` (Japanese)
- `https://tripdotdot.com/th/?utm_source=google&utm_medium=cpc` (Thai)
- `https://tripdotdot.com/en/?utm_source=google&utm_medium=cpc` (English)

Including either `utm_source=google` **or** `utm_medium=cpc` in the query string is enough to show the popup. When the popup is dismissed, `localStorage` stores `seenAdGuide` to prevent repeat display on subsequent visits.
