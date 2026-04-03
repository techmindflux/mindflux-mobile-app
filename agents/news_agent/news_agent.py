#!/usr/bin/env python3
"""
DTU CS Student Daily News Digest Agent

Fetches the latest events, concerts, hackathons, and tech news relevant to a
Computer Science master's student at the Technical University of Denmark (DTU),
then emails a formatted HTML digest via Gmail.

Schedule with cron to run every morning at 6 AM (see setup_cron.sh).
"""

import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anthropic
from dotenv import load_dotenv

# Load .env from the same directory as this script
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GMAIL_SENDER = os.getenv("GMAIL_SENDER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
GMAIL_RECIPIENT = os.getenv("GMAIL_RECIPIENT")
DRY_RUN = os.getenv("DRY_RUN", "false").lower() == "true"


SEARCH_PROMPT = """\
Today is {today}. You are a helpful assistant for a Computer Science master's \
student at the Technical University of Denmark (DTU) in Lyngby / Copenhagen.

Search the web and compile a morning digest covering the following categories. \
Be specific — include dates, venues, ticket/registration links, and deadlines \
where available. Prioritise events in the next 7–14 days and news from the last \
48 hours.

---

## 1. DTU & Academic Events
- Upcoming events, seminars, colloquia, and workshops at DTU or on campus
- Open PhD defenses at DTU or other Copenhagen universities
- Interesting research news or paper releases from DTU Compute / DTU departments
- Student club events (IEEE DTU, DTU Robotics, AI Study Group, etc.)

## 2. Copenhagen & Nordic Tech Events
- Hackathons, coding competitions, and programming contests in Denmark
- Tech meetups and networking events (JavaScript, Python, AI/ML, cloud, DevOps…)
- Startup and entrepreneurship events (e.g. Copenhagen Fintech, TechBBQ side events)
- Conferences or workshops in Denmark / Scandinavia relevant to CS students
- Online events open to Danish students (virtual hackathons, webinars)

## 3. Concerts & Cultural Events in Copenhagen
- Notable concerts happening this week or next in Copenhagen
- Music festivals, club nights, or free outdoor events
- Student-priced or free cultural events (museums, film screenings, art openings)
- Events accessible by public transport from DTU Lyngby campus

## 4. CS & Tech Industry News
- Major AI / ML / software engineering developments in the last 48 hours
- New open-source tools, frameworks, or significant GitHub releases
- Big tech company announcements relevant to CS developers
- EU digital policy or regulation news that could affect tech careers

## 5. Opportunities & Deadlines
- Internship or student job postings at Danish / Nordic tech companies
- Research assistant or student worker openings at DTU or Copenhagen universities
- Conference paper submission deadlines relevant to CS / AI / HCI
- Scholarship or grant opportunities for CS master's students

---

Format your entire response as clean HTML suitable for embedding inside the \
<body> of an email. Use <h2> for section headers, <h3> for sub-items, <ul>/<li> \
for lists, and <a href="…"> for all links. Do not include <html>, <head>, or \
<body> tags — only the inner content. Keep the tone friendly and scannable.\
"""


def fetch_digest(today: str) -> str:
    """Call Claude with web search to compile the daily digest. Returns HTML."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = SEARCH_PROMPT.format(today=today)
    messages = [{"role": "user", "content": prompt}]

    # Server-side tools may pause after 10 iterations; resume up to 5 times.
    max_continuations = 5
    response = None

    for attempt in range(max_continuations):
        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=8000,
            tools=[{"type": "web_search_20260209", "name": "web_search"}],
            messages=messages,
        ) as stream:
            response = stream.get_final_message()

        if response.stop_reason != "pause_turn":
            break

        # Append assistant turn and re-send so the server resumes
        messages = [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": response.content},
        ]
        print(f"  [pause_turn] Resuming (attempt {attempt + 1}/{max_continuations})…")

    if response is None:
        raise RuntimeError("No response received from Claude API.")

    # Extract all text blocks (web search results are embedded by Claude)
    parts = [block.text for block in response.content if block.type == "text"]
    return "\n".join(parts)


def build_email_html(digest_html: str, today: str) -> str:
    """Wrap digest content in a styled HTML email template."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                 "Helvetica Neue", Arial, sans-serif;
    background: #f0f2f5;
    color: #1a1a2e;
    padding: 24px 16px;
  }}
  .wrapper {{ max-width: 680px; margin: 0 auto; }}
  .header {{
    background: linear-gradient(135deg, #003366 0%, #0055a4 100%);
    color: #fff;
    padding: 32px 28px 24px;
    border-radius: 12px 12px 0 0;
    text-align: center;
  }}
  .header h1 {{ font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }}
  .header .subtitle {{
    margin-top: 6px;
    font-size: 13px;
    opacity: 0.75;
  }}
  .body {{
    background: #ffffff;
    padding: 28px 32px;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    line-height: 1.65;
    font-size: 15px;
  }}
  .body h2 {{
    color: #003366;
    font-size: 17px;
    margin: 28px 0 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e8edf3;
  }}
  .body h2:first-child {{ margin-top: 0; }}
  .body h3 {{
    color: #0055a4;
    font-size: 15px;
    margin: 16px 0 6px;
  }}
  .body p {{ margin: 8px 0; }}
  .body ul {{ padding-left: 22px; margin: 8px 0; }}
  .body li {{ margin: 6px 0; }}
  .body a {{ color: #0055a4; text-decoration: none; }}
  .body a:hover {{ text-decoration: underline; }}
  .footer {{
    text-align: center;
    padding: 20px 0 8px;
    font-size: 12px;
    color: #888;
  }}
</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>&#127891; DTU CS Student Morning Digest</h1>
      <div class="subtitle">{today} &mdash; Events, Tech News &amp; Opportunities</div>
    </div>
    <div class="body">
      {digest_html}
    </div>
  </div>
  <div class="footer">
    Generated by your AI news agent &bull; Powered by Claude &amp; Web Search<br>
    Technical University of Denmark &bull; Lyngby, Copenhagen
  </div>
</body>
</html>"""


def send_email(html_body: str, today: str) -> None:
    """Send the HTML digest via Gmail SMTP (port 465, SSL)."""
    subject = f"DTU CS Digest \u2014 {today}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_SENDER
    msg["To"] = GMAIL_RECIPIENT
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_SENDER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_SENDER, GMAIL_RECIPIENT, msg.as_string())


def main() -> None:
    # Validate required environment variables
    required = {
        "ANTHROPIC_API_KEY": ANTHROPIC_API_KEY,
        "GMAIL_SENDER": GMAIL_SENDER,
        "GMAIL_APP_PASSWORD": GMAIL_APP_PASSWORD,
        "GMAIL_RECIPIENT": GMAIL_RECIPIENT,
    }
    missing = [k for k, v in required.items() if not v]
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            f"Copy agents/news_agent/.env.example to agents/news_agent/.env and fill in the values."
        )

    today = datetime.now().strftime("%A, %B %d, %Y")
    ts = lambda: datetime.now().strftime("%H:%M:%S")  # noqa: E731

    print(f"[{ts()}] DTU CS News Agent starting — {today}")
    print(f"[{ts()}] Fetching digest via Claude + web search…")

    digest_html = fetch_digest(today)

    print(f"[{ts()}] Building email template…")
    full_html = build_email_html(digest_html, today)

    if DRY_RUN:
        out_path = os.path.join(os.path.dirname(__file__), "digest_preview.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(full_html)
        print(f"[{ts()}] DRY_RUN=true — saved preview to {out_path}")
    else:
        print(f"[{ts()}] Sending email to {GMAIL_RECIPIENT}…")
        send_email(full_html, today)
        print(f"[{ts()}] Email sent successfully!")

    print(f"[{ts()}] Done.")


if __name__ == "__main__":
    main()
