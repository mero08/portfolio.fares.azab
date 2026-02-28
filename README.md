# Portfolio (Front-end + Back-end)

This project serves your portfolio front-end from `THE END/` and adds a Node.js back-end:

- `POST /api/contact` sends contact form messages to your email
- All submissions are logged to a small SQLite database (`data.sqlite`) using the lightweight `sqlite3` package

## Setup

1. Install Node.js (LTS).

2. Install dependencies:

```bash
npm install
```

3. Create your `.env`:

- Copy `.env.example` to `.env`
- Set `CONTACT_TO_EMAIL` to the email address where you want to receive messages
- Configure **either** SMTP (`SMTP_*`) **or** Gmail (`GMAIL_*`)

4. Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- The contact form in `THE END/index.js` calls `/api/contact` (relative URL) so it works when served by this server.
- If you open `THE END/index.html` directly (file://), the API won’t work (because there’s no server). Always run the server for full functionality.
