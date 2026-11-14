# Mobile review

Design brief: keep the existing calm green identity, but prioritize legible entry fields, large touch targets, and readable history. Keep the meeting selector and bottom navigation familiar. Drafts within the open entry dialog should survive switching meeting types; they are discarded on closing the dialog.

Findings and corrections:
- Mobile entry: 12–14px input text was small and may trigger iOS zoom. Increased input text to 16px and touch heights to at least 48px.
- Meeting tabs: switching types discarded unsaved form data. Store a separate in-dialog draft for each type, including Rumah Doa selections and reasons.
- Long mobile history entries squeezed the edit/delete controls. Use a three-column layout with actions on a second row, wrapping names and reasons.
- Chart labels were scaled down from a 600px viewBox on narrow screens. Use a smaller viewBox and larger text, and hide legacy series labels when there are no legacy records.
- One-month boundaries at the end of long months could overflow into the next month. Clamp to the end of the target month.
- At tablet width, five summary cards exceeded available content width. Use two columns and stack charts at intermediate widths.

Validation uses a separate local D1 database, not live attendance. Test created sample records only locally. Browser checks cover 320px and 375px phones, 768px tablet and 1280px desktop, entry validation, drafts, reasons, reload persistence, and time filters. Real mobile hardware and every browser are not represented by desktop viewport emulation.

## Sticky header and compact attendance dialog

Design brief: preserve the green-and-cream identity and keep the mobile brand visible with a subtle bordered, translucent surface. Eliminate the decorative star character that some devices render as a green emoji. Keep attendance dialogs compact and lock background scrolling while the dialog is open. Date inputs must remain within their container. Rumah Doa uses a compact three-column grid with the same names and reason selection. If screen height, text zoom, or a keyboard leaves insufficient space, the dialog can still scroll so all controls remain reachable.

Observed checks: with 375×812 and 320×640 emulated viewports, the initial Ibadah Raya and Rumah Doa dialogs fit without internal scrolling, the date control stays inside the dialog, and the page does not widen beyond the viewport. At 375×812, all thirteen people could be marked absent with reasons without making the dialog scroll. The header remained at the top during scroll with the blur applied. Background scrolling was locked while the dialog was open. Validation was in an emulated desktop browser; physical iOS/Android input and keyboard behavior were not tested.
