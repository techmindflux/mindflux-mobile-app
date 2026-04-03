#!/usr/bin/env bash
# setup_cron.sh — Install the daily 6 AM cron job for the DTU CS News Agent.
#
# Usage:
#   chmod +x setup_cron.sh
#   ./setup_cron.sh
#
# The script adds a cron entry that runs news_agent.py at 06:00 every morning.
# Cron uses the system timezone; if your server is not set to Europe/Copenhagen
# (CET/CEST, UTC+1/+2), adjust the hour below accordingly:
#   UTC+1 (CET,  winter) → run at 05:00 UTC to hit 06:00 local
#   UTC+2 (CEST, summer) → run at 04:00 UTC to hit 06:00 local
# Or simply set TZ=Europe/Copenhagen in the cron environment line.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="$(which python3)"
LOG_FILE="$SCRIPT_DIR/news_agent.log"

CRON_LINE="TZ=Europe/Copenhagen"
CRON_JOB="0 6 * * * $PYTHON $SCRIPT_DIR/news_agent.py >> $LOG_FILE 2>&1"

echo "Installing cron job:"
echo "  $CRON_LINE"
echo "  $CRON_JOB"
echo ""

# Add the timezone line and job if not already present
(
  crontab -l 2>/dev/null | grep -v "news_agent.py" || true
  echo "$CRON_LINE"
  echo "$CRON_JOB"
) | crontab -

echo "Done! Verify with: crontab -l"
echo ""
echo "Logs will be written to: $LOG_FILE"
echo ""
echo "To test immediately (dry run, no email sent):"
echo "  DRY_RUN=true $PYTHON $SCRIPT_DIR/news_agent.py"
echo ""
echo "To remove the cron job:"
echo "  crontab -l | grep -v 'news_agent.py' | crontab -"
